import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2, Clock, Package, Truck } from "lucide-react";

import { ClearCartOnMount } from "@/components/checkout/clear-cart-on-mount";
import { Button } from "@/components/ui/button";
import { getOrderForConfirmation } from "@/lib/queries/orders";
import { getStripe } from "@/lib/stripe/server";
import { formatDate, formatPrice } from "@/lib/utils/format";
import { countryName } from "@/lib/utils/countries";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The confirmation page.
 *
 * Authorisation is possession of the Stripe checkout session id, which only
 * somebody who completed that checkout receives. The session tells us the order
 * id and the email it was placed with; both must agree before the order is
 * shown, so a guessed id in a URL reveals nothing.
 */
export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  if (!sessionId) notFound();

  const stripe = getStripe();
  if (!stripe) notFound();

  let orderId: string | null = null;
  let email: string | null = null;
  let paid = false;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    orderId = session.metadata?.order_id ?? session.client_reference_id ?? null;
    email = session.customer_details?.email ?? session.customer_email ?? null;
    paid = session.payment_status === "paid";
  } catch {
    notFound();
  }

  if (!orderId || !email) notFound();

  const order = await getOrderForConfirmation(orderId, email);
  if (!order) notFound();

  // Stripe redirects the moment payment succeeds; the webhook that marks the
  // order paid may be a second or two behind. Say so rather than showing a
  // stale "pending" as though something had gone wrong.
  const settling = paid && order.paymentStatus !== "PAID";

  return (
    <div className="shell section max-w-3xl">
      <ClearCartOnMount />

      <div className="text-center">
        <CheckCircle2 className="mx-auto size-9 text-signal-success" strokeWidth={1.25} />
        <p className="eyebrow mt-6">Order {order.orderNumber}</p>
        <h1 className="display-l mt-4 text-ink-primary">Thank you</h1>
        <p className="lede mx-auto mt-5">
          {settling
            ? "Your payment went through. We are finalising the order now — your receipt will arrive within a minute."
            : "Your payment is confirmed and a receipt is on its way to " + order.email + "."}
        </p>
      </div>

      <ol className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          { icon: CheckCircle2, title: "Paid", body: formatDate(order.paidAt ?? order.createdAt) },
          { icon: Package, title: "Checked and packed", body: "Within one working day" },
          {
            icon: Truck,
            title: order.shippingMethod ?? "Dispatch",
            body: "You will get tracking by email",
          },
        ].map((step, i) => (
          <li key={step.title} className="glass-pane rounded-card p-5">
            <step.icon
              className={i === 0 ? "size-5 text-signal-success" : "size-5 text-ink-tertiary"}
              strokeWidth={1.5}
              aria-hidden
            />
            <p className="mt-3 text-sm text-ink-primary">{step.title}</p>
            <p className="mt-1 text-xs text-ink-tertiary">{step.body}</p>
          </li>
        ))}
      </ol>

      <section aria-labelledby="order-items" className="glass-pane mt-8 rounded-card p-6 md:p-8">
        <h2 id="order-items" className="eyebrow mb-6 text-accent-quiet">
          What is coming
        </h2>

        <ul className="divide-y divide-hairline-faint">
          {order.lines.map((line) => (
            <li key={line.id} className="flex items-start justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="text-sm text-ink-primary">{line.name}</p>
                {line.variantTitle && (
                  <p className="mt-0.5 text-xs text-ink-tertiary">{line.variantTitle}</p>
                )}
                <p className="mt-1 text-xs text-ink-muted">
                  Quantity {line.quantity}
                  {line.sku ? ` · SKU ${line.sku}` : ""}
                </p>
              </div>
              <p className="figure tnum shrink-0 text-sm text-ink-primary">
                {formatPrice(line.lineTotal, order.currency)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="mt-6 space-y-1.5 border-t border-hairline-faint pt-6 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-secondary">Subtotal</dt>
            <dd className="tnum text-ink-primary">{formatPrice(order.subtotal, order.currency)}</dd>
          </div>
          {order.discountTotal > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-secondary">
                Discount{order.couponCode ? ` · ${order.couponCode}` : ""}
              </dt>
              <dd className="tnum text-accent">
                −{formatPrice(order.discountTotal, order.currency)}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-ink-secondary">
              Shipping{order.shippingMethod ? ` · ${order.shippingMethod}` : ""}
            </dt>
            <dd className="tnum text-ink-primary">
              {order.shippingTotal === 0
                ? "Complimentary"
                : formatPrice(order.shippingTotal, order.currency)}
            </dd>
          </div>
          {order.taxTotal > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-secondary">Tax</dt>
              <dd className="tnum text-ink-primary">
                {formatPrice(order.taxTotal, order.currency)}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4 border-t border-hairline-faint pt-3">
            <dt className="text-ink-primary">Total paid</dt>
            <dd className="figure tnum text-lg text-ink-primary">
              {formatPrice(order.grandTotal, order.currency)}
            </dd>
          </div>
        </dl>
      </section>

      {order.shippingAddress && (
        <section className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="glass-pane rounded-card p-6">
            <h2 className="eyebrow mb-4 text-accent-quiet">Shipping to</h2>
            <address className="text-sm not-italic leading-relaxed text-ink-secondary">
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              <br />
              {order.shippingAddress.company && (
                <>
                  {order.shippingAddress.company}
                  <br />
                </>
              )}
              {order.shippingAddress.line1}
              <br />
              {order.shippingAddress.line2 && (
                <>
                  {order.shippingAddress.line2}
                  <br />
                </>
              )}
              {order.shippingAddress.city}
              {order.shippingAddress.region ? `, ${order.shippingAddress.region}` : ""}{" "}
              {order.shippingAddress.postalCode}
              <br />
              {countryName(order.shippingAddress.countryCode)}
            </address>
          </div>

          <div className="glass-pane rounded-card p-6">
            <h2 className="eyebrow mb-4 text-accent-quiet">Keep this</h2>
            <p className="text-sm leading-relaxed text-ink-secondary">
              Quote <span className="text-ink-primary">{order.orderNumber}</span> in any message
              about this order.
            </p>
            {settling && (
              <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-tertiary">
                <Clock className="mt-px size-3.5 shrink-0" strokeWidth={1.5} />
                Still settling. Refresh in a moment if the status has not updated.
              </p>
            )}
            <Button variant="outline" size="sm" className="mt-5" asChild>
              <Link href="/collection">Continue shopping</Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
