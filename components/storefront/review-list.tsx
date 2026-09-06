import { BadgeCheck } from "lucide-react";

import { ReviewForm } from "@/components/storefront/review-form";
import { Rating } from "@/components/ui/rating";
import { relativeTime } from "@/lib/utils/format";
import type { Review } from "@/types";

interface ReviewListProps {
  reviews: readonly Review[];
  ratingAverage: number;
  ratingCount: number;
  productId: string;
  productName: string;
}

export function ReviewList({
  reviews,
  ratingAverage,
  ratingCount,
  productId,
  productName,
}: ReviewListProps) {
  // Distribution, computed from the reviews we actually have.
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((review) => review.rating === star).length,
  }));
  const total = reviews.length || 1;

  return (
    <section aria-labelledby="reviews-title" className="scroll-mt-28" id="reviews">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <h2 id="reviews-title" className="display-m text-ink-primary">
            Reviews
          </h2>

          {ratingCount > 0 ? (
            <>
              <div className="mt-6 flex items-baseline gap-3">
                <span className="figure text-5xl text-accent">
                  {ratingAverage.toFixed(1)}
                </span>
                <span className="tnum text-sm text-ink-tertiary">
                  from {ratingCount} {ratingCount === 1 ? "review" : "reviews"}
                </span>
              </div>

              <Rating value={ratingAverage} size="md" className="mt-3" />

              <ul className="mt-8 space-y-2.5">
                {distribution.map((row) => (
                  <li key={row.star} className="flex items-center gap-3">
                    <span className="tnum w-4 text-xs text-ink-tertiary">{row.star}</span>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-tint-strong">
                      <div
                        className="h-full rounded-full bg-accent-solid"
                        style={{ width: `${(row.count / total) * 100}%` }}
                      />
                    </div>
                    <span className="tnum w-6 text-right text-xs text-ink-muted">{row.count}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-6 text-sm text-ink-tertiary">No reviews yet.</p>
          )}

          <ReviewForm productId={productId} productName={productName} />
        </div>

        <div className="lg:col-span-8">
          {reviews.length === 0 ? (
            <div className="glass-pane px-8 py-14 text-center">
              <p className="text-sm text-ink-tertiary">
                This piece has no reviews yet. Be the first — reviews are read by a person
                before they appear.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-hairline-faint border-t border-hairline-faint">
              {reviews.map((review) => (
                <li key={review.id} className="py-8 first:pt-8">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <Rating value={review.rating} />
                    {review.isVerified && (
                      <span className="inline-flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-[0.14em] text-signal-success">
                        <BadgeCheck className="size-3.5" strokeWidth={1.75} aria-hidden />
                        Verified purchase
                      </span>
                    )}
                    <span className="ml-auto text-xs text-ink-muted">
                      {relativeTime(review.createdAt)}
                    </span>
                  </div>

                  {review.title && (
                    <h3 className="mt-4 display-s text-ink-primary">{review.title}</h3>
                  )}

                  <p className="mt-3 max-w-[68ch] text-sm leading-relaxed text-ink-secondary">
                    {review.body}
                  </p>

                  <p className="mt-4 text-xs text-ink-tertiary">
                    {review.author}
                    {review.location ? ` · ${review.location}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
