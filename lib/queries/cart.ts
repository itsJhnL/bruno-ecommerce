import "server-only";

import { resolveCart } from "@/lib/cart/session";
import { EMPTY_CART, toCartPricing } from "@/lib/queries/normalize";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAnonClient } from "@/lib/supabase/server";
import type { CartPricing, ShippingOption } from "@/types";

/**
 * Reads for the cart and checkout.
 *
 * Unlike the catalogue queries, none of these fall back to static content: an
 * unreachable database must not produce a cart that looks real. They return an
 * empty cart, and the UI says the store is not connected (Memory.md D-011).
 */

interface CartOptions {
  shippingMethodId?: string | null;
  /** Overrides the coupon stored on the cart — used while the customer types. */
  couponCode?: string | null;
}

/** The whole cart, priced by Postgres. */
export async function getCart(options: CartOptions = {}): Promise<CartPricing> {
  const admin = createAdminClient();
  if (!admin) return EMPTY_CART;

  const { cartId, profileId } = await resolveCart();
  if (!cartId) return EMPTY_CART;

  const { data, error } = await admin.rpc("price_cart", {
    p_cart_id: cartId,
    p_shipping_method_id: options.shippingMethodId ?? null,
    p_coupon_code: options.couponCode ?? null,
    p_profile_id: profileId,
  });

  if (error) {
    console.error("getCart: price_cart failed", error.message);
    return EMPTY_CART;
  }

  return toCartPricing(data);
}

/**
 * Just the badge number on the header. Counts units rather than lines, because
 * "3" next to a bag icon means three pieces to a shopper.
 */
export async function getCartCount(): Promise<number> {
  const admin = createAdminClient();
  if (!admin) return 0;

  const { cartId } = await resolveCart();
  if (!cartId) return 0;

  const { data, error } = await admin
    .from("cart_items")
    .select("quantity")
    .eq("cart_id", cartId);

  if (error || !data) return 0;
  return data.reduce((total, row) => total + row.quantity, 0);
}

/**
 * Is the database actually answering?
 *
 * `isSupabaseConfigured` only says the environment variables look plausible. A
 * project can be reachable with no schema applied — which is the state this
 * repo ships in until somebody runs `supabase/apply-all.sql`. Without this
 * distinction the cart says "your bag is empty" when the truth is "there is no
 * cart table", which is the fake-success Agents.md directive #1 forbids.
 */
export async function getStoreHealth(): Promise<"ready" | "unreachable" | "unconfigured"> {
  const supabase = createAnonClient();
  if (!supabase) return "unconfigured";

  const { error } = await supabase.from("shipping_methods").select("id").limit(1);
  return error ? "unreachable" : "ready";
}

/** Shipping choices offered at checkout, cheapest first. */
export async function getShippingOptions(): Promise<ShippingOption[]> {
  const supabase = createAnonClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("shipping_methods")
    .select("id, name, description, price, free_over, min_delivery_days, max_delivery_days")
    .eq("is_active", true)
    .order("position");

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    freeOver: row.free_over === null ? null : Number(row.free_over),
    minDays: row.min_delivery_days,
    maxDays: row.max_delivery_days,
  }));
}
