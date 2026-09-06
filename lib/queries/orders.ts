import "server-only";

import { toOrderAddress } from "@/lib/queries/normalize";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { OrderSummary } from "@/types";

const ORDER_COLUMNS = `
  id, order_number, email, status, payment_status, fulfillment_status, currency,
  subtotal, discount_total, shipping_total, tax_total, grand_total,
  coupon_code, shipping_method, tracking_number, tracking_url, carrier,
  shipping_address, billing_address, customer_note,
  placed_at, paid_at, shipped_at, delivered_at, created_at
` as const;

const ITEM_COLUMNS = `
  id, product_name, variant_title, sku, image_url, unit_price, quantity, line_total
` as const;

type OrderRecord = {
  id: string;
  order_number: string;
  email: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  currency: string;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  grand_total: number;
  coupon_code: string | null;
  shipping_method: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  carrier: string | null;
  shipping_address: unknown;
  billing_address: unknown;
  customer_note: string | null;
  placed_at: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
};

type ItemRecord = {
  id: string;
  product_name: string;
  variant_title: string | null;
  sku: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
};

function toOrderSummary(order: OrderRecord, items: ItemRecord[]): OrderSummary {
  return {
    id: order.id,
    orderNumber: order.order_number,
    email: order.email,
    status: order.status,
    paymentStatus: order.payment_status,
    fulfillmentStatus: order.fulfillment_status,
    currency: order.currency,
    subtotal: Number(order.subtotal),
    discountTotal: Number(order.discount_total),
    shippingTotal: Number(order.shipping_total),
    taxTotal: Number(order.tax_total),
    grandTotal: Number(order.grand_total),
    couponCode: order.coupon_code,
    shippingMethod: order.shipping_method,
    trackingNumber: order.tracking_number,
    trackingUrl: order.tracking_url,
    carrier: order.carrier,
    placedAt: order.placed_at,
    paidAt: order.paid_at,
    shippedAt: order.shipped_at,
    deliveredAt: order.delivered_at,
    createdAt: order.created_at,
    shippingAddress: toOrderAddress(order.shipping_address),
    billingAddress: toOrderAddress(order.billing_address),
    customerNote: order.customer_note,
    lines: items.map((item) => ({
      id: item.id,
      name: item.product_name,
      variantTitle: item.variant_title,
      sku: item.sku,
      imageUrl: item.image_url,
      unitPrice: Number(item.unit_price),
      quantity: item.quantity,
      lineTotal: Number(item.line_total),
    })),
  };
}

/**
 * The order behind a confirmation page.
 *
 * A guest has no session to authorise against, so the URL carries an id they
 * could only have received by completing checkout, and the caller must also
 * present the matching email. Both must agree — an id alone is not enough,
 * because ids appear in browser history and shared links.
 */
export async function getOrderForConfirmation(
  orderId: string,
  email: string
): Promise<OrderSummary | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data: order } = await admin
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return null;
  if (order.email.toLowerCase() !== email.trim().toLowerCase()) return null;

  const { data: items } = await admin
    .from("order_items")
    .select(ITEM_COLUMNS)
    .eq("order_id", orderId)
    .order("created_at");

  return toOrderSummary(order as OrderRecord, (items ?? []) as ItemRecord[]);
}

/**
 * A signed-in customer's own order. Runs under their session, so RLS — not this
 * function — is what actually stops them reading somebody else's.
 */
export async function getOwnOrder(orderId: string): Promise<OrderSummary | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: order } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select(ITEM_COLUMNS)
    .eq("order_id", orderId)
    .order("created_at");

  return toOrderSummary(order as OrderRecord, (items ?? []) as ItemRecord[]);
}
