"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

let cached: ReturnType<typeof createBrowserClient<Database>> | null = null;

/** Browser Supabase client. Anon key only — never a service role key. */
export function createClient() {
  if (!isSupabaseConfigured) return null;
  cached ??= createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  return cached;
}
