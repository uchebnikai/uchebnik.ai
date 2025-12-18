import { supabase } from '../supabaseClient';

export const STRIPE_PRICES = {
  PLUS: 'price_1SfPSpE0C0vexh9Cg2YUGPah',
  PRO: 'price_1SfPTEE0C0vexh9C9RZMvkHB'
};

export const createCheckoutSession = async (priceId: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("User not authenticated");

  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { 
      priceId,
      returnUrl: window.location.origin 
    }
  });

  if (error) throw error;
  if (data?.url) {
    window.location.href = data.url;
  }
  return data;
};

export const createPortalSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("User not authenticated");

  const { data, error } = await supabase.functions.invoke('create-portal', {
    body: { 
      returnUrl: window.location.origin 
    }
  });

  if (error) throw error;
  if (data?.url) {
    window.location.href = data.url;
  }
  return data;
};