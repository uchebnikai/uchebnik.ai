import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

declare const Deno: any;

const TEST_PRICES = {
  FREE: 'price_1SfhklE0C0vexh9CpxGIMsst',
  PLUS: 'price_1Sfhl3E0C0vexh9CQsMo20Hl',
  PRO: 'price_1SfhlFE0C0vexh9CFPbCNZDw'
}

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const stripe = new Stripe((Deno as any).env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const body = await req.text()
    const endpointSecret = (Deno as any).env.get('STRIPE_WEBHOOK_SIGNING_SECRET')
    
    let event;
    try {
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret!)
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`)
        return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    // Initialize Admin Client (Service Role) - No Auth Headers needed for public webhook
    const supabaseAdmin = createClient(
      (Deno as any).env.get('SUPABASE_URL') ?? '',
      (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Received event: ${event.type}`)

    const handleSubscriptionUpdate = async (subscription: any, customerId: string, explicitUserId?: string) => {
        let userId = explicitUserId;

        // If user ID not provided (e.g. renewal event), look up by Stripe Customer ID
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
        // Map price to plan
        if (status === 'active' || status === 'trialing') {
            if (priceId === TEST_PRICES.PLUS) plan = 'plus'
            if (priceId === TEST_PRICES.PRO) plan = 'pro'
        }

        console.log(`Updating user ${userId}: Plan=${plan}, Status=${status}, Price=${priceId}`)

        await supabaseAdmin.from('profiles').update({ 
            plan: plan,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customerId 
        }).eq('id', userId)
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object
        // Check both common metadata keys for user ID
        const userId = session.metadata?.supabase_user_id || session.metadata?.user_id
        
        console.log(`Checkout completed. User: ${userId}, Customer: ${session.customer}`)

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
        
        const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('stripe_customer_id', customerId).single()
        if (profile) {
            console.log(`Subscription deleted for user ${profile.id}. Downgrading to free.`)
            await supabaseAdmin.from('profiles').update({ plan: 'free', stripe_subscription_id: null }).eq('id', profile.id)
        }
    }
    else if (event.type === 'invoice.paid') {
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

  } catch (error) {
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