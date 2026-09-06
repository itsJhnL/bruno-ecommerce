/**
 * One place that decides whether Supabase is wired up.
 *
 * Until the user creates a project and fills .env.local, every query falls
 * back to the curated static catalogue (Memory.md D-011). This keeps the site
 * reviewable before the database exists, and makes a production outage degrade
 * to a beautiful page instead of a stack trace.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured: boolean =
  SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 20;
