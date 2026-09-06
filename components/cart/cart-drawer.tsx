"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useState } from "react";

import { CartLineItem } from "@/components/cart/cart-line-item";
import { useCart } from "@/components/cart/cart-provider";
import { CartSummary } from "@/components/cart/cart-summary";
import { StoreUnavailable } from "@/components/cart/store-unavailable";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The bag, as a drawer.
 *
 * Opened by the header button and by adding a piece from a product page. It
 * shows loading, empty, error and not-connected states — never a blank panel
 * that leaves the shopper guessing which of the four they are looking at.
 */
export function CartDrawer() {
  const { cart, status, isUnconfigured, isBlocked, isDrawerOpen, closeDrawer } = useCart();
  const [error, setError] = useState<string | null>(null);

  const isEmpty = cart.lines.length === 0;

  return (
    <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent side="right" className="gap-0 p-0">
        <header className="border-b border-hairline-faint px-6 py-5 pr-16">
          <SheetTitle className="display-s text-ink-primary">Your bag</SheetTitle>
          <SheetDescription className="mt-1 text-xs text-ink-tertiary">
            {isBlocked
              ? "Not connected to a database yet"
              : cart.itemCount === 0
                ? "Nothing added yet"
                : `${cart.itemCount} ${cart.itemCount === 1 ? "piece" : "pieces"}`}
          </SheetDescription>
        </header>

        {error && (
          <p
            role="alert"
            className="border-b border-signal-danger/30 bg-signal-danger/10 px-6 py-3 text-xs text-signal-danger"
          >
            {error}
          </p>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          {status === "loading" ? (
            <div className="space-y-4 py-6" aria-busy>
              <span className="sr-only">Loading your bag</span>
              {[0, 1].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-[90px] w-[72px]" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-9 w-28" />
                  </div>
                </div>
              ))}
            </div>
          ) : isBlocked ? (
            <StoreUnavailable
              reason={isUnconfigured ? "unconfigured" : "unreachable"}
              context="bag"
              compact
            />
          ) : isEmpty ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <ShoppingBag className="size-6 text-ink-muted" strokeWidth={1.25} />
              <p className="text-sm text-ink-secondary">Your bag is empty.</p>
              <Button variant="outline" size="sm" asChild onClick={closeDrawer}>
                <Link href="/collection">Browse the collection</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-hairline-faint">
              {cart.lines.map((line) => (
                <CartLineItem
                  key={line.itemId}
                  line={line}
                  currency={cart.currency}
                  variant="compact"
                  onError={setError}
                />
              ))}
            </div>
          )}
        </div>

        {!isEmpty && !isBlocked && status !== "loading" && (
          <footer className="border-t border-hairline-faint px-6 py-5">
            <CartSummary cart={cart} shippingKnown={false} />
            <div className="mt-5 flex flex-col gap-2">
              <Button size="lg" asChild onClick={closeDrawer} className="w-full">
                <Link href="/checkout">Checkout</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild onClick={closeDrawer} className="w-full">
                <Link href="/cart">View the full bag</Link>
              </Button>
            </div>
          </footer>
        )}
      </SheetContent>
    </Sheet>
  );
}
