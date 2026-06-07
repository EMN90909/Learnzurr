// Supabase client initialization for frontend (client-side)
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_FRONTEND_URL, SUPABASE_FRONTEND_ANON_KEY } from "../../config/supabase";

declare global {
  interface Window {
    __STRUTA_ENV__?: Record<string, string | undefined>;
  }
}

const runtimeEnv = typeof window !== "undefined" ? window.__STRUTA_ENV__ : undefined;

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  runtimeEnv?.VITE_SUPABASE_URL ||
  runtimeEnv?.NEXT_PUBLIC_SUPABASE_URL ||
  runtimeEnv?.SUPABASE_URL ||
  SUPABASE_FRONTEND_URL;

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  runtimeEnv?.VITE_SUPABASE_ANON_KEY ||
  runtimeEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  runtimeEnv?.SUPABASE_ANON_KEY ||
  SUPABASE_FRONTEND_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase frontend configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Render environment variables or .env.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});