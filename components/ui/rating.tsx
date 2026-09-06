import { Star } from "lucide-react";

import { cn } from "@/lib/utils/cn";

interface RatingProps {
  value: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Stars plus the numeric value. Never stars alone — a rating communicated only
 * by a shape is unreadable to a screen reader and ambiguous at a glance.
 */
export function Rating({ value, count, size = "sm", className }: RatingProps) {
  const dimension = size === "sm" ? "size-3.5" : "size-4";
  const rounded = Math.round(value * 2) / 2;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-0.5" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              dimension,
              i <= rounded
                ? "fill-accent-line text-accent-line"
                : "fill-transparent text-ink-muted"
            )}
            strokeWidth={1.25}
          />
        ))}
      </div>
      <span className="tnum text-xs text-ink-tertiary">
        {value.toFixed(1)}
        {count !== undefined && count > 0 ? ` · ${count}` : ""}
      </span>
      <span className="sr-only">
        Rated {value.toFixed(1)} out of 5{count ? ` from ${count} reviews` : ""}
      </span>
    </div>
  );
}
