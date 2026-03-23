import { createClient } from "@supabase/supabase-js";

const fallbackUrl = "https://example.supabase.co";
const fallbackKey = "public-anon-key";

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? fallbackUrl;
export const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  fallbackKey;
export const isSupabaseConfigured =
  supabaseUrl !== fallbackUrl && supabaseAnonKey !== fallbackKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
