"use server";

import { revalidatePath } from "next/cache";

import { getUserId } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { firstIssue } from "@/lib/validations/commerce";
import {
  profileSchema,
  reviewSchema,
  savedAddressSchema,
  wishlistItemSchema,
} from "@/lib/validations/auth";
import type { ActionResult } from "@/types";

/**
 * Customer writes: profile, addresses, wishlist, reviews.
 *
 * Every one runs under the caller's own session — no service-role client
 * appears in this file. That means RLS decides what may be written, and a bug
 * in the filters below cannot become somebody else's data.
 */

const SIGNED_OUT = "You need to be signed in to do that.";

export async function updateProfile(input: unknown): Promise<ActionResult<null>> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...firstIssue(parsed.error) };

  const supabase = await createClient();
  const userId = await getUserId();
  if (!supabase || !userId) return { ok: false, error: SIGNED_OUT };

  const { fullName, phone, acceptsMarketing } = parsed.data;
  const [firstName, ...rest] = fullName.split(/\s+/);

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      first_name: firstName ?? null,
      last_name: rest.length > 0 ? rest.join(" ") : null,
      phone: phone || null,
      accepts_marketing: acceptsMarketing,
    })
    .eq("id", userId);

  if (error) {
    console.error("updateProfile failed", error.message);
    return { ok: false, error: "Your details could not be saved. Please try again." };
  }

  // `role` and `status` are stripped by the guard trigger, not by this update —
  // a client that sends them changes nothing (0008, guard_profile_privilege).
  revalidatePath("/account", "layout");
  return { ok: true, data: null };
}

export async function saveAddress(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = savedAddressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...firstIssue(parsed.error) };

  const supabase = await createClient();
  const userId = await getUserId();
  if (!supabase || !userId) return { ok: false, error: SIGNED_OUT };

  const a = parsed.data;
  const row = {
    profile_id: userId,
    type: a.type,
    label: a.label || null,
    first_name: a.firstName,
    last_name: a.lastName,
    company: a.company || null,
    line1: a.line1,
    line2: a.line2 || null,
    city: a.city,
    region: a.region || null,
    postal_code: a.postalCode,
    country_code: a.countryCode,
    phone: a.phone || null,
    is_default: a.isDefault,
  };

  try {
    // Only one default per type is allowed by a partial unique index, so the
    // old default has to stand down before the new one stands up.
    if (a.isDefault) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("profile_id", userId)
        .eq("type", a.type);
    }

    if (a.id) {
      const { error } = await supabase
        .from("addresses")
        .update(row)
        .eq("id", a.id)
        .eq("profile_id", userId);
      if (error) throw error;
      revalidatePath("/account/addresses");
      return { ok: true, data: { id: a.id } };
    }

    const { data, error } = await supabase.from("addresses").insert(row).select("id").single();
    if (error) throw error;

    revalidatePath("/account/addresses");
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    console.error("saveAddress failed", error);
    return { ok: false, error: "That address could not be saved. Please try again." };
  }
}

export async function deleteAddress(input: { id: string }): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!supabase || !userId) return { ok: false, error: SIGNED_OUT };

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", input.id)
    .eq("profile_id", userId);

  if (error) {
    console.error("deleteAddress failed", error.message);
    return { ok: false, error: "That address could not be removed." };
  }

  revalidatePath("/account/addresses");
  return { ok: true, data: null };
}

/**
 * Adds or removes a saved product, returning the state afterwards so the heart
 * can settle on the truth rather than on what it assumed.
 */
export async function toggleWishlist(
  input: unknown
): Promise<ActionResult<{ saved: boolean }>> {
  const parsed = wishlistItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...firstIssue(parsed.error) };

  const supabase = await createClient();
  const userId = await getUserId();
  if (!supabase || !userId) return { ok: false, error: SIGNED_OUT };

  try {
    // Every customer gets one list, created on first use.
    let { data: list } = await supabase
      .from("wishlists")
      .select("id")
      .eq("profile_id", userId)
      .maybeSingle();

    if (!list) {
      const { data, error } = await supabase
        .from("wishlists")
        .insert({ profile_id: userId })
        .select("id")
        .single();
      if (error) throw error;
      list = data;
    }

    const { data: existing } = await supabase
      .from("wishlist_items")
      .select("id")
      .eq("wishlist_id", list.id)
      .eq("product_id", parsed.data.productId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("wishlist_items").delete().eq("id", existing.id);
      if (error) throw error;
      revalidatePath("/account/wishlist");
      return { ok: true, data: { saved: false } };
    }

    const { error } = await supabase.from("wishlist_items").insert({
      wishlist_id: list.id,
      product_id: parsed.data.productId,
      variant_id: parsed.data.variantId ?? null,
    });
    if (error) throw error;

    revalidatePath("/account/wishlist");
    return { ok: true, data: { saved: true } };
  } catch (error) {
    console.error("toggleWishlist failed", error);
    return { ok: false, error: "That could not be saved. Please try again." };
  }
}

export async function removeWishlistItem(input: { id: string }): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!supabase || !userId) return { ok: false, error: SIGNED_OUT };

  const { error } = await supabase.from("wishlist_items").delete().eq("id", input.id);
  if (error) {
    console.error("removeWishlistItem failed", error.message);
    return { ok: false, error: "That could not be removed." };
  }

  revalidatePath("/account/wishlist");
  return { ok: true, data: null };
}

/**
 * Submits a review.
 *
 * It lands as PENDING and is invisible until a moderator approves it, so this
 * cannot be used to publish anything. The verified-purchase flag is decided
 * here from the order history, never accepted from the client.
 */
export async function submitReview(input: unknown): Promise<ActionResult<null>> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...firstIssue(parsed.error) };

  const supabase = await createClient();
  const userId = await getUserId();
  if (!supabase || !userId) return { ok: false, error: SIGNED_OUT };

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .maybeSingle();

    // Did they actually buy it? Only a paid order counts, and RLS has already
    // narrowed `orders` to this customer's own.
    const { data: paidOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("payment_status", "PAID");

    const purchase =
      paidOrders && paidOrders.length > 0
        ? (
            await supabase
              .from("order_items")
              .select("order_id")
              .eq("product_id", parsed.data.productId)
              .in("order_id", paidOrders.map((o) => o.id))
              .limit(1)
              .maybeSingle()
          ).data
        : null;

    const { error } = await supabase.from("reviews").insert({
      product_id: parsed.data.productId,
      profile_id: userId,
      order_id: purchase?.order_id ?? null,
      author_name: profile?.full_name || (profile?.email ?? "").split("@")[0] || "A customer",
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      body: parsed.data.body,
      status: "PENDING",
      is_verified_purchase: Boolean(purchase),
    });

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "You have already reviewed this piece." };
      }
      throw error;
    }

    return { ok: true, data: null };
  } catch (error) {
    console.error("submitReview failed", error);
    return { ok: false, error: "Your review could not be sent. Please try again." };
  }
}
