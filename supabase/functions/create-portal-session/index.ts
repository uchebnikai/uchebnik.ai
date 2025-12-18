import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    const { returnUrl } = await req.json()

    // Use Admin client for robust DB access to bypass RLS policies if necessary
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch stored Stripe Customer ID
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    let customerId = profile?.stripe_customer_id

    // Fallback: If not in DB, search in Stripe by email (Self-healing)
    if (!customerId && user.email) {
        console.log(`Customer ID missing in DB for user ${user.id}. Searching Stripe by email...`);
        const customers = await stripe.customers.list({
            email: user.email,
            limit: 1
        });
        
        if (customers.data.length > 0) {
            customerId = customers.data[0].id;
            console.log(`Found customer ${customerId} via email. Updating DB...`);
            // Attempt to self-heal the DB record
            await supabaseAdmin
                .from('profiles')
                .update({ stripe_customer_id: customerId })
                .eq('id', user.id);
        }
    }

    if (!customerId) {
      console.error(`No Stripe customer found for user ${user.id} (email: ${user.email})`);
      throw new Error('No Stripe customer record found. Please contact support.')
    }

    console.log(`Creating portal session for customer ${customerId}`);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error("Create Portal Session Error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})