import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { SUPABASE_URL, isSupabaseConfigured } from "./config";

/**
 * Service-role client. BYPASSES ROW LEVEL SECURITY.
 *
 * Per Agents.md rule 4 and §5, this may only be used inside
 * `lib/actions/admin/**` and webhook handlers, and every call site must
 * perform its own authorization check first. The `server-only` import above
 * makes importing this from a Client Component a build error.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!isSupabaseConfigured || !serviceKey) return null;

  return createSupabaseClient<Database>(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
