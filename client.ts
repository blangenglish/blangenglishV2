import { createClient } from '@supabase/supabase-js'

// Credentials are loaded from VITE_ environment variables (populated in .env at project root).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
