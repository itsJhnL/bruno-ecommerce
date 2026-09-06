"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, ShoppingBag } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { addToCart } from "@/lib/actions/cart";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import type { ProductOption, ProductVariant } from "@/types";

interface VariantPickerProps {
  productId: string;
  productName: string;
  options: readonly ProductOption[];
  variants: readonly ProductVariant[];
  price: number;
  currency: string;
}

/**
 * Variant selection and add-to-cart.
 *
 * The selection resolves a real variant — its SKU, its price, its stock — and
 * adding sends only that variant's id and a quantity. The price beside the
 * button is what the catalogue says; the price charged is recomputed on the
 * server from the same row (Agents.md rule 3).
 */
export function VariantPicker({
  productId,
  productName,
  options,
  variants,
  price,
  currency,
}: VariantPickerProps) {
  const [choice, setChoice] = useState<Record<string, string>>(() => {
    // Preselect the first combination that is actually in stock.
    const firstAvailable = variants.find((v) => v.isAvailable) ?? variants[0];
    return firstAvailable ? { ...firstAvailable.options } : {};
  });
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { setCart, openDrawer, isBlocked } = useCart();
  const router = useRouter();

  const selected = useMemo(
    () =>
      variants.find((variant) =>
        Object.entries(choice).every(([key, value]) => variant.options[key] === value)
      ) ?? null,
    [choice, variants]
  );

  /** Would picking this value leave any in-stock variant reachable? */
  const isValueAvailable = (optionName: string, value: string) =>
    variants.some(
      (variant) =>
        variant.options[optionName] === value &&
        variant.isAvailable &&
        Object.entries(choice).every(
          ([key, chosen]) => key === optionName || variant.options[key] === chosen
        )
    );

  const unitPrice = selected?.price ?? price;
  const maxQuantity = Math.max(1, Math.min(selected?.stock ?? 1, 10));
  const canAdd = Boolean(selected?.isAvailable) && !pending;

  /** Adds the selected variant, then either opens the bag or goes to checkout. */
  const add = (then: "drawer" | "checkout") => {
    if (!selected) return;
    setError(null);

    startTransition(async () => {
      const result = await addToCart({ variantId: selected.id, quantity });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCart(result.data);
      setQuantity(1);
      if (then === "checkout") router.push("/checkout");
      else openDrawer();
    });
  };

  return (
    <div className="space-y-8">
      {options.map((option) => (
        <fieldset key={option.name}>
          <legend className="eyebrow mb-3.5 flex w-full items-baseline justify-between text-accent-quiet">
            <span>{option.name}</span>
            {choice[option.name] && (
              <span className="normal-case tracking-normal text-ink-secondary">
                {choice[option.name]}
              </span>
            )}
          </legend>

          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const active = choice[option.name] === value;
              const available = isValueAvailable(option.name, value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setChoice((prev) => ({ ...prev, [option.name]: value }));
                    setQuantity(1);
                  }}
                  className={cn(
                    "relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-[10px] border px-4 text-sm transition-colors duration-200",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line",
                    active
                      ? "border-accent-line/70 bg-accent-wash/40 text-accent-strong"
                      : "border-hairline bg-tint text-ink-secondary hover:border-hairline-strong hover:text-ink-primary",
                    !available && "text-ink-muted"
                  )}
                >
                  {value}
                  {!available && (
                    <>
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-2 top-1/2 h-px -rotate-12 bg-ink-muted/60"
                      />
                      <span className="sr-only"> — unavailable in this combination</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      {/* Stock state, in words as well as colour. */}
      <div className="flex flex-wrap items-center gap-3">
        {selected ? (
          selected.isAvailable ? (
            selected.stock <= 5 ? (
              <Badge tone="warning">Only {selected.stock} left</Badge>
            ) : (
              <Badge tone="success">In stock</Badge>
            )
          ) : (
            <Badge tone="danger">Sold out in this size</Badge>
          )
        ) : (
          <Badge tone="neutral">Choose your options</Badge>
        )}
        {selected && <span className="text-xs text-ink-muted">SKU {selected.sku}</span>}
      </div>

      <div className="flex items-center gap-4">
        <QuantityStepper
          value={quantity}
          max={maxQuantity}
          onChange={setQuantity}
          disabled={pending || !selected?.isAvailable}
          label={productName}
        />

        <p className="figure text-2xl text-accent">
          {formatPrice(unitPrice * quantity, currency)}
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-[12px] border border-signal-danger/30 bg-signal-danger/10 px-4 py-3 text-xs leading-relaxed text-signal-danger"
        >
          <AlertTriangle className="mt-px size-3.5 shrink-0" strokeWidth={1.75} />
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <Button size="lg" className="w-full" onClick={() => add("drawer")} disabled={!canAdd}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
          ) : (
            <ShoppingBag className="size-4" strokeWidth={1.5} />
          )}
          {selected?.isAvailable ? "Add to bag" : "Sold out"}
        </Button>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => add("checkout")}
            disabled={!canAdd}
          >
            Buy now
          </Button>
          <WishlistButton
            productId={productId}
            productName={productName}
            onError={(message) => setError(message || null)}
          />
        </div>

        {isBlocked ? (
          <p className="text-xs leading-relaxed text-ink-muted">
            The bag is not connected to a working database, so adding will report the reason
            rather than pretend to work. See docs/status.md.
          </p>
        ) : (
          <p className="text-xs leading-relaxed text-ink-muted">
            Complimentary insured shipping. Thirty days to change your mind.
          </p>
        )}
      </div>
    </div>
  );
}
