import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
  console.error("Missing VITE_SUPABASE_URL in .env");
}

export const supabase = supabaseUrl ? createClient(supabaseUrl, supabaseAnonKey) : null;
