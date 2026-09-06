import Link from "next/link";
import { ArrowRight, Heart, MapPin, Package } from "lucide-react";

import { OrderStatusBadge } from "@/components/account/order-status";
import { Button } from "@/components/ui/button";
import { getAccountSummary, getOwnOrders } from "@/lib/queries/account";
import { formatDate, formatPrice } from "@/lib/utils/format";

export default async function AccountPage() {
  const [summary, orders] = await Promise.all([getAccountSummary(), getOwnOrders(3)]);

  const stats = [
    { label: "Orders", value: String(summary.orderCount), icon: Package },
    {
      label: "Lifetime spend",
      value: formatPrice(summary.lifetimeSpend, summary.currency),
      icon: ArrowRight,
    },
    { label: "Saved pieces", value: String(summary.wishlistCount), icon: Heart },
  ];

  return (
    <div className="space-y-12">
      <section aria-label="Summary">
        <dl className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-pane rounded-card p-5">
              <dt className="eyebrow text-accent-quiet">{stat.label}</dt>
              <dd className="figure mt-3 text-2xl text-ink-primary">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="recent-orders">
        <div className="flex items-end justify-between gap-4">
          <h2 id="recent-orders" className="display-s text-ink-primary">
            Recent orders
          </h2>
          {orders.length > 0 && (
            <Link
              href="/account/orders"
              className="text-sm text-accent transition-colors hover:text-accent-strong"
            >
              See all
            </Link>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="glass-pane mt-6 rounded-card p-8 text-center">
            <Package className="mx-auto size-6 text-ink-muted" strokeWidth={1.25} />
            <p className="mt-4 text-sm text-ink-secondary">You have not ordered yet.</p>
            <Button className="mt-6" asChild>
              <Link href="/collection">Browse the collection</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-hairline-faint border-y border-hairline-faint">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="flex items-center justify-between gap-4 py-5 transition-colors hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-ink-primary">{order.orderNumber}</p>
                    <p className="mt-1 text-xs text-ink-tertiary">
                      {formatDate(order.placedAt ?? order.createdAt)} ·{" "}
                      {order.itemCount} {order.itemCount === 1 ? "piece" : "pieces"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <OrderStatusBadge status={order.status} />
                    <span className="figure tnum text-sm text-ink-primary">
                      {formatPrice(order.grandTotal, order.currency)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Shortcuts" className="grid gap-4 sm:grid-cols-2">
        {[
          { href: "/account/addresses", label: "Addresses", body: "Where your orders go.", icon: MapPin },
          { href: "/account/wishlist", label: "Saved pieces", body: "What you are waiting for.", icon: Heart },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="glass-pane group rounded-card p-6 transition-colors hover:border-accent-line/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line"
          >
            <card.icon className="size-5 text-accent-quiet" strokeWidth={1.5} aria-hidden />
            <p className="mt-4 text-sm text-ink-primary">{card.label}</p>
            <p className="mt-1 text-xs text-ink-tertiary">{card.body}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
