
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bkllurmpfwpqnjvclrbe.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_XJBrHOyzbSIbFOS3ZSnVFA_XH4wTFU0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
