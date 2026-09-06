"use client";

import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils/cn";

interface QuantityStepperProps {
  value: number;
  min?: number;
  max: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  /** Names the thing being counted, for screen readers. */
  label: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * The quantity control, shared by the product page and every cart surface.
 *
 * The count is announced politely rather than assertively: a shopper adjusting
 * quantity is looking at the number, and an assertive live region would
 * interrupt whatever else the screen reader is saying.
 */
export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  disabled = false,
  label,
  size = "md",
  className,
}: QuantityStepperProps) {
  const button =
    size === "sm"
      ? "grid size-9 place-items-center"
      : "grid size-11 place-items-center";
  const icon = size === "sm" ? "size-3" : "size-3.5";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-[12px] border border-hairline bg-tint",
        disabled && "opacity-50",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label={`Decrease quantity of ${label}`}
        className={cn(
          button,
          "text-ink-secondary transition-colors hover:text-ink-primary",
          "disabled:opacity-35 disabled:hover:text-ink-secondary",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line"
        )}
      >
        <Minus className={icon} strokeWidth={1.75} />
      </button>

      <span
        className={cn("tnum text-center text-sm", size === "sm" ? "w-8" : "w-10")}
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="sr-only">{label} quantity: </span>
        {value}
      </span>

      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label={`Increase quantity of ${label}`}
        className={cn(
          button,
          "text-ink-secondary transition-colors hover:text-ink-primary",
          "disabled:opacity-35 disabled:hover:text-ink-secondary",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line"
        )}
      >
        <Plus className={icon} strokeWidth={1.75} />
      </button>
    </div>
  );
}
