import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";

import { OrderStatusBadge } from "@/components/account/order-status";
import { Button } from "@/components/ui/button";
import { getOwnOrders } from "@/lib/queries/account";
import { formatDate, formatPrice } from "@/lib/utils/format";

export default async function OrdersPage() {
  const orders = await getOwnOrders();

  if (orders.length === 0) {
    return (
      <div className="glass-pane rounded-card p-10 text-center">
        <Package className="mx-auto size-7 text-ink-muted" strokeWidth={1.25} />
        <h2 className="display-s mt-5 text-ink-primary">No orders yet</h2>
        <p className="mt-3 text-sm text-ink-secondary">
          When you order, it will appear here with its tracking.
        </p>
        <Button className="mt-7" asChild>
          <Link href="/collection">Browse the collection</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="display-s text-ink-primary">Orders</h2>

      <ul className="mt-8 space-y-4">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              href={`/account/orders/${order.id}`}
              className="glass-pane flex items-center gap-5 rounded-card p-5 transition-colors hover:border-accent-line/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line"
            >
              <div
                className="relative hidden shrink-0 overflow-hidden rounded-[12px] border border-hairline-faint bg-canvas-raised sm:block"
                style={{ width: 72, height: 90 }}
              >
                {order.previewImage && (
                  <Image
                    src={order.previewImage}
                    alt=""
                    width={72}
                    height={90}
                    className="size-full object-cover"
                    sizes="72px"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm text-ink-primary">{order.orderNumber}</p>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="mt-2 text-xs text-ink-tertiary">
                  {formatDate(order.placedAt ?? order.createdAt)} · {order.itemCount}{" "}
                  {order.itemCount === 1 ? "piece" : "pieces"}
                </p>
                {order.trackingNumber && (
                  <p className="mt-1 text-xs text-ink-muted">
                    Tracking {order.trackingNumber}
                  </p>
                )}
              </div>

              <span className="figure tnum shrink-0 text-base text-ink-primary">
                {formatPrice(order.grandTotal, order.currency)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
