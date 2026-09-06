"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Loader2, X } from "lucide-react";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { removeWishlistItem } from "@/lib/actions/account";
import { formatPrice } from "@/lib/utils/format";
import type { WishlistEntry } from "@/lib/queries/account";

export function WishlistGrid({ items }: { items: WishlistEntry[] }) {
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const visible = items.filter((item) => !removed.has(item.id));

  const remove = (id: string) => {
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const result = await removeWishlistItem({ id });
      if (result.ok) {
        // Hide it locally as well: the server revalidates, but this list is
        // rendered from props and would otherwise sit stale until navigation.
        setRemoved((prev) => new Set(prev).add(id));
      } else {
        setError(result.error);
      }
      setBusyId(null);
    });
  };

  if (visible.length === 0) {
    return (
      <div className="glass-pane rounded-card p-10 text-center">
        <Heart className="mx-auto size-7 text-ink-muted" strokeWidth={1.25} />
        <h3 className="display-s mt-5 text-ink-primary">Nothing saved yet</h3>
        <p className="mt-3 text-sm text-ink-secondary">
          The heart on any piece keeps it here.
        </p>
        <Button className="mt-7" asChild>
          <Link href="/collection">Browse the collection</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h3 className="display-s text-ink-primary">Saved pieces</h3>

      {error && (
        <p role="alert" className="mt-4 text-sm text-signal-danger">
          {error}
        </p>
      )}

      <ul className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((item) => (
          <li key={item.id} className="group relative">
            <Link
              href={`/product/${item.slug}`}
              className="block rounded-[20px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-line"
            >
              <div className="relative aspect-4/5 overflow-hidden rounded-[20px] border border-hairline-faint bg-canvas-raised">
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.imageAlt ?? item.name}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 90vw"
                  />
                )}
                {!item.isInStock && (
                  <span className="absolute left-3 top-3">
                    <Badge tone="onScrim">Sold out</Badge>
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-baseline justify-between gap-3">
                <p className="text-sm text-ink-primary">{item.name}</p>
                <p className="figure tnum shrink-0 text-sm text-accent">
                  {formatPrice(item.price, item.currency)}
                </p>
              </div>
              {item.subtitle && (
                <p className="mt-1 text-xs text-ink-tertiary">{item.subtitle}</p>
              )}
            </Link>

            <button
              type="button"
              onClick={() => remove(item.id)}
              disabled={busyId === item.id}
              aria-label={`Remove ${item.name} from your saved pieces`}
              className="absolute right-3 top-3 grid size-9 place-items-center rounded-full border border-white/25 bg-black/45 text-ink-on-scrim backdrop-blur-md transition-colors hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line disabled:opacity-50"
            >
              {busyId === item.id ? (
                <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
              ) : (
                <X className="size-4" strokeWidth={1.75} />
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
