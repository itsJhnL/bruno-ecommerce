import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

/**
 * Request-scoped Supabase client for Server Components, Server Actions and
 * Route Handlers. Reads the user's session from cookies, so every query runs
 * under that user's RLS policies.
 *
 * Returns null when Supabase is not configured — callers fall back to static
 * content rather than throwing.
 */
export async function createClient() {
  if (!isSupabaseConfigured) return null;

  // `generateStaticParams`, `sitemap.ts` and `robots.ts` run at build time,
  // outside any request, where `cookies()` throws. There is no session to read
  // in that context and the data those functions need is public anyway, so the
  // right client is a plain anonymous one. Without this, a production build
  // fails the moment Supabase is configured — which is exactly when nobody is
  // expecting a new failure.
  let cookieStore: Awaited<ReturnType<typeof cookies>>;
  try {
    cookieStore = await cookies();
  } catch {
    return createAnonClient();
  }

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Session refresh is handled by middleware instead.
        }
      },
    },
  });
}

/**
 * Sessionless client for build-time and background work. Runs as `anon`, so it
 * sees exactly what a logged-out visitor sees and nothing more.
 */
export function createAnonClient() {
  if (!isSupabaseConfigured) return null;

  return createSupabaseClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
