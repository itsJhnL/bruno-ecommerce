import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

/**
 * Who is asking.
 *
 * `supabase.auth.getUser()` is used rather than `getSession()` on purpose: the
 * former revalidates the JWT with Supabase, the latter trusts whatever is in
 * the cookie. On a server, where the answer decides what data is returned,
 * only the revalidated one is safe.
 */

export interface AccountUser {
  id: string;
  email: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: UserRole;
  acceptsMarketing: boolean;
  createdAt: string;
}

/** The signed-in user's id, or null. Cheap: no profile join. */
export async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** The signed-in user with their profile, or null. */
export async function getAccountUser(): Promise<AccountUser | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, first_name, last_name, phone, role, accepts_marketing, created_at")
    .eq("id", user.id)
    .maybeSingle();

  // The profile row is created by a trigger on auth.users. If it is missing,
  // something is wrong with the database, not with this request — report what
  // is known rather than pretending the user is signed out.
  return {
    id: user.id,
    email: profile?.email ?? user.email ?? "",
    fullName: profile?.full_name ?? null,
    firstName: profile?.first_name ?? null,
    lastName: profile?.last_name ?? null,
    phone: profile?.phone ?? null,
    role: (profile?.role as UserRole | undefined) ?? "CUSTOMER",
    acceptsMarketing: profile?.accepts_marketing ?? false,
    createdAt: profile?.created_at ?? user.created_at,
  };
}

/**
 * For pages under /account. Middleware already redirects anonymous requests,
 * so reaching this without a user means middleware was bypassed or the session
 * expired mid-render — either way the page must not render.
 */
export async function requireAccountUser(next = "/account"): Promise<AccountUser> {
  const user = await getAccountUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}
