import { createClient } from '@supabase/supabase-js';

// Use the provided Supabase credentials directly.
const supabaseUrl = 'https://yxlhgmilucfgooprmeha.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bGhnbWlsdWNmZ29vcHJtZWhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTUzMTQsImV4cCI6MjA3NjYzMTMxNH0.d1aQEPdfJao6_gj5dye1N3j3j6T4kNWxvq4omIB6CQ0';

// Check if the environment variables are set, which is crucial for the app to function.
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = 'Supabase URL and/or Anon Key are not configured. Please ensure SUPABASE_URL and SUPABASE_ANON_KEY environment variables are set.';
  console.error(errorMessage);
  // We throw an error to halt execution because the app cannot work without a database connection.
  throw new Error(errorMessage);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);