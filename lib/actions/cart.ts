"use server";

import { revalidatePath } from "next/cache";

import { ensureCart, resolveCart } from "@/lib/cart/session";
import { EMPTY_CART, toCartPricing } from "@/lib/queries/normalize";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  addToCartSchema,
  couponSchema,
  firstIssue,
  removeCartItemSchema,
  updateCartItemSchema,
  MAX_LINE_QUANTITY,
} from "@/lib/validations/commerce";
import type { ActionResult, CartPricing } from "@/types";

/**
 * Every write path for the cart.
 *
 * Each action: resolves ownership from the caller's own cookie or session,
 * validates with Zod, mutates, and returns the freshly priced cart so the
 * client can update without a second round trip. No action accepts a price.
 */

const NOT_CONNECTED =
  "The store is not connected to its database yet, so nothing can be added to a bag. See docs/status.md.";

const NO_SCHEMA =
  "The database is reachable but its tables have not been created yet. Run supabase/apply-all.sql in the Supabase SQL editor.";

/**
 * PostgREST reports a missing table as PGRST205 and a missing function as
 * PGRST202. Both mean the migrations were never run — a setup mistake with a
 * specific fix, not a transient failure. Telling somebody to "try again" when
 * trying again cannot possibly work is its own small dishonesty.
 */
function describeFailure(error: unknown, fallback: string): string {
  const code = (error as { code?: string } | null)?.code;
  const message = (error as { message?: string } | null)?.message ?? "";
  if (code === "PGRST205" || code === "PGRST202" || /schema cache/i.test(message)) {
    return NO_SCHEMA;
  }
  return fallback;
}

async function priceCurrentCart(cartId: string, profileId: string | null): Promise<CartPricing> {
  const admin = createAdminClient();
  if (!admin) return EMPTY_CART;

  const { data, error } = await admin.rpc("price_cart", {
    p_cart_id: cartId,
    p_shipping_method_id: null,
    p_coupon_code: null,
    p_profile_id: profileId,
  });

  if (error) throw error;
  return toCartPricing(data);
}

/** Cart contents change what the header badge and the cart page show. */
function revalidateCart(): void {
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

export async function addToCart(input: {
  variantId: string;
  quantity: number;
}): Promise<ActionResult<CartPricing>> {
  const parsed = addToCartSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...firstIssue(parsed.error) };

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: NOT_CONNECTED };

  try {
    // The variant must exist, be sellable, and have the stock. Read it here
    // rather than trusting the page the customer was looking at.
    const { data: variant, error: variantError } = await admin
      .from("product_variants")
      .select("id, is_active, stock_quantity, reserved_quantity, product_id, title")
      .eq("id", parsed.data.variantId)
      .maybeSingle();

    if (variantError) throw variantError;
    if (!variant || !variant.is_active) {
      return { ok: false, error: "That piece is no longer available." };
    }

    const { data: product } = await admin
      .from("products")
      .select("status, name")
      .eq("id", variant.product_id)
      .maybeSingle();

    if (!product || product.status !== "ACTIVE") {
      return { ok: false, error: "That piece is no longer available." };
    }

    const available = Math.max(variant.stock_quantity - variant.reserved_quantity, 0);
    if (available <= 0) {
      return { ok: false, error: `${product.name} — ${variant.title} is sold out.` };
    }

    const { cartId, profileId } = await ensureCart();
    if (!cartId) return { ok: false, error: NOT_CONNECTED };

    const { data: existing } = await admin
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cartId)
      .eq("variant_id", parsed.data.variantId)
      .maybeSingle();

    const requested = (existing?.quantity ?? 0) + parsed.data.quantity;
    const capped = Math.min(requested, available, MAX_LINE_QUANTITY);

    if (existing && capped === existing.quantity) {
      return {
        ok: false,
        error: `Only ${available} left, and they are already in your bag.`,
      };
    }

    if (existing) {
      const { error } = await admin
        .from("cart_items")
        .update({ quantity: capped })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await admin
        .from("cart_items")
        .insert({ cart_id: cartId, variant_id: parsed.data.variantId, quantity: capped });
      if (error) throw error;
    }

    revalidateCart();
    return { ok: true, data: await priceCurrentCart(cartId, profileId) };
  } catch (error) {
    console.error("addToCart failed", error);
    return {
      ok: false,
      error: describeFailure(error, "That could not be added to your bag. Please try again."),
    };
  }
}

export async function updateCartItem(input: {
  itemId: string;
  quantity: number;
}): Promise<ActionResult<CartPricing>> {
  const parsed = updateCartItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...firstIssue(parsed.error) };

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: NOT_CONNECTED };

  try {
    const { cartId, profileId } = await resolveCart();
    if (!cartId) return { ok: false, error: "Your bag has expired. Please add the piece again." };

    // Scoping the update to the resolved cart id is the authorisation check:
    // an item id belonging to somebody else's cart matches no row.
    const { data: item } = await admin
      .from("cart_items")
      .select("id, variant_id")
      .eq("id", parsed.data.itemId)
      .eq("cart_id", cartId)
      .maybeSingle();

    if (!item) return { ok: false, error: "That item is no longer in your bag." };

    if (parsed.data.quantity === 0) {
      const { error } = await admin.from("cart_items").delete().eq("id", item.id);
      if (error) throw error;
      revalidateCart();
      return { ok: true, data: await priceCurrentCart(cartId, profileId) };
    }

    const { data: variant } = await admin
      .from("product_variants")
      .select("stock_quantity, reserved_quantity")
      .eq("id", item.variant_id)
      .maybeSingle();

    const available = variant
      ? Math.max(variant.stock_quantity - variant.reserved_quantity, 0)
      : 0;

    if (available === 0) {
      return { ok: false, error: "That piece has just sold out." };
    }

    const capped = Math.min(parsed.data.quantity, available, MAX_LINE_QUANTITY);
    const { error } = await admin
      .from("cart_items")
      .update({ quantity: capped })
      .eq("id", item.id);
    if (error) throw error;

    revalidateCart();
    const pricing = await priceCurrentCart(cartId, profileId);

    if (capped < parsed.data.quantity) {
      return { ok: true, data: pricing };
    }
    return { ok: true, data: pricing };
  } catch (error) {
    console.error("updateCartItem failed", error);
    return {
      ok: false,
      error: describeFailure(error, "Your bag could not be updated. Please try again."),
    };
  }
}

export async function removeCartItem(input: {
  itemId: string;
}): Promise<ActionResult<CartPricing>> {
  const parsed = removeCartItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...firstIssue(parsed.error) };

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: NOT_CONNECTED };

  try {
    const { cartId, profileId } = await resolveCart();
    if (!cartId) return { ok: false, error: "Your bag is already empty." };

    const { error } = await admin
      .from("cart_items")
      .delete()
      .eq("id", parsed.data.itemId)
      .eq("cart_id", cartId);
    if (error) throw error;

    revalidateCart();
    return { ok: true, data: await priceCurrentCart(cartId, profileId) };
  } catch (error) {
    console.error("removeCartItem failed", error);
    return {
      ok: false,
      error: describeFailure(error, "That item could not be removed. Please try again."),
    };
  }
}

/**
 * Applies a promotion code. The code is stored on the cart; the discount it is
 * worth is recomputed from scratch on every render and again at checkout, so a
 * code that expires between adding it and paying simply stops applying.
 */
export async function applyCoupon(input: { code: string }): Promise<ActionResult<CartPricing>> {
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...firstIssue(parsed.error) };

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: NOT_CONNECTED };

  try {
    const { cartId, profileId } = await resolveCart();
    if (!cartId) return { ok: false, error: "Add something to your bag first." };

    // `eq`, not `ilike`: the column is citext so equality is already
    // case-insensitive, and `_` — which the schema permits in a code — is a
    // single-character wildcard to LIKE. `WELCOME1_` must not match WELCOME10.
    const { data: coupon } = await admin
      .from("coupons")
      .select("id, code")
      .eq("code", parsed.data.code)
      .maybeSingle();

    if (!coupon) return { ok: false, error: "This code is not recognised.", field: "code" };

    // Price it before storing, so an invalid code is reported rather than kept.
    const { data: preview, error: previewError } = await admin.rpc("price_cart", {
      p_cart_id: cartId,
      p_shipping_method_id: null,
      p_coupon_code: coupon.code,
      p_profile_id: profileId,
    });
    if (previewError) throw previewError;

    const priced = toCartPricing(preview);
    if (!priced.couponValid) {
      return {
        ok: false,
        error: priced.couponReason ?? "This code cannot be used on this bag.",
        field: "code",
      };
    }

    const { error } = await admin
      .from("carts")
      .update({ coupon_id: coupon.id })
      .eq("id", cartId);
    if (error) throw error;

    revalidateCart();
    return { ok: true, data: priced };
  } catch (error) {
    console.error("applyCoupon failed", error);
    return {
      ok: false,
      error: describeFailure(error, "That code could not be applied. Please try again."),
    };
  }
}

/**
 * Re-prices the cart for a chosen shipping method, without storing anything.
 *
 * Checkout calls this every time the shipper changes, so the total on screen is
 * always one the database produced — never one the browser added up.
 */
export async function quoteCart(input: {
  shippingMethodId: string | null;
}): Promise<ActionResult<CartPricing>> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: NOT_CONNECTED };

  const methodId = input.shippingMethodId;
  if (methodId !== null && !/^[0-9a-f-]{36}$/i.test(methodId)) {
    return { ok: false, error: "That shipping method could not be identified." };
  }

  try {
    const { cartId, profileId } = await resolveCart();
    if (!cartId) return { ok: false, error: "Your bag is empty." };

    const { data, error } = await admin.rpc("price_cart", {
      p_cart_id: cartId,
      p_shipping_method_id: methodId,
      p_coupon_code: null,
      p_profile_id: profileId,
    });
    if (error) throw error;

    return { ok: true, data: toCartPricing(data) };
  } catch (error) {
    console.error("quoteCart failed", error);
    return {
      ok: false,
      error: describeFailure(error, "Your total could not be calculated. Please try again."),
    };
  }
}

export async function removeCoupon(): Promise<ActionResult<CartPricing>> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: NOT_CONNECTED };

  try {
    const { cartId, profileId } = await resolveCart();
    if (!cartId) return { ok: false, error: "Your bag is empty." };

    const { error } = await admin.from("carts").update({ coupon_id: null }).eq("id", cartId);
    if (error) throw error;

    revalidateCart();
    return { ok: true, data: await priceCurrentCart(cartId, profileId) };
  } catch (error) {
    console.error("removeCoupon failed", error);
    return {
      ok: false,
      error: describeFailure(error, "That code could not be removed. Please try again."),
    };
  }
}
