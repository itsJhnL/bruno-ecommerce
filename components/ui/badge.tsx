import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] " +
    "font-medium uppercase tracking-[0.16em] backdrop-blur-md",
  {
    variants: {
      tone: {
        neutral: "border-hairline bg-tint-strong text-ink-secondary",
        /* Over product imagery, which is dark in both themes — see globals.css. */
        /* Fixed colours. These sit on product imagery, which is dark in BOTH
           themes, so they must not follow the theme tokens — a light-theme
           badge over a dark plate is invisible. */
        onScrim: "border-white/25 bg-black/45 text-ink-on-scrim",
        accentOnScrim: "border-[rgba(201,169,106,0.45)] bg-[rgba(28,22,10,0.6)] text-accent-on-scrim",
        accent: "border-accent-line/40 bg-accent-wash/40 text-accent-strong",
        warning: "border-signal-warning/40 bg-signal-warning/10 text-signal-warning",
        danger: "border-signal-danger/40 bg-signal-danger/10 text-signal-danger",
        success: "border-signal-success/40 bg-signal-success/10 text-signal-success",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
