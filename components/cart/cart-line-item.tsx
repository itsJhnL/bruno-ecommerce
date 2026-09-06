"use client";

import Image from "next/image";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import { useTransition } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { Badge } from "@/components/ui/badge";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { removeCartItem, updateCartItem } from "@/lib/actions/cart";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import type { CartLine } from "@/types";

interface CartLineItemProps {
  line: CartLine;
  currency: string;
  onError: (message: string) => void;
  /** Compact is the drawer; comfortable is the cart page. */
  variant?: "compact" | "comfortable";
}

/**
 * One line of a cart. Shared by the drawer and the cart page so the two cannot
 * drift apart — the only difference between them is spacing.
 */
export function CartLineItem({
  line,
  currency,
  onError,
  variant = "comfortable",
}: CartLineItemProps) {
  const { setCart } = useCart();
  const [pending, startTransition] = useTransition();
  const compact = variant === "compact";

  const change = (quantity: number) => {
    startTransition(async () => {
      const result = await updateCartItem({ itemId: line.itemId, quantity });
      if (result.ok) setCart(result.data);
      else onError(result.error);
    });
  };

  const remove = () => {
    startTransition(async () => {
      const result = await removeCartItem({ itemId: line.itemId });
      if (result.ok) setCart(result.data);
      else onError(result.error);
    });
  };

  // Never offer more than the shop can actually ship.
  const max = Math.max(line.quantity, Math.min(line.available, 99));

  return (
    <article
      className={cn(
        "flex gap-4 transition-opacity",
        compact ? "py-4" : "py-6",
        pending && "opacity-60"
      )}
    >
      <Link
        href={`/product/${line.slug}`}
        className="relative shrink-0 overflow-hidden rounded-[12px] border border-hairline-faint bg-canvas-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line"
        style={{ width: compact ? 72 : 104, height: compact ? 90 : 130 }}
        tabIndex={-1}
        aria-hidden
      >
        {line.imageUrl ? (
          <Image
            src={line.imageUrl}
            alt=""
            width={compact ? 72 : 104}
            height={compact ? 90 : 130}
            className="size-full object-cover"
            sizes="104px"
          />
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className={cn("truncate text-ink-primary", compact ? "text-sm" : "text-base")}>
              <Link
                href={`/product/${line.slug}`}
                className="transition-colors hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line"
              >
                {line.name}
              </Link>
            </h3>
            {line.variantTitle && (
              <p className="mt-0.5 truncate text-xs text-ink-tertiary">{line.variantTitle}</p>
            )}
            {!compact && line.sku && (
              <p className="mt-1 text-[0.6875rem] text-ink-muted">SKU {line.sku}</p>
            )}
          </div>

          <p className={cn("figure shrink-0 text-ink-primary", compact ? "text-sm" : "text-lg")}>
            {formatPrice(line.lineTotal, currency)}
          </p>
        </div>

        {!line.isAvailable && (
          <div className="mt-2">
            <Badge tone="danger">
              {line.inStock ? `Only ${line.available} left` : "Sold out"}
            </Badge>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <QuantityStepper
            value={line.quantity}
            max={max}
            size={compact ? "sm" : "md"}
            disabled={pending || !line.inStock}
            label={line.name}
            onChange={change}
          />

          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-[8px] px-2 py-1.5 text-xs text-ink-tertiary transition-colors hover:text-signal-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
            ) : (
              <Trash2 className="size-3.5" strokeWidth={1.5} />
            )}
            <span className={compact ? "sr-only" : undefined}>Remove</span>
            <span className="sr-only"> {line.name}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
