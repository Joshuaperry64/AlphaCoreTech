import { createClient } from '@supabase/supabase-js';

// Credentials come from .env (inlined at build time)
const supabaseUrl = import.meta.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || 'https://dmlcergmwkotcbyylpdb.supabase.co';
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_qOYOw9CHH3nTTd-_-kxqXQ_2iZYNlb2';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
