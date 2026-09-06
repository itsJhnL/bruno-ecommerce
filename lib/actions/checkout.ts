"use server";

import { resolveCart } from "@/lib/cart/session";
import { toCartPricing } from "@/lib/queries/normalize";
import { getStripe, isStripeConfigured, STRIPE_NOT_CONFIGURED, toMinorUnits } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/utils/site";
import { checkoutSchema, firstIssue, type CheckoutInput } from "@/lib/validations/commerce";
import type { ActionResult } from "@/types";

/**
 * Checkout.
 *
 * Order of operations matters. The order is written first, from prices the
 * database computes, and only then is Stripe asked for the exact amount the
 * order says. If Stripe cannot be reached the reservation is released, so a
 * failed attempt never strands stock.
 */

interface CheckoutStarted {
  orderId: string;
  orderNumber: string;
  /** Where the browser must go next. Always Stripe-hosted. */
  redirectUrl: string;
}

/** The address shape stored on the order — snake_case, matching the DB. */
function toAddressJson(
  address: CheckoutInput["shipping"],
  fallbackPhone: string | undefined
): Record<string, string | null> {
  return {
    first_name: address.firstName,
    last_name: address.lastName,
    company: address.company || null,
    line1: address.line1,
    line2: address.line2 || null,
    city: address.city,
    region: address.region || null,
    postal_code: address.postalCode,
    country_code: address.countryCode,
    phone: address.phone || fallbackPhone || null,
  };
}

export async function startCheckout(
  input: unknown
): Promise<ActionResult<CheckoutStarted>> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, ...firstIssue(parsed.error) };

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      error:
        "The store is not connected to its database yet, so an order cannot be placed. See docs/status.md.",
    };
  }

  if (!isStripeConfigured) {
    return { ok: false, error: STRIPE_NOT_CONFIGURED };
  }

  const { cartId, profileId } = await resolveCart();
  if (!cartId) return { ok: false, error: "Your bag is empty." };

  const data = parsed.data;

  // Re-price server-side before writing anything. The summary the customer saw
  // was rendered from this same function, but it may be minutes old.
  const { data: previewJson, error: previewError } = await admin.rpc("price_cart", {
    p_cart_id: cartId,
    p_shipping_method_id: data.shippingMethodId,
    p_coupon_code: null,
    p_profile_id: profileId,
  });
  if (previewError) {
    console.error("startCheckout: pricing failed", previewError.message);
    return { ok: false, error: "Your bag could not be priced. Please try again." };
  }

  const preview = toCartPricing(previewJson);
  if (preview.itemCount === 0) return { ok: false, error: "Your bag is empty." };
  if (preview.hasUnavailable) {
    return {
      ok: false,
      error: "Something in your bag has just sold out. Please review it before paying.",
    };
  }

  const billing =
    data.billingSameAsShipping || !data.billing ? data.shipping : data.billing;

  let orderId: string | null = null;

  try {
    const { data: createdJson, error: createError } = await admin.rpc(
      "create_order_from_cart",
      {
        p_cart_id: cartId,
        p_email: data.email,
        p_shipping_address: toAddressJson(data.shipping, data.phone || undefined),
        p_billing_address: toAddressJson(billing, data.phone || undefined),
        p_shipping_method_id: data.shippingMethodId,
        p_coupon_code: null,
        p_phone: data.phone || null,
        p_customer_note: data.customerNote || null,
        p_profile_id: profileId,
      }
    );

    if (createError) {
      // The function raises a readable message for the cases a customer can fix.
      return { ok: false, error: createError.message.replace(/^.*?:\s*/, "") };
    }

    const created = createdJson as {
      order_id: string;
      order_number: string;
      grand_total: number;
      currency: string;
    } | null;

    if (!created?.order_id) {
      return { ok: false, error: "Your order could not be created. Please try again." };
    }
    orderId = created.order_id;

    if (data.acceptsMarketing) {
      await admin
        .from("newsletter_subscribers")
        .upsert({ email: data.email, source: "checkout" }, { onConflict: "email" });
    }

    const stripe = getStripe();
    if (!stripe) return { ok: false, error: STRIPE_NOT_CONFIGURED };

    const { data: items } = await admin
      .from("order_items")
      .select("product_name, variant_title, image_url, unit_price, quantity, line_total")
      .eq("order_id", orderId);

    const currency = created.currency.toLowerCase();
    const lineItems = (items ?? []).map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency,
        unit_amount: toMinorUnits(Number(item.unit_price)),
        product_data: {
          name: item.product_name,
          ...(item.variant_title ? { description: item.variant_title } : {}),
          ...(item.image_url?.startsWith("http") ? { images: [item.image_url] } : {}),
        },
      },
    }));

    if (preview.taxTotal > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency,
          unit_amount: toMinorUnits(preview.taxTotal),
          product_data: { name: "Tax" },
        },
      });
    }

    // A one-shot Stripe coupon is how an order-level discount is expressed
    // without re-pricing the individual lines.
    const discounts =
      preview.discountTotal > 0
        ? [
            {
              coupon: (
                await stripe.coupons.create({
                  amount_off: toMinorUnits(preview.discountTotal),
                  currency,
                  duration: "once",
                  name: preview.couponCode ?? "Discount",
                })
              ).id,
            },
          ]
        : undefined;

    const shippingOptions =
      preview.shippingTotal > 0
        ? [
            {
              shipping_rate_data: {
                type: "fixed_amount" as const,
                fixed_amount: { amount: toMinorUnits(preview.shippingTotal), currency },
                display_name: preview.shippingMethod ?? "Shipping",
              },
            },
          ]
        : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: data.email,
      client_reference_id: orderId,
      ...(discounts ? { discounts } : {}),
      ...(shippingOptions ? { shipping_options: shippingOptions } : {}),
      metadata: { order_id: orderId, order_number: created.order_number },
      payment_intent_data: {
        metadata: { order_id: orderId, order_number: created.order_number },
      },
      success_url: siteUrl("/checkout/confirmation?session_id={CHECKOUT_SESSION_ID}"),
      cancel_url: siteUrl(`/checkout?cancelled=${created.order_number}`),
      // Stripe holds the session open long enough for a considered purchase,
      // but not so long that the reservation blocks other buyers indefinitely.
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    });

    // What Stripe will charge must equal what the order says. If it does not,
    // something is wrong with this code, and the customer must not be charged.
    if (session.amount_total !== null && session.amount_total !== toMinorUnits(Number(created.grand_total))) {
      await stripe.checkout.sessions.expire(session.id);
      await admin.rpc("mark_order_payment_failed", {
        p_order_id: orderId,
        p_reason: "Total mismatch between the order and the payment session",
      });
      console.error("startCheckout: total mismatch", {
        order: created.grand_total,
        stripe: session.amount_total,
      });
      return {
        ok: false,
        error: "Your total could not be confirmed, so nothing was charged. Please try again.",
      };
    }

    await admin.from("payments").insert({
      order_id: orderId,
      provider: "stripe",
      stripe_checkout_session_id: session.id,
      status: "PENDING",
      amount: Number(created.grand_total),
      currency: created.currency,
    });

    if (!session.url) {
      throw new Error("Stripe returned a session with no redirect URL");
    }

    return {
      ok: true,
      data: {
        orderId,
        orderNumber: created.order_number,
        redirectUrl: session.url,
      },
    };
  } catch (error) {
    console.error("startCheckout failed", error);
    // Never leave stock reserved for an order that will not be paid.
    if (orderId) {
      await admin
        .rpc("mark_order_payment_failed", {
          p_order_id: orderId,
          p_reason: "Checkout could not be started",
        })
        .then(undefined, (e) => console.error("release failed", e));
    }
    return {
      ok: false,
      error: "Payment could not be started, and nothing was charged. Please try again.",
    };
  }
}

/**
 * Records that a customer abandoned the Stripe page, so the reservation is
 * returned to stock immediately rather than waiting for the session to expire.
 */
export async function cancelPendingOrder(orderNumber: string): Promise<ActionResult> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Not connected." };

  const supabase = await createClient();
  const { data: auth } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  const { data: order } = await admin
    .from("orders")
    .select("id, profile_id, status, payment_status")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!order) return { ok: false, error: "That order could not be found." };
  if (order.payment_status === "PAID") return { ok: false, error: "That order is already paid." };

  // A guest cancelling their own abandoned order has no session to check, so
  // only orders that are still PENDING can be cancelled this way, and a
  // customer's order can only be cancelled by that customer.
  if (order.profile_id && order.profile_id !== auth.user?.id) {
    return { ok: false, error: "That order could not be found." };
  }
  if (order.status !== "PENDING") {
    return { ok: false, error: "That order can no longer be cancelled." };
  }

  await admin.rpc("mark_order_payment_failed", {
    p_order_id: order.id,
    p_reason: "Checkout abandoned",
  });

  return { ok: true, data: null };
}
