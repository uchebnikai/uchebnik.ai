import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno"

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const rawKey = (Deno as any).env.get('STRIPE_SECRET_KEY') || ''
  const stripeKey = rawKey.trim()
  
  const stripe = new Stripe(stripeKey, {
    apiVersion: '2022-11-15',
    httpClient: Stripe.createFetchHttpClient(),
  })
  
  try {
    const body = await req.text()
    const endpointSecret = (Deno as any).env.get('STRIPE_WEBHOOK_SIGNING_SECRET')
    let event;

    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(body, signature || '', endpointSecret)
    } else {
      event = JSON.parse(body)
    }

    const supabaseUrl = (Deno as any).env.get('SUPABASE_URL') || ''
    const supabaseKey = (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.client_reference_id
      const customerId = session.customer
      
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
      const priceId = lineItems.data[0].price.id
      
      let plan = 'free'
      if (priceId === 'price_1SfPSpE0C0vexh9Cg2YUGPah') plan = 'plus'
      if (priceId === 'price_1SfPTEE0C0vexh9C9RZMvkHB') plan = 'pro'

      await supabase.from('profiles').update({ 
        stripe_customer_id: customerId,
        plan: plan,
        subscription_status: 'active'
      }).eq('id', userId)
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object
      await supabase.from('profiles').update({ 
        plan: 'free',
        subscription_status: 'inactive'
      }).eq('stripe_customer_id', subscription.customer)
    }

    if (event.type === 'customer.subscription.updated') {
        const subscription = event.data.object;
        const priceId = subscription.items.data[0].price.id;
        
        let plan = 'free';
        if (priceId === 'price_1SfPSpE0C0vexh9Cg2YUGPah') plan = 'plus';
        if (priceId === 'price_1SfPTEE0C0vexh9C9RZMvkHB') plan = 'pro';

        await supabase.from('profiles').update({ 
            plan: plan,
            subscription_status: subscription.status === 'active' ? 'active' : 'inactive'
        }).eq('stripe_customer_id', subscription.customer);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})
