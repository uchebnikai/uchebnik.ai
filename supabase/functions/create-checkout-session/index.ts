
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Stripe } from 'https://esm.sh/stripe@12.0.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeSecret = (Deno as any).env.get('STRIPE_SECRET_KEY')
    if (!stripeSecret) {
      throw new Error("Missing STRIPE_SECRET_KEY environment variable")
    }

    const stripe = new Stripe(stripeSecret, {
      httpClient: Stripe.createFetchHttpClient(),
    })

    const { priceId, userId, userEmail, planName } = await req.json()

    if (!priceId || !userId) {
      throw new Error("Missing priceId or userId")
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      // The headers origin ensures we go back to the correct domain (local or production)
      success_url: `${req.headers.get('origin')}/?payment=success`,
      cancel_url: `${req.headers.get('origin')}/?payment=cancel`,
      metadata: { 
        userId: userId, 
        planName: planName 
      },
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Stripe Checkout Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
