"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, ShoppingBag } from "lucide-react";
import { useState } from "react";

import { CartLineItem } from "@/components/cart/cart-line-item";
import { useCart } from "@/components/cart/cart-provider";
import { CartSummary } from "@/components/cart/cart-summary";
import { CouponForm } from "@/components/cart/coupon-form";
import { StoreUnavailable } from "@/components/cart/store-unavailable";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The bag, full width.
 *
 * It reads the same client state the drawer does, so a quantity changed in one
 * is already right in the other. Four states are rendered explicitly: loading,
 * not-connected, empty, and populated.
 */
export function CartPageContent() {
  const { cart, status, isUnconfigured, isBlocked } = useCart();
  const [error, setError] = useState<string | null>(null);

  if (status === "loading") {
    return (
      <div className="grid gap-12 lg:grid-cols-[1fr_380px]" aria-busy>
        <span className="sr-only">Loading your bag</span>
        <div className="space-y-6">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-[130px] w-[104px]" />
              <div className="flex-1 space-y-3 py-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-11 w-32" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (isBlocked) {
    return <StoreUnavailable reason={isUnconfigured ? "unconfigured" : "unreachable"} context="bag" />;
  }

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <ShoppingBag className="mx-auto size-7 text-ink-muted" strokeWidth={1.25} />
        <h2 className="display-s mt-5 text-ink-primary">Your bag is empty</h2>
        <p className="mt-3 text-sm text-ink-secondary">
          Nothing has been added yet. The collection is a good place to start.
        </p>
        <Button className="mt-7" asChild>
          <Link href="/collection">
            Browse the collection <ArrowRight className="size-4" strokeWidth={1.5} />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
      <section aria-label="Items in your bag">
        {error && (
          <p
            role="alert"
            className="mb-6 rounded-[12px] border border-signal-danger/30 bg-signal-danger/10 px-4 py-3 text-sm text-signal-danger"
          >
            {error}
          </p>
        )}

        {cart.hasUnavailable && (
          <p
            role="status"
            className="mb-6 flex items-start gap-2 rounded-[12px] border border-signal-warning/30 bg-signal-warning/10 px-4 py-3 text-sm leading-relaxed text-signal-warning"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
            Something in your bag is no longer available in the quantity you chose. Adjust it
            before checking out.
          </p>
        )}

        <div className="divide-y divide-hairline-faint border-y border-hairline-faint">
          {cart.lines.map((line) => (
            <CartLineItem
              key={line.itemId}
              line={line}
              currency={cart.currency}
              onError={setError}
            />
          ))}
        </div>
      </section>

      <aside aria-label="Order summary" className="lg:sticky lg:top-28 lg:self-start">
        <div className="glass-pane rounded-card p-6">
          <h2 className="eyebrow mb-5 text-accent-quiet">Summary</h2>
          <CartSummary cart={cart} shippingKnown={false} />

          <div className="mt-6">
            <CouponForm />
          </div>

          {/* `asChild` renders a link, which cannot be disabled — so when the
              bag cannot be checked out, a real disabled button is rendered. */}
          {cart.hasUnavailable ? (
            <Button size="lg" className="mt-6 w-full" disabled>
              Checkout
            </Button>
          ) : (
            <Button size="lg" className="mt-6 w-full" asChild>
              <Link href="/checkout">
                Checkout <ArrowRight className="size-4" strokeWidth={1.5} />
              </Link>
            </Button>
          )}

          <p className="mt-4 text-center text-xs leading-relaxed text-ink-muted">
            Shipping and tax are calculated at checkout. Payment is handled by Stripe; we never
            see or store your card.
          </p>
        </div>
      </aside>
    </div>
  );
}
