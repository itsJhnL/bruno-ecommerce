import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { sendEmail, staffRecipient } from "@/lib/email/send";
import { adminNewOrder, adminPaymentFailed, orderConfirmation } from "@/lib/email/templates";
import { getOrderForConfirmation } from "@/lib/queries/orders";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Stripe webhook — the only thing in this application allowed to decide that an
 * order is paid (Memory.md D-007).
 *
 * Three guarantees:
 *   1. Signature verified against STRIPE_WEBHOOK_SECRET before the body is read
 *      as anything but text. An unsigned request is rejected at the door.
 *   2. Idempotent by Stripe event id, recorded in `webhook_events`. Stripe
 *      retries, and a replay must not decrement stock twice.
 *   3. Never 500s on a downstream problem it cannot fix, because Stripe would
 *      retry forever. Real failures are recorded and surfaced in the dashboard.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export async function POST(request: Request) {
  if (!isStripeConfigured || !WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const stripe = getStripe();
  const admin = createAdminClient();
  if (!stripe || !admin) {
    return NextResponse.json({ error: "Server is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  // The raw body is required: any parsing changes the bytes the signature covers.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, WEBHOOK_SECRET);
  } catch (error) {
    console.error("stripe webhook: signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // Claim the event. A duplicate insert means another delivery already has it.
  const { error: claimError } = await admin
    .from("webhook_events")
    .insert({ id: event.id, provider: "stripe", type: event.type });

  if (claimError) {
    if (claimError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("stripe webhook: could not record event", claimError.message);
    return NextResponse.json({ error: "Could not record event." }, { status: 500 });
  }

  try {
    await handleEvent(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown handler failure";
    console.error(`stripe webhook: ${event.type} failed`, error);

    await admin.from("webhook_events").update({ error: message }).eq("id", event.id);

    // Handled-but-failed. Returning 500 would make Stripe retry an event that
    // will fail the same way; the row above is the durable record to act on.
    return NextResponse.json({ received: true, error: message });
  }
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await onSessionCompleted(event.data.object);
      break;

    case "checkout.session.expired":
      await onSessionFailed(event.data.object, "The payment session expired.");
      break;

    case "checkout.session.async_payment_failed":
      await onSessionFailed(event.data.object, "The payment was declined.");
      break;

    case "charge.refunded":
      await onChargeRefunded(event.data.object);
      break;

    default:
      // Everything else is acknowledged and ignored on purpose.
      break;
  }
}

function orderIdFrom(session: Stripe.Checkout.Session): string | null {
  return session.metadata?.order_id ?? session.client_reference_id ?? null;
}

async function onSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const admin = createAdminClient();
  const stripe = getStripe();
  if (!admin || !stripe) return;

  const orderId = orderIdFrom(session);
  if (!orderId) throw new Error("Checkout session carried no order id");

  // Stripe can report a completed session whose payment is still pending.
  if (session.payment_status !== "paid") return;

  let cardBrand: string | null = null;
  let cardLast4: string | null = null;
  let chargeId: string | null = null;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  if (paymentIntentId) {
    try {
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ["latest_charge.payment_method_details"],
      });
      const charge = intent.latest_charge;
      if (charge && typeof charge !== "string") {
        chargeId = charge.id;
        const card = charge.payment_method_details?.card;
        cardBrand = card?.brand ?? null;
        cardLast4 = card?.last4 ?? null;
      }
    } catch (error) {
      // Display metadata only. Not worth failing settlement over.
      console.error("stripe webhook: could not read payment method details", error);
    }
  }

  const { data, error } = await admin.rpc("mark_order_paid", {
    p_order_id: orderId,
    p_payment_intent_id: paymentIntentId,
    p_checkout_session_id: session.id,
    p_amount: session.amount_total === null ? null : session.amount_total / 100,
    p_card_brand: cardBrand,
    p_card_last4: cardLast4,
    p_charge_id: chargeId,
  });

  if (error) throw new Error(`mark_order_paid: ${error.message}`);

  const result = data as { order_number: string; already_paid: boolean; email?: string } | null;
  if (!result || result.already_paid) return;

  // Notifications, after the money is settled and never in a way that can
  // roll it back.
  const order = await getOrderForConfirmation(orderId, result.email ?? session.customer_email ?? "");
  if (!order) return;

  await sendEmail({
    template: "order_confirmation",
    to: order.email,
    content: orderConfirmation(order),
    orderId: order.id,
    metadata: { order_number: order.orderNumber },
  });

  const staff = staffRecipient();
  if (staff) {
    await sendEmail({
      template: "admin_new_order",
      to: staff,
      content: adminNewOrder(order),
      orderId: order.id,
    });
  }
}

async function onSessionFailed(
  session: Stripe.Checkout.Session,
  reason: string
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const orderId = orderIdFrom(session);
  if (!orderId) return;

  const { error } = await admin.rpc("mark_order_payment_failed", {
    p_order_id: orderId,
    p_reason: reason,
  });
  if (error) throw new Error(`mark_order_payment_failed: ${error.message}`);

  const { data: order } = await admin
    .from("orders")
    .select("order_number")
    .eq("id", orderId)
    .maybeSingle();

  const staff = staffRecipient();
  if (staff && order) {
    await sendEmail({
      template: "admin_payment_failed",
      to: staff,
      content: adminPaymentFailed(order.order_number, reason),
      orderId,
    });
  }
}

async function onChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const { data: payment } = await admin
    .from("payments")
    .select("id, order_id, amount")
    .eq("stripe_charge_id", charge.id)
    .maybeSingle();

  if (!payment) return;

  const refunded = charge.amount_refunded / 100;
  const fully = charge.amount_refunded >= charge.amount;

  await admin
    .from("payments")
    .update({
      amount_refunded: refunded,
      status: fully ? "REFUNDED" : "PARTIALLY_REFUNDED",
    })
    .eq("id", payment.id);

  await admin
    .from("orders")
    .update({
      refunded_total: refunded,
      status: fully ? "REFUNDED" : "PROCESSING",
      payment_status: fully ? "REFUNDED" : "PARTIALLY_REFUNDED",
    })
    .eq("id", payment.order_id);
}
