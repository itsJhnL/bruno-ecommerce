"use client";

import Link from "next/link";
import { AlertTriangle, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import {
  AddressFieldset,
  EMPTY_ADDRESS,
  type AddressDraft,
} from "@/components/checkout/address-fieldset";
import { useCart } from "@/components/cart/cart-provider";
import { CartSummary } from "@/components/cart/cart-summary";
import { CouponForm } from "@/components/cart/coupon-form";
import { StoreUnavailable } from "@/components/cart/store-unavailable";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { quoteCart } from "@/lib/actions/cart";
import { startCheckout } from "@/lib/actions/checkout";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import { checkoutSchema } from "@/lib/validations/commerce";
import type { CartPricing, ShippingOption } from "@/types";

interface CheckoutFormProps {
  shippingOptions: ShippingOption[];
  /** Prefilled for a signed-in customer; empty for a guest. */
  defaults: { email: string; phone: string } | null;
  /** True when the store has no Supabase project behind it. */
  storeReady: boolean;
  /** True when STRIPE_SECRET_KEY is present on the server. */
  paymentsReady: boolean;
}

const STEPS = [
  "Your details",
  "Shipping address",
  "Delivery",
  "Review and pay",
] as const;

function Step({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`step-${index}`} className="border-t border-hairline-faint pt-8">
      <h2 id={`step-${index}`} className="mb-6 flex items-center gap-3">
        <span className="figure tnum grid size-7 shrink-0 place-items-center rounded-full border border-accent-line/40 text-xs text-accent">
          {index}
        </span>
        <span className="display-s text-ink-primary">{title}</span>
      </h2>
      {children}
    </section>
  );
}

/**
 * Checkout.
 *
 * One page rather than a wizard: every field stays visible, the back button
 * keeps working, and nothing is hidden behind a step the shopper cannot see.
 * The totals panel re-prices on the server whenever the delivery choice
 * changes — this component never adds anything up itself.
 */
export function CheckoutForm({
  shippingOptions,
  defaults,
  storeReady,
  paymentsReady,
}: CheckoutFormProps) {
  const { cart, status, isUnconfigured, isBlocked } = useCart();

  const [email, setEmail] = useState(defaults?.email ?? "");
  const [phone, setPhone] = useState(defaults?.phone ?? "");
  const [shipping, setShipping] = useState<AddressDraft>(EMPTY_ADDRESS);
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState<AddressDraft>(EMPTY_ADDRESS);
  const [note, setNote] = useState("");
  const [marketing, setMarketing] = useState(false);
  const [methodId, setMethodId] = useState<string>(shippingOptions[0]?.id ?? "");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [quoted, setQuoted] = useState<CartPricing | null>(null);
  const [quoting, startQuoting] = useTransition();
  const [submitting, startSubmitting] = useTransition();

  // Re-price whenever the delivery choice or the bag changes. The figures on
  // screen must always be ones the database produced.
  useEffect(() => {
    if (!methodId || cart.itemCount === 0) {
      setQuoted(null);
      return;
    }
    startQuoting(async () => {
      const result = await quoteCart({ shippingMethodId: methodId });
      if (result.ok) setQuoted(result.data);
    });
  }, [methodId, cart.itemCount, cart.subtotal, cart.couponCode]);

  const totals = quoted ?? cart;
  const cannotPay = !storeReady || !paymentsReady || isBlocked;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const payload = {
      email,
      phone,
      shipping,
      billingSameAsShipping: billingSame,
      billing: billingSame ? undefined : billing,
      shippingMethodId: methodId,
      customerNote: note,
      acceptsMarketing: marketing,
    };

    const parsed = checkoutSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".");
        if (!next[path]) next[path] = issue.message;
      }
      setErrors(next);
      setFormError("Some details need attention before we can take payment.");
      // Move the shopper to the first problem rather than leaving them to hunt.
      const first = parsed.error.issues[0]?.path.join(".");
      if (first) {
        const el = document.querySelector<HTMLElement>(
          `[name="${first.replace(/^shipping\./, "shipping-").replace(/^billing\./, "billing-")}"], [name="${first}"]`
        );
        el?.focus();
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      return;
    }

    setErrors({});

    startSubmitting(async () => {
      const result = await startCheckout(payload);
      if (!result.ok) {
        setFormError(result.error);
        if (result.field) setErrors({ [result.field]: result.error });
        return;
      }
      // Stripe's hosted page is a full navigation, not a fetch.
      window.location.assign(result.data.redirectUrl);
    });
  };

  if (status === "loading") {
    return (
      <div className="grid gap-12 lg:grid-cols-[1fr_400px]" aria-busy>
        <span className="sr-only">Loading checkout</span>
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isBlocked) {
    return (
      <StoreUnavailable
        reason={isUnconfigured ? "unconfigured" : "unreachable"}
        context="checkout"
      />
    );
  }

  if (cart.itemCount === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h2 className="display-s text-ink-primary">There is nothing to check out</h2>
        <p className="mt-3 text-sm text-ink-secondary">Your bag is empty.</p>
        <Button className="mt-7" asChild>
          <Link href="/collection">Browse the collection</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-12 lg:grid-cols-[1fr_400px] lg:gap-16">
      <div className="space-y-8">
        <ol className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-tertiary">
          {STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span className="tnum text-accent-quiet">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>

        {!paymentsReady && (
          <p
            role="status"
            className="flex items-start gap-2 rounded-[12px] border border-signal-warning/30 bg-signal-warning/10 px-4 py-3 text-sm leading-relaxed text-signal-warning"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
            Card payments are not connected on this deployment, so the pay button is disabled.
            Add STRIPE_SECRET_KEY to enable it.
          </p>
        )}

        <Step index={1} title="Your details">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              hint="Your receipt and shipping updates go here."
              required
            />
            <Field
              label="Telephone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={errors.phone}
              optional
              hint="Only used if the courier needs you."
            />
          </div>
        </Step>

        <Step index={2} title="Shipping address">
          <AddressFieldset
            prefix="shipping"
            value={shipping}
            errors={errors}
            onChange={setShipping}
            disabled={submitting}
          />

          <label className="mt-6 flex cursor-pointer items-center gap-3 text-sm text-ink-secondary">
            <input
              type="checkbox"
              checked={billingSame}
              onChange={(e) => setBillingSame(e.target.checked)}
              className="size-4 accent-(--color-accent-solid)"
            />
            Billing address is the same
          </label>

          {!billingSame && (
            <div className="mt-6 border-t border-hairline-faint pt-6">
              <h3 className="eyebrow mb-5 text-accent-quiet">Billing address</h3>
              <AddressFieldset
                prefix="billing"
                value={billing}
                errors={errors}
                onChange={setBilling}
                disabled={submitting}
              />
            </div>
          )}
        </Step>

        <Step index={3} title="Delivery">
          {shippingOptions.length === 0 ? (
            <p className="text-sm text-ink-tertiary">
              No delivery methods are configured. Add rows to `shipping_methods`.
            </p>
          ) : (
            <fieldset className="space-y-3">
              <legend className="sr-only">Choose a delivery method</legend>
              {shippingOptions.map((option) => {
                const free =
                  option.freeOver !== null && totals.subtotal - totals.discountTotal >= option.freeOver;
                const selected = methodId === option.id;

                return (
                  <label
                    key={option.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-4 rounded-[14px] border p-4 transition-colors duration-200",
                      selected
                        ? "border-accent-line/60 bg-accent-wash/25"
                        : "border-hairline bg-tint hover:border-hairline-strong"
                    )}
                  >
                    <input
                      type="radio"
                      name="shippingMethodId"
                      value={option.id}
                      checked={selected}
                      onChange={() => setMethodId(option.id)}
                      className="mt-1 size-4 shrink-0 accent-(--color-accent-solid)"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-sm text-ink-primary">{option.name}</span>
                        <span className="figure tnum text-sm text-ink-primary">
                          {free || option.price === 0
                            ? "Complimentary"
                            : formatPrice(option.price, totals.currency)}
                        </span>
                      </span>
                      {option.description && (
                        <span className="mt-1 block text-xs leading-relaxed text-ink-tertiary">
                          {option.description}
                        </span>
                      )}
                      {option.minDays !== null && option.maxDays !== null && (
                        <span className="mt-1 block text-xs text-ink-muted">
                          {option.minDays === option.maxDays
                            ? `${option.minDays} working ${option.minDays === 1 ? "day" : "days"}`
                            : `${option.minDays}–${option.maxDays} working days`}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </fieldset>
          )}

          <div className="mt-6">
            <label htmlFor="customerNote" className="mb-2 block text-sm text-ink-secondary">
              Delivery notes <span className="text-xs text-ink-muted">Optional</span>
            </label>
            <textarea
              id="customerNote"
              name="customerNote"
              rows={3}
              value={note}
              maxLength={1000}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Concierge, buzzer, safe place…"
              className="w-full rounded-[12px] border border-hairline-strong bg-tint px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent-line/50 focus:outline-2 focus:outline-offset-2 focus:outline-accent-line"
            />
          </div>

          <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-ink-secondary">
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              className="mt-1 size-4 accent-(--color-accent-solid)"
            />
            <span className="leading-relaxed">
              Send me the letter — new work and private views, roughly monthly.
            </span>
          </label>
        </Step>
      </div>

      <aside aria-label="Order summary" className="lg:sticky lg:top-28 lg:self-start">
        <div className="glass-pane rounded-card p-6">
          <h2 className="eyebrow mb-5 text-accent-quiet">Review and pay</h2>

          <ul className="mb-5 space-y-3">
            {cart.lines.map((line) => (
              <li key={line.itemId} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0 text-ink-secondary">
                  <span className="tnum text-ink-tertiary">{line.quantity}×</span>{" "}
                  <span className="text-ink-primary">{line.name}</span>
                  {line.variantTitle && (
                    <span className="block text-xs text-ink-tertiary">{line.variantTitle}</span>
                  )}
                </span>
                <span className="tnum shrink-0 text-ink-primary">
                  {formatPrice(line.lineTotal, cart.currency)}
                </span>
              </li>
            ))}
          </ul>

          <CouponForm />

          <div className={cn("mt-6 transition-opacity", quoting && "opacity-60")}>
            <CartSummary cart={totals} shippingKnown={Boolean(methodId)} />
          </div>

          {formError && (
            <p
              role="alert"
              className="mt-5 rounded-[12px] border border-signal-danger/30 bg-signal-danger/10 px-4 py-3 text-sm leading-relaxed text-signal-danger"
            >
              {formError}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="mt-6 w-full"
            disabled={cannotPay || submitting || quoting || cart.hasUnavailable || !methodId}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
                Taking you to Stripe
              </>
            ) : (
              <>
                <Lock className="size-4" strokeWidth={1.5} />
                Pay {formatPrice(totals.grandTotal, totals.currency)}
              </>
            )}
          </Button>

          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
            <ShieldCheck className="mt-px size-3.5 shrink-0" strokeWidth={1.5} />
            Payment is taken on Stripe&rsquo;s own page. Your card details never reach this
            server and are never stored.
          </p>
        </div>
      </aside>
    </form>
  );
}
