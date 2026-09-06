import "server-only";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const CART_COOKIE = "bruno_cart";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

/**
 * Cart ownership.
 *
 * A signed-in customer's cart is keyed on their profile and protected by RLS.
 * A guest's cart is keyed on an unguessable token in an httpOnly cookie, which
 * RLS cannot express — there is no authenticated principal to compare against.
 *
 * So guest carts are reached with the service-role client, and this module is
 * the ONLY place outside `lib/actions/admin/**` and the webhook handlers that
 * is allowed to use it (Agents.md §5, extended by Memory.md D-019). Keeping the
 * exception in one file is what makes it auditable: every cart read and write
 * goes through `resolveCart` or `ensureCart` below, both of which scope the
 * query to a cart id that was derived from the caller's own cookie or session.
 */

export interface CartContext {
  cartId: string | null;
  profileId: string | null;
  /** True when the cart belongs to a signed-in customer. */
  isCustomer: boolean;
}

function newToken(): string {
  return randomBytes(24).toString("base64url");
}

async function currentProfileId(): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/**
 * Read-only resolution, safe from a Server Component. Never creates a cart and
 * never sets a cookie — a page render must not have side effects.
 */
export async function resolveCart(): Promise<CartContext> {
  const admin = createAdminClient();
  if (!admin) return { cartId: null, profileId: null, isCustomer: false };

  const profileId = await currentProfileId();

  if (profileId) {
    const { data } = await admin
      .from("carts")
      .select("id")
      .eq("profile_id", profileId)
      .maybeSingle();
    return { cartId: data?.id ?? null, profileId, isCustomer: true };
  }

  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!token) return { cartId: null, profileId: null, isCustomer: false };

  const { data } = await admin
    .from("carts")
    .select("id")
    .eq("session_token", token)
    .maybeSingle();

  return { cartId: data?.id ?? null, profileId: null, isCustomer: false };
}

/**
 * Resolution that creates. Only callable from a Server Action or Route Handler,
 * because it may write the guest cookie.
 */
export async function ensureCart(): Promise<CartContext> {
  const admin = createAdminClient();
  if (!admin) return { cartId: null, profileId: null, isCustomer: false };

  const profileId = await currentProfileId();

  if (profileId) {
    const { data, error } = await admin.rpc("ensure_cart", { p_profile_id: profileId });
    if (error) throw error;
    return { cartId: data as string, profileId, isCustomer: true };
  }

  const jar = await cookies();
  let token = jar.get(CART_COOKIE)?.value;

  if (!token) {
    token = newToken();
    jar.set(CART_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: THIRTY_DAYS,
    });
  }

  const { data, error } = await admin.rpc("ensure_cart", { p_session_token: token });
  if (error) throw error;
  return { cartId: data as string, profileId: null, isCustomer: false };
}

/**
 * Folds whatever the visitor collected as a guest into their own cart, then
 * drops the guest cookie so the two cannot diverge.
 *
 * NOT YET CALLED. It belongs immediately after a successful sign-in, and there
 * is no sign-in flow until Phase 3. The SQL side is covered by
 * `npm run test:db`; this wrapper is not, because nothing reaches it. Wiring it
 * is one call in the Phase 3 login action — do not assume it already runs.
 */
export async function mergeGuestCartIntoProfile(profileId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const jar = await cookies();
  const token = jar.get(CART_COOKIE)?.value;
  if (!token) return;

  const { error } = await admin.rpc("merge_guest_cart", {
    p_session_token: token,
    p_profile_id: profileId,
  });
  if (error) throw error;

  jar.delete(CART_COOKIE);
}

/** Confirms a cart id really belongs to the caller before any mutation. */
export async function assertOwnsCart(cartId: string): Promise<boolean> {
  const context = await resolveCart();
  return context.cartId === cartId;
}
