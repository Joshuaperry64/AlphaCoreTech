import { createClient } from '@supabase/supabase-js';

// Credentials come from .env (VITE_ vars are inlined at build time; set the same vars in Netlify)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
