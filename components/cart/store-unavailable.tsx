import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface StoreUnavailableProps {
  /** `unconfigured` = no keys. `unreachable` = keys, but no schema behind them. */
  reason: "unconfigured" | "unreachable";
  /** Changes the noun, because "your bag" and "checkout" fail differently. */
  context: "bag" | "checkout";
  compact?: boolean;
  className?: string;
}

/**
 * The one place that explains why the shop cannot take an order.
 *
 * Two failures look identical from the browser and are completely different to
 * fix, so they are never collapsed into one message: missing keys is an env
 * problem, a missing schema is a migration that was never run. Both used to
 * render as "your bag is empty", which is the exact fake-success that
 * Agents.md directive #1 exists to prevent.
 */
export function StoreUnavailable({
  reason,
  context,
  compact = false,
  className,
}: StoreUnavailableProps) {
  const title =
    reason === "unconfigured"
      ? "No database is connected"
      : "The database has no schema yet";

  const body =
    reason === "unconfigured" ? (
      <>
        You are browsing the built-in demo catalogue. {context === "bag" ? "Bags" : "Checkout"},
        orders and payment need a Supabase project — add the keys to{" "}
        <span className="text-ink-primary">.env.local</span>.
      </>
    ) : (
      <>
        Supabase is answering, but the tables have not been created, so nothing can be
        added or ordered. Paste{" "}
        <span className="text-ink-primary">supabase/apply-all.sql</span> into the Supabase
        SQL editor and run it.
      </>
    );

  if (compact) {
    return (
      <div className={cn("flex flex-col items-center gap-3 py-16 text-center", className)}>
        <AlertTriangle className="size-6 text-signal-warning" strokeWidth={1.5} />
        <p className="text-sm text-ink-secondary">{title}</p>
        <p className="max-w-[34ch] text-xs leading-relaxed text-ink-tertiary">{body}</p>
      </div>
    );
  }

  return (
    <div className={cn("glass-pane mx-auto max-w-xl rounded-card p-10 text-center", className)}>
      <AlertTriangle className="mx-auto size-7 text-signal-warning" strokeWidth={1.4} />
      <h2 className="display-s mt-5 text-ink-primary">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-secondary">{body}</p>
      <p className="mt-4 text-xs text-ink-tertiary">
        Nothing here is faked: this page says so rather than showing you an empty bag.
      </p>
      <Button variant="outline" className="mt-7" asChild>
        <Link href="/collection">Back to the collection</Link>
      </Button>
    </div>
  );
}
