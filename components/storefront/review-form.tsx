"use client";

import { usePathname, useRouter } from "next/navigation";
import { Check, Loader2, Star } from "lucide-react";
import { useState, useTransition } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { submitReview } from "@/lib/actions/account";
import { cn } from "@/lib/utils/cn";

/**
 * Writing a review.
 *
 * It is submitted as PENDING and stays invisible until a moderator approves it
 * — so this form cannot publish anything, and the copy says so rather than
 * implying the review appears straight away.
 */
export function ReviewForm({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const { isSignedIn, status } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const known = status !== "loading";

  if (done) {
    return (
      <div
        role="status"
        className="mt-8 rounded-card border border-accent-line/40 bg-accent-wash/25 p-6"
      >
        <Check className="size-5 text-accent" strokeWidth={2} />
        <p className="display-s mt-3 text-ink-primary">Thank you</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
          Your review is with us. It appears once a person has read it — usually within a
          working day.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        className="mt-8"
        onClick={() => {
          if (known && !isSignedIn) {
            router.push(`/login?next=${encodeURIComponent(pathname)}`);
            return;
          }
          setOpen(true);
        }}
      >
        Write a review
      </Button>
    );
  }

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setErrors({});

    startTransition(async () => {
      const result = await submitReview({ productId, rating, title, body });
      if (!result.ok) {
        setFormError(result.error);
        if (result.field) setErrors({ [result.field]: result.error });
        return;
      }
      setDone(true);
    });
  };

  return (
    <form onSubmit={submit} noValidate className="mt-8 max-w-lg space-y-5">
      <h4 className="display-s text-ink-primary">Review {productName}</h4>

      <fieldset>
        <legend className="eyebrow mb-3 text-accent-quiet">Your rating</legend>
        <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((value) => {
            const lit = (hovered || rating) >= value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHovered(value)}
                aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                aria-pressed={rating === value}
                className="grid size-10 place-items-center rounded-[8px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line"
              >
                <Star
                  className={cn("size-5", lit ? "fill-current text-accent" : "text-ink-muted")}
                  strokeWidth={1.5}
                />
              </button>
            );
          })}
        </div>
        {errors.rating && (
          <p role="alert" className="mt-2 text-xs text-signal-danger">
            {errors.rating}
          </p>
        )}
      </fieldset>

      <Field
        label="Headline"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
        optional
        disabled={pending}
      />

      <div className="flex flex-col gap-2">
        <label htmlFor="review-body" className="text-sm text-ink-secondary">
          Your review
        </label>
        <textarea
          id="review-body"
          name="body"
          rows={5}
          value={body}
          maxLength={5000}
          onChange={(e) => setBody(e.target.value)}
          disabled={pending}
          aria-invalid={errors.body ? true : undefined}
          className="w-full rounded-[12px] border border-hairline-strong bg-tint px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent-line/50 focus:outline-2 focus:outline-offset-2 focus:outline-accent-line"
          placeholder="How does it wear? What surprised you?"
        />
        {errors.body && (
          <p role="alert" className="text-xs text-signal-danger">
            {errors.body}
          </p>
        )}
      </div>

      {formError && (
        <p role="alert" className="text-sm text-signal-danger">
          {formError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />}
          Send review
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </Button>
      </div>

      <p className="text-xs leading-relaxed text-ink-muted">
        Reviews are read by a person before they appear. If you bought this piece from us,
        it will carry a verified badge.
      </p>
    </form>
  );
}
