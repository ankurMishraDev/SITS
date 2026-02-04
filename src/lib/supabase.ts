import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your Supabase project credentials
const SUPABASE_URL = 'https://azdxjjrsbwpzaxvbuxay.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6ZHhqanJzYndwemF4dmJ1eGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NjU0NDIsImV4cCI6MjA4NTQ0MTQ0Mn0.5Hr_0g2AjgC2eSeMsorFpnra2jVRTiFXV8suX2TBOBA';

// Note: Using untyped client to avoid type complexity with Supabase's generated types
// Types are enforced at the application level via explicit type assertions
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // No auth needed for single-user app
  },
});
