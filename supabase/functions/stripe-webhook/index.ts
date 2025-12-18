import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

declare const Deno: any;

// Price IDs (TEST MODE)
const PRICES = {
  FREE: 'price_1SfhklE0C0vexh9CpxGIMsst',
  PLUS: 'price_1Sfhl3E0C0vexh9CQsMo20Hl',
  PRO:  'price_1SfhlFE0C0vexh9CFPbCNZDw'
}

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // 1. Verify Request
    // IMPORTANT: Use constructEventAsync to avoid "SubtleCryptoProvider cannot be used in a synchronous context"
    const body = await req.text()
    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')
    
    let event;
    try {
        event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret!)
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`)
        return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    // 2. Initialize Admin Client (Service Role)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Received event: ${event.type}`)

    // Helper: Update Plan
    const handleSubscriptionUpdate = async (subscription: any, customerId: string, explicitUserId?: string) => {
        let userId = explicitUserId;

        // If user ID not provided (e.g. renewal/update event), look up by Stripe Customer ID
        if (!userId) {
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('stripe_customer_id', customerId)
                .single()
            userId = profile?.id
        }

        if (!userId) {
            console.error(`User not found for customer ID: ${customerId}`)
            return
        }

        const priceId = subscription.items.data[0].price.id
        const status = subscription.status
        
        let plan = 'free'
        
        // Map Price ID to Plan
        if (status === 'active' || status === 'trialing') {
            if (priceId === PRICES.PLUS) plan = 'plus'
            else if (priceId === PRICES.PRO) plan = 'pro'
        }

        console.log(`Processing update for User: ${userId} | Price: ${priceId} | Plan: ${plan} | Status: ${status}`)

        // Update DB: Update specific fields while preserving others
        // We assume 'settings' contains a 'plan' field, or there is a root 'plan' column.
        // Adjust based on your specific schema. Here we try updating both common patterns.
        
        // Fetch current settings first to merge if needed
        const { data: currentProfile } = await supabaseAdmin.from('profiles').select('settings').eq('id', userId).single();
        const currentSettings = currentProfile?.settings || {};

        const { error } = await supabaseAdmin.from('profiles').update({ 
            plan: plan, // If you have a root column
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customerId,
            settings: {
                ...currentSettings,
                plan: plan
            }
        }).eq('id', userId)

        if (error) console.error('Error updating profile:', error)
        else console.log(`Successfully updated user ${userId} to plan ${plan}`)
    }

    // 3. Handle Events
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object
        const userId = session.metadata?.supabase_user_id
        
        console.log(`Checkout completed for user: ${userId}`)

        if (session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
            await handleSubscriptionUpdate(subscription, session.customer as string, userId)
        }
    } 
    else if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
        const subscription = event.data.object
        await handleSubscriptionUpdate(subscription, subscription.customer as string)
    }
    else if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object
        const customerId = subscription.customer as string
        
        console.log(`Subscription deleted for customer: ${customerId}`)

        const { data: profile } = await supabaseAdmin.from('profiles').select('id, settings').eq('stripe_customer_id', customerId).single()
        if (profile) {
            const currentSettings = profile.settings || {};
            await supabaseAdmin.from('profiles').update({ 
                plan: 'free', 
                stripe_subscription_id: null,
                settings: { ...currentSettings, plan: 'free' }
            }).eq('id', profile.id)
        }
    }
    else if (event.type === 'invoice.paid') {
        // Good for ensuring status stays synced on renewal
        const invoice = event.data.object
        if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
            await handleSubscriptionUpdate(subscription, invoice.customer as string)
        }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error(`Webhook handler failed: ${error.message}`)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})