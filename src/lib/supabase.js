import { createClient } from '@supabase/supabase-js';

// Credentials come from environment variables (Netlify host / local .env)
const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL)) || '';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)) || '';

export const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;
