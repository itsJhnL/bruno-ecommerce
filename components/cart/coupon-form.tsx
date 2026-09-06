"use client";

import { Loader2, Tag, X } from "lucide-react";
import { useState, useTransition } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyCoupon, removeCoupon } from "@/lib/actions/cart";

/**
 * Promotion code entry.
 *
 * The discount shown after applying is the one the database computed, not one
 * calculated here. A code that stops qualifying — because the bag changed, or
 * because it expired between now and checkout — simply stops applying, and the
 * totals move with it.
 */
export function CouponForm() {
  const { cart, setCart } = useCart();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const applied = cart.couponValid ? cart.couponCode : null;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await applyCoupon({ code });
      if (result.ok) {
        setCart(result.data);
        setCode("");
      } else {
        setError(result.error);
      }
    });
  };

  const clear = () => {
    setError(null);
    startTransition(async () => {
      const result = await removeCoupon();
      if (result.ok) setCart(result.data);
      else setError(result.error);
    });
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[12px] border border-accent-line/40 bg-accent-wash/30 px-4 py-3">
        <span className="flex min-w-0 items-center gap-2 text-sm text-accent-strong">
          <Tag className="size-3.5 shrink-0" strokeWidth={1.5} />
          <span className="truncate font-medium">{applied}</span>
          <span className="text-ink-tertiary">applied</span>
        </span>
        <button
          type="button"
          onClick={clear}
          disabled={pending}
          className="grid size-7 shrink-0 place-items-center rounded-full text-ink-tertiary transition-colors hover:text-ink-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line disabled:opacity-50"
          aria-label={`Remove promotion code ${applied}`}
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
          ) : (
            <X className="size-3.5" strokeWidth={1.75} />
          )}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="coupon-code" className="eyebrow mb-2 block text-accent-quiet">
        Promotion code
      </label>
      <div className="flex gap-2">
        <Input
          id="coupon-code"
          name="code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Enter code"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          disabled={pending}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "coupon-error" : undefined}
          className="uppercase"
        />
        <Button type="submit" variant="outline" disabled={pending || code.trim().length < 2}>
          {pending ? <Loader2 className="size-4 animate-spin" strokeWidth={1.75} /> : "Apply"}
        </Button>
      </div>
      {error && (
        <p id="coupon-error" role="alert" className="mt-2 text-xs text-signal-danger">
          {error}
        </p>
      )}
    </form>
  );
}
