import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Truck } from "lucide-react";

import { OrderStatusBadge, orderProgress } from "@/components/account/order-status";
import { Button } from "@/components/ui/button";
import { getOwnOrder } from "@/lib/queries/orders";
import { countryName } from "@/lib/utils/countries";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatPrice } from "@/lib/utils/format";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // `getOwnOrder` runs under the customer's session, so RLS returns nothing for
  // an order belonging to someone else — which arrives here as a 404, exactly
  // as it should. There is no ownership check written in this file because a
  // check written here could be forgotten; the policy cannot be.
  const order = await getOwnOrder(id);
  if (!order) notFound();

  const progress = orderProgress(order.status);

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-sm text-ink-tertiary transition-colors hover:text-ink-primary"
        >
          <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden />
          All orders
        </Link>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <h2 className="display-s text-ink-primary">{order.orderNumber}</h2>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-2 text-sm text-ink-tertiary">
          Placed {formatDate(order.placedAt ?? order.createdAt)}
        </p>
      </div>

      {progress && (
        <section aria-label="Progress" className="glass-pane rounded-card p-6">
          <ol className="grid gap-4 sm:grid-cols-4">
            {progress.steps.map((step, i) => {
              const done = i <= progress.reached;
              return (
                <li key={step} className="flex items-start gap-3 sm:block">
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1 block h-1 w-full rounded-full sm:mt-0",
                      done ? "bg-accent-solid" : "bg-hairline"
                    )}
                  />
                  <span
                    className={cn(
                      "mt-3 block text-xs",
                      done ? "text-ink-primary" : "text-ink-muted"
                    )}
                  >
                    {step}
                    {i === progress.reached && <span className="sr-only"> — current step</span>}
                  </span>
                </li>
              );
            })}
          </ol>

          {order.trackingNumber && (
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-hairline-faint pt-5">
              <Truck className="size-4 text-accent-quiet" strokeWidth={1.5} aria-hidden />
              <span className="text-sm text-ink-secondary">
                {order.carrier ? `${order.carrier} · ` : ""}
                {order.trackingNumber}
              </span>
              {order.trackingUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                    Track your parcel
                  </a>
                </Button>
              )}
            </div>
          )}
        </section>
      )}

      <section aria-labelledby="order-items">
        <h3 id="order-items" className="eyebrow mb-5 text-accent-quiet">
          What you ordered
        </h3>

        <ul className="divide-y divide-hairline-faint border-y border-hairline-faint">
          {order.lines.map((line) => (
            <li key={line.id} className="flex items-start justify-between gap-4 py-5">
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

        <dl className="mt-6 space-y-1.5 text-sm">
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
              <dd className="tnum text-ink-primary">{formatPrice(order.taxTotal, order.currency)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4 border-t border-hairline-faint pt-3">
            <dt className="text-ink-primary">Total</dt>
            <dd className="figure tnum text-lg text-ink-primary">
              {formatPrice(order.grandTotal, order.currency)}
            </dd>
          </div>
        </dl>
      </section>

      {order.shippingAddress && (
        <section aria-label="Delivery address" className="glass-pane rounded-card p-6">
          <h3 className="eyebrow mb-4 text-accent-quiet">Delivered to</h3>
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
        </section>
      )}
    </div>
  );
}
