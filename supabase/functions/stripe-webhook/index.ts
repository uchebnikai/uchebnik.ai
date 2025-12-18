import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0";

const stripe = new Stripe((Deno as any).env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2022-11-15",
});

const endpointSecret = (Deno as any).env.get("STRIPE_WEBHOOK_SIGNING_SECRET");

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature || !endpointSecret) {
    return new Response("Webhook Error: Missing signature or secret", { status: 400 });
  }

  let event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(
    (Deno as any).env.get("SUPABASE_URL") ?? "",
    (Deno as any).env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.client_reference_id;
    const subscriptionId = session.subscription;

    if (userId) {
      // Determine plan based on amount or price ID lookup if needed
      // Here assuming we get price from line items expansion or just set to paid state
      // For robustness, retrieve subscription to check price
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0].price.id;
      
      let plan = 'free';
      if (priceId === 'price_1SfPSpE0C0vexh9Cg2YUGPah') plan = 'plus';
      if (priceId === 'price_1SfPTEE0C0vexh9C9RZMvkHB') plan = 'pro';

      // Update profile
      const { data: currentProfile } = await supabase.from('profiles').select('settings').eq('id', userId).single();
      const currentSettings = currentProfile?.settings || {};

      await supabase.from("profiles").update({
        stripe_customer_id: session.customer,
        stripe_subscription_id: subscriptionId,
        settings: { ...currentSettings, plan }
      }).eq("id", userId);
    }
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object;
    const { data: profile } = await supabase.from("profiles").select("id, settings").eq("stripe_customer_id", subscription.customer).single();
    
    if (profile) {
      const priceId = subscription.items.data[0].price.id;
      let plan = 'free';
      
      if (subscription.status === 'active') {
          if (priceId === 'price_1SfPSpE0C0vexh9Cg2YUGPah') plan = 'plus';
          if (priceId === 'price_1SfPTEE0C0vexh9C9RZMvkHB') plan = 'pro';
      }

      await supabase.from("profiles").update({
        settings: { ...profile.settings, plan }
      }).eq("id", profile.id);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const { data: profile } = await supabase.from("profiles").select("id, settings").eq("stripe_customer_id", subscription.customer).single();
    
    if (profile) {
      await supabase.from("profiles").update({
        settings: { ...profile.settings, plan: 'free' },
        stripe_subscription_id: null
      }).eq("id", profile.id);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});