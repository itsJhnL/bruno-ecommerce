"use client";

import { ShoppingBag } from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/**
 * The header bag button.
 *
 * The badge appears only once the count is known, so it never flashes a zero
 * and then a number. The accessible name always carries the count, because a
 * superscript numeral is not announced usefully on its own.
 */
export function CartButton({ className }: { className?: string }) {
  const { count, status, openDrawer } = useCart();
  const known = status !== "loading";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={openDrawer}
      className={cn("relative", className)}
      aria-label={
        known
          ? count === 0
            ? "Your bag is empty"
            : `Your bag, ${count} ${count === 1 ? "piece" : "pieces"}`
          : "Your bag"
      }
    >
      <ShoppingBag className="size-[18px]" strokeWidth={1.5} />
      {known && count > 0 && (
        <span
          aria-hidden
          className="tnum absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-accent-solid px-1 text-[0.625rem] font-medium leading-4 text-ink-inverse"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Button>
  );
}

/** The same control for the mobile menu, where it needs a label beside it. */
export function CartMenuButton() {
  const { count, status, openDrawer } = useCart();
  const known = status !== "loading";

  return (
    <Button className="w-full" onClick={openDrawer}>
      <ShoppingBag className="size-4" strokeWidth={1.5} />
      Bag
      {known && count > 0 && <span className="tnum">({count})</span>}
    </Button>
  );
}
