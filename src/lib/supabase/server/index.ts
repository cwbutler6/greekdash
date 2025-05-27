import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for the entire server
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-for-build-time.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key-for-build-time';

// Function to check if we're in a production environment
const isProduction = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'build';

// Only throw an error for missing variables in production runtime, not during build
if (isProduction && (!supabaseUrl || !supabaseServiceKey)) {
  throw new Error('Missing Supabase environment variables');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
};
