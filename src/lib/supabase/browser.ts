import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function createBrowserSupabaseClient() {
  if (typeof window === "undefined" || !isSupabaseConfigured()) return null;

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
  );
}
