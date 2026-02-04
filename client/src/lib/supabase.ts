
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://hmdycuhxetnwcnbwhwua.supabase.co';
const SUPABASE_KEY = 'sb_publishable_lhmomCyqpnkUDgvqjZYpaQ_1N9AZC9-';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
