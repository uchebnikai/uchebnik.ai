
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

    // Check Admin Authorization (You can enhance this by checking a specific user role)
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Not authenticated')
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // 1. Fetch Balance (Money currently held)
    const balance = await stripe.balance.retrieve();
    
    // 2. Fetch Recent Charges (Last 100 successful payments to calculate Gross)
    // Note: In a production app with thousands of charges, you'd use Stripe Sigma or Reports API.
    // For this dashboard, summing recent charges gives a good "Recent Revenue" snapshot.
    const charges = await stripe.charges.list({ limit: 100, status: 'succeeded' });
    const totalGross = charges.data.reduce((acc: number, charge: any) => acc + charge.amount, 0);

    // 3. Fetch Subscriptions for MRR (Monthly Recurring Revenue) estimate
    const subscriptions = await stripe.subscriptions.list({ limit: 100, status: 'active' });
    
    let mrr = 0;
    subscriptions.data.forEach((sub: any) => {
        if (sub.items.data.length > 0) {
            const item = sub.items.data[0];
            // Normalize to monthly
            if (item.plan.interval === 'month') {
                mrr += item.price.unit_amount * item.quantity;
            } else if (item.plan.interval === 'year') {
                mrr += (item.price.unit_amount * item.quantity) / 12;
            }
        }
    });

    return new Response(
      JSON.stringify({ 
        balance: balance.available[0]?.amount || 0,
        pending: balance.pending[0]?.amount || 0,
        currency: balance.available[0]?.currency || 'eur',
        totalGrossRecent: totalGross,
        mrr: mrr
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error(error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
