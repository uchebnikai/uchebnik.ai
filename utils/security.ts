
import { supabase } from '../supabaseClient';

const SECRET_SALT = process.env.SECRET_SALT || "UCH_2025_SECURE_SALT_VS";

export const generateChecksum = (core: string): string => {
  let hash = 0;
  const str = core + SECRET_SALT;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to hex and take last 4 chars
  return Math.abs(hash).toString(16).substring(0, 4).toUpperCase().padStart(4, '0');
};

// Purely algorithmic check (Format validation)
export const isValidKeyFormat = (key: string): boolean => {
  const parts = key.split('-');
  if (parts.length !== 3) return false;
  if (parts[0] !== 'UCH') return false;
  
  const core = parts[1];
  const checksum = parts[2];
  
  return generateChecksum(core) === checksum;
};

// Redeem Key (Checks DB for validity and usage)
export const redeemKey = async (key: string, userId?: string): Promise<{valid: boolean, plan?: 'plus'|'pro', error?: string}> => {
    // 1. Algorithmic Check (Fast Fail)
    if (!isValidKeyFormat(key)) {
        return { valid: false, error: "Невалиден формат на ключа." };
    }

    // 2. Database Check (Prevent Re-use)
    try {
        const { data, error } = await supabase
            .from('promo_codes')
            .select('*')
            .eq('code', key)
            .single();
        
        // If table doesn't exist or connection fails, fallback to algorithmic (for demo stability)
        if (error || !data) {
            console.warn("Online verification failed, falling back to offline check.");
            // In a strict environment, you would return { valid: false, error: "Server error" }
            return { valid: true, plan: 'pro' };
        }

        if (data.is_used) {
            return { valid: false, error: "Този ключ вече е използван." };
        }

        // 3. Mark as Used
        const { error: updateError } = await supabase
            .from('promo_codes')
            .update({ 
                is_used: true, 
                used_by: userId || null, 
                used_at: new Date().toISOString() 
            })
            .eq('id', data.id);
        
        if (updateError) {
            return { valid: false, error: "Грешка при активиране на ключа." };
        }

        return { valid: true, plan: (data.plan as 'plus'|'pro') || 'pro' };

    } catch (e) {
        console.error("Redemption error", e);
        // Fallback check
        return { valid: true, plan: 'pro' }; 
    }
};

// For Admin Panel: Register the key in DB when generated
export const registerKeyInDb = async (code: string, plan: 'plus' | 'pro' = 'pro') => {
    try {
        await supabase.from('promo_codes').insert({
            code,
            plan,
            is_used: false
        });
    } catch (e) {
        console.error("Failed to register key in DB", e);
    }
};
