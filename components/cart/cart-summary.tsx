import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import type { CartPricing } from "@/types";

interface CartSummaryProps {
  cart: CartPricing;
  /** Before a shipping method is chosen, shipping is unknown, not zero. */
  shippingKnown?: boolean;
  className?: string;
}

function Row({
  label,
  value,
  tone = "default",
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: "default" | "muted" | "accent";
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
      <dt className={tone === "muted" ? "text-ink-tertiary" : "text-ink-secondary"}>{label}</dt>
      <dd
        className={cn(
          "tnum shrink-0",
          tone === "accent" ? "text-accent" : "text-ink-primary"
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * The totals block, rendered from what Postgres computed. It performs no
 * arithmetic of its own beyond choosing words — every figure below arrives
 * already decided (Agents.md rule 3).
 */
export function CartSummary({ cart, shippingKnown = true, className }: CartSummaryProps) {
  return (
    <dl className={cn("divide-y divide-hairline-faint", className)}>
      <div className="pb-2">
        <Row
          label={`Subtotal · ${cart.itemCount} ${cart.itemCount === 1 ? "piece" : "pieces"}`}
          value={formatPrice(cart.subtotal, cart.currency)}
        />
        {cart.savings > 0 && (
          <Row
            label="You save"
            value={`−${formatPrice(cart.savings, cart.currency)}`}
            tone="accent"
          />
        )}
      </div>

      <div className="py-2">
        {cart.discountTotal > 0 && (
          <Row
            label={cart.couponCode ? `Discount · ${cart.couponCode}` : "Discount"}
            value={`−${formatPrice(cart.discountTotal, cart.currency)}`}
            tone="accent"
          />
        )}

        <Row
          label={cart.shippingMethod ? `Shipping · ${cart.shippingMethod}` : "Shipping"}
          value={
            !shippingKnown ? (
              <span className="text-ink-tertiary">Chosen at checkout</span>
            ) : cart.shippingTotal === 0 ? (
              <span className="text-accent">Complimentary</span>
            ) : (
              formatPrice(cart.shippingTotal, cart.currency)
            )
          }
        />

        {cart.taxTotal > 0 && (
          <Row label="Tax" value={formatPrice(cart.taxTotal, cart.currency)} />
        )}
      </div>

      <div className="flex items-baseline justify-between gap-4 pt-4">
        <dt className="text-sm uppercase tracking-[0.16em] text-ink-secondary">Total</dt>
        <dd className="figure tnum text-2xl text-ink-primary">
          {formatPrice(cart.grandTotal, cart.currency)}
          {!shippingKnown && cart.shippingTotal === 0 && (
            <span className="ml-2 align-middle text-xs tracking-normal text-ink-tertiary">
              plus shipping
            </span>
          )}
        </dd>
      </div>
    </dl>
  );
}
