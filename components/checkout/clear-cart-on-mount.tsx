"use client";

import { useEffect } from "react";

import { useCart } from "@/components/cart/cart-provider";

/**
 * Refreshes cart state once the order is confirmed.
 *
 * `mark_order_paid()` deletes the cart server-side, but the browser is still
 * holding the last count it saw — so the bag icon would keep a stale badge
 * until the next full load. This re-reads the truth rather than assuming zero.
 */
export function ClearCartOnMount() {
  const { refresh } = useCart();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return null;
}
