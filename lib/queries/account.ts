import "server-only";

import { toOrderAddress } from "@/lib/queries/normalize";
import { createClient } from "@/lib/supabase/server";
import type { OrderSummary } from "@/types";

/**
 * Everything the customer area reads.
 *
 * All of it runs under the caller's own session, so RLS — not a `where` clause
 * written here — is what stops one customer reading another's rows. The filters
 * below are for correctness and speed; the security is in the database
 * (Memory.md D-006).
 */

export interface SavedAddress {
  id: string;
  type: "SHIPPING" | "BILLING";
  label: string | null;
  firstName: string;
  lastName: string;
  company: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string;
  countryCode: string;
  phone: string | null;
  isDefault: boolean;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  currency: string;
  grandTotal: number;
  itemCount: number;
  placedAt: string | null;
  createdAt: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  /** First image on the order, for the list thumbnail. */
  previewImage: string | null;
}

export interface WishlistEntry {
  id: string;
  productId: string;
  slug: string;
  name: string;
  subtitle: string | null;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  imageUrl: string | null;
  imageAlt: string | null;
  isInStock: boolean;
  addedAt: string;
}

export async function getSavedAddresses(): Promise<SavedAddress[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("addresses")
    .select(
      "id, type, label, first_name, last_name, company, line1, line2, city, region, postal_code, country_code, phone, is_default"
    )
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((a) => ({
    id: a.id,
    type: a.type as SavedAddress["type"],
    label: a.label,
    firstName: a.first_name,
    lastName: a.last_name,
    company: a.company,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    region: a.region,
    postalCode: a.postal_code,
    countryCode: a.country_code,
    phone: a.phone,
    isDefault: a.is_default,
  }));
}

export async function getOwnOrders(limit = 50): Promise<OrderListItem[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, order_number, status, payment_status, fulfillment_status, currency,
       grand_total, placed_at, created_at, tracking_number, tracking_url`
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data || data.length === 0) return [];

  // Two queries rather than a nested select: `types/database.ts` is hand-written
  // and declares no relationships, so PostgREST's inference cannot resolve an
  // embedded resource and every column silently becomes `never`.
  const { data: allItems } = await supabase
    .from("order_items")
    .select("order_id, quantity, image_url")
    .in("order_id", data.map((o) => o.id));

  const itemsByOrder = new Map<string, { quantity: number; image_url: string | null }[]>();
  for (const item of allItems ?? []) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push({ quantity: item.quantity, image_url: item.image_url });
    itemsByOrder.set(item.order_id, list);
  }

  return data.map((o) => {
    const items = itemsByOrder.get(o.id) ?? [];
    return {
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      paymentStatus: o.payment_status,
      fulfillmentStatus: o.fulfillment_status,
      currency: o.currency,
      grandTotal: Number(o.grand_total),
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      placedAt: o.placed_at,
      createdAt: o.created_at,
      trackingNumber: o.tracking_number,
      trackingUrl: o.tracking_url,
      previewImage: items.find((i) => i.image_url)?.image_url ?? null,
    };
  });
}

/** Headline numbers for the account landing page. */
export async function getAccountSummary(): Promise<{
  orderCount: number;
  lifetimeSpend: number;
  currency: string;
  wishlistCount: number;
}> {
  const supabase = await createClient();
  if (!supabase) return { orderCount: 0, lifetimeSpend: 0, currency: "USD", wishlistCount: 0 };

  const [{ data: orders }, { data: wishlist }] = await Promise.all([
    supabase.from("orders").select("grand_total, currency, payment_status"),
    supabase.from("wishlist_items").select("id"),
  ]);

  const paid = (orders ?? []).filter((o) => o.payment_status === "PAID");

  return {
    orderCount: (orders ?? []).length,
    lifetimeSpend: paid.reduce((sum, o) => sum + Number(o.grand_total), 0),
    currency: orders?.[0]?.currency ?? "USD",
    wishlistCount: (wishlist ?? []).length,
  };
}

export async function getWishlist(): Promise<WishlistEntry[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("wishlist_items")
    .select("id, product_id, added_at")
    .order("added_at", { ascending: false });

  if (error || !data) return [];

  // The card view carries the image and the stock rollup; join it separately
  // rather than nesting two views through one relationship.
  const ids = data.map((row) => row.product_id).filter(Boolean);
  if (ids.length === 0) return [];

  const { data: cards } = await supabase
    .from("product_cards")
    .select("id, slug, name, subtitle, price, compare_at_price, currency, image_url, image_alt, is_in_stock")
    .in("id", ids);

  const byId = new Map((cards ?? []).map((c) => [c.id, c]));

  return data.flatMap((row) => {
    const card = byId.get(row.product_id);
    // A product archived since it was saved has no card. Dropping it is right:
    // the wishlist should not link to something nobody can buy.
    if (!card) return [];
    return [
      {
        id: row.id,
        productId: row.product_id,
        slug: card.slug,
        name: card.name,
        subtitle: card.subtitle,
        price: Number(card.price),
        compareAtPrice: card.compare_at_price === null ? null : Number(card.compare_at_price),
        currency: card.currency,
        imageUrl: card.image_url,
        imageAlt: card.image_alt,
        isInStock: card.is_in_stock,
        addedAt: row.added_at,
      },
    ];
  });
}

/** Which products the signed-in customer has saved, for the heart on a card. */
export async function getWishlistProductIds(): Promise<Set<string>> {
  const supabase = await createClient();
  if (!supabase) return new Set();

  const { data } = await supabase.from("wishlist_items").select("product_id");
  return new Set((data ?? []).map((r) => r.product_id));
}

/**
 * Products this customer has bought and not yet reviewed — the only ones they
 * are offered a review form for.
 */
export async function getReviewableProducts(): Promise<{ id: string; name: string; slug: string }[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  // RLS already limits `orders` to this customer's own, so no owner filter is
  // written here — the database is the guard, not the query.
  const { data: paidOrders } = await supabase
    .from("orders")
    .select("id")
    .eq("payment_status", "PAID");

  if (!paidOrders || paidOrders.length === 0) return [];

  // `order_items` snapshots the name but not the slug — an order is a record of
  // what was bought, not a route. The slug comes from the product itself.
  const { data: items } = await supabase
    .from("order_items")
    .select("product_id")
    .in("order_id", paidOrders.map((o) => o.id));

  const purchased = [...new Set((items ?? []).map((i) => i.product_id).filter(Boolean))] as string[];
  if (purchased.length === 0) return [];

  const { data: reviewed } = await supabase.from("reviews").select("product_id");
  const already = new Set((reviewed ?? []).map((r) => r.product_id));

  const outstanding = purchased.filter((id) => !already.has(id));
  if (outstanding.length === 0) return [];

  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug")
    .in("id", outstanding);

  return (products ?? []).map((p) => ({ id: p.id, name: p.name, slug: p.slug }));
}

export { toOrderAddress };
export type { OrderSummary };
