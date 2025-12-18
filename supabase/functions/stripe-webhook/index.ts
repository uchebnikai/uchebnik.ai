import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

// Test Price IDs Mapping
const STRIPE_PRICES = {
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

    // Initialize Admin Client (Bypass RLS)
    const supabaseAdmin = createClient(
      (Deno as any).env.get('SUPABASE_URL') ?? '',
      (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Processing event: ${event.type}`)

    // 1. Handle Checkout Completed (Initial Subscription)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.metadata?.supabase_user_id
      const customerId = session.customer
      const subscriptionId = session.subscription

      if (userId && customerId) {
         // Retrieve subscription to get exact price/plan
         const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)
         const priceId = subscription.items.data[0].price.id
         
         let plan = 'free'
         if (priceId === STRIPE_PRICES.PLUS) plan = 'plus'
         if (priceId === STRIPE_PRICES.PRO) plan = 'pro'

         await supabaseAdmin
          .from('profiles')
          .update({ 
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan: plan
          })
          .eq('id', userId)
          
         console.log(`[Checkout] User ${userId} upgraded to ${plan}`)
      }
    }

    // 2. Handle Subscription Updates (Upgrade/Downgrade/Renewal)
    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
        const subscription = event.data.object
        const customerId = subscription.customer
        const priceId = subscription.items.data[0].price.id
        const status = subscription.status

        let plan = 'free'
        // Only grant access if active or trialing
        if (status === 'active' || status === 'trialing') {
            if (priceId === STRIPE_PRICES.PLUS) plan = 'plus'
            if (priceId === STRIPE_PRICES.PRO) plan = 'pro'
        }
        
        // Update user based on stripe_customer_id
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()
            
        if (profile) {
            await supabaseAdmin
                .from('profiles')
                .update({ 
                    plan: plan,
                    stripe_subscription_id: subscription.id
                })
                .eq('id', profile.id)
            console.log(`[Update] User ${profile.id} plan set to ${plan}`)
        }
    }

    // 3. Handle Cancellations
    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object
        const customerId = subscription.customer
        
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()
            
        if (profile) {
            await supabaseAdmin
                .from('profiles')
                .update({ plan: 'free', stripe_subscription_id: null })
                .eq('id', profile.id)
            console.log(`[Delete] User ${profile.id} downgraded to free`)
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