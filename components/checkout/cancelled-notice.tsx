"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cancelPendingOrder } from "@/lib/actions/checkout";

/**
 * Shown when Stripe sends the shopper back without paying.
 *
 * It also releases the reservation that checkout took. Waiting for the session
 * to expire would work, but it holds the piece out of stock for an hour after
 * someone has visibly walked away — and for a house with one of each size, that
 * is a lost sale.
 */
export function CancelledNotice({ orderNumber }: { orderNumber: string }) {
  const [released, setReleased] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    void cancelPendingOrder(orderNumber).then((result) => {
      if (result.ok) setReleased(true);
    });
  }, [orderNumber]);

  return (
    <p
      role="status"
      className="mb-8 flex items-start gap-2 rounded-[12px] border border-hairline bg-tint px-4 py-3 text-sm leading-relaxed text-ink-secondary"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-signal-warning" strokeWidth={1.75} />
      <span>
        Payment was not completed, so nothing was charged.
        {released ? " Your bag is intact and the pieces are back in stock." : " Your bag is intact."}
      </span>
    </p>
  );
}
