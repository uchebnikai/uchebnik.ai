
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Stripe } from 'https://esm.sh/stripe@12.0.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Fix: Cast Deno to any to access env property
const stripe = new Stripe((Deno as any).env.get('STRIPE_SECRET_KEY') ?? '', {
  httpClient: Stripe.createFetchHttpClient(),
})

// Fix: Cast Deno to any to access env property
const supabaseUrl = (Deno as any).env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  try {
    const body = await req.text()
    // Fix: Cast Deno to any to access env property
    const event = stripe.webhooks.constructEvent(
      body,
      signature ?? '',
      (Deno as any).env.get('STRIPE_WEBHOOK_SECRET') ?? ''
    )

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Process the payment completion event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.metadata?.userId
      const planName = session.metadata?.planName || 'plus'

      if (userId) {
        // Direct database update using service role to bypass RLS
        const { error } = await supabase
          .from('profiles')
          .update({ plan: planName })
          .eq('id', userId)

        if (error) throw error
        console.log(`User ${userId} successfully upgraded to ${planName}`)
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    console.error(`Stripe Webhook Error: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})
