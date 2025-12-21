
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts"

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to sign JWT for Google Auth
async function getGoogleAccessToken(serviceAccountJson: any) {
  if (!serviceAccountJson) return null;
  
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccountJson.client_email,
    scope: "https://www.googleapis.com/auth/cloud-billing https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  try {
    const key = await crypto.subtle.importKey(
        "pkcs8",
        str2ab(serviceAccountJson.private_key),
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const jwt = await create({ alg: "RS256", typ: "JWT" }, claim, key);

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const data = await res.json();
    return data.access_token;
  } catch (e) {
    console.error("Google Auth Error", e);
    return null;
  }
}

function str2ab(str: string) {
  const pem = str.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s/g, "");
  const binaryString = atob(pem);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
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
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    let stripeData = { balance: 0, pending: 0, currency: 'eur', totalGrossRecent: 0, mrr: 0, googleCloudCost: 0, googleCloudConnected: false, lastSync: new Date().toISOString() };

    if (stripeKey) {
        const stripe = new Stripe(stripeKey, {
            apiVersion: '2022-11-15',
            httpClient: Stripe.createFetchHttpClient(),
        })

        const balance = await stripe.balance.retrieve();
        const subscriptions = await stripe.subscriptions.list({ limit: 100, status: 'active' });
        
        let mrr = 0;
        subscriptions.data.forEach((sub: any) => {
            if (sub.items.data.length > 0) {
                const item = sub.items.data[0];
                if (item.plan.interval === 'month') mrr += item.price.unit_amount * item.quantity;
                else if (item.plan.interval === 'year') mrr += (item.price.unit_amount * item.quantity) / 12;
            }
        });

        stripeData.balance = balance.available[0]?.amount || 0;
        stripeData.pending = balance.pending[0]?.amount || 0;
        stripeData.mrr = mrr;
    }

    const serviceAccountStr = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    let billingId = Deno.env.get('GOOGLE_BILLING_ACCOUNT_ID');

    if (serviceAccountStr && billingId) {
        try {
            if (!billingId.startsWith('billingAccounts/')) {
                billingId = `billingAccounts/${billingId}`;
            }

            const serviceAccount = JSON.parse(serviceAccountStr);
            const accessToken = await getGoogleAccessToken(serviceAccount);
            
            if (accessToken) {
                stripeData.googleCloudConnected = true;

                // Call Budgets API
                const budgetRes = await fetch(`https://billingbudgets.googleapis.com/v1/${billingId}/budgets`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                
                const budgetData = await budgetRes.json();
                
                if (budgetData.budgets && budgetData.budgets.length > 0) {
                    let totalSpend = 0;
                    
                    // Sum up actual spend from all budgets associated with this account
                    for (const budget of budgetData.budgets) {
                        const spend = budget.calculatedSpend?.actualSpend;
                        if (spend) {
                            const units = Number(spend.units || 0);
                            const nanos = Number(spend.nanos || 0);
                            // Combine units and nanos (1 billion nanos = 1 unit)
                            totalSpend += units + (nanos / 1000000000);
                        }
                    }
                    
                    stripeData.googleCloudCost = totalSpend;
                } else {
                    console.log("Connected to Google Cloud, but no budgets found.");
                }
            }
        } catch (e) {
            console.error("Google Billing Fetch Error", e);
        }
    }

    return new Response(
      JSON.stringify(stripeData),
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
