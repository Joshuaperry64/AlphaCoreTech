import { createClient } from '@supabase/supabase-js';

// Hardcoded publishable keys to ensure persistence across different hosting providers
const supabaseUrl = 'https://dmlcergmwkotcbyylpdb.supabase.co';
const supabaseAnonKey = 'sb_publishable_qOYOw9CHH3nTTd-_-kxqXQ_2iZYNlb2';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
