import Link from "next/link";
import { PackageOpen } from "lucide-react";

import { ProductCard } from "@/components/storefront/product-card";
import { Reveal } from "@/components/storefront/reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { ProductCard as ProductCardType } from "@/types";

interface ProductGridProps {
  products: ProductCardType[];
  columns?: 2 | 3 | 4;
  priorityCount?: number;
  className?: string;
  emptyTitle?: string;
  emptyBody?: string;
}

export function ProductGrid({
  products,
  columns = 3,
  priorityCount = 0,
  className,
  emptyTitle = "Nothing matches those filters",
  emptyBody = "Try widening the price range, or clearing a filter or two.",
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="glass-pane flex flex-col items-center gap-4 px-8 py-20 text-center">
        <PackageOpen className="size-8 text-accent-quiet" strokeWidth={1.25} aria-hidden />
        <h3 className="display-s text-ink-primary">{emptyTitle}</h3>
        <p className="max-w-sm text-sm text-ink-tertiary">{emptyBody}</p>
        <Button asChild variant="outline" size="sm" className="mt-2">
          <Link href="/collection">Clear all filters</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul
      className={cn(
        "grid gap-x-6 gap-y-14 sm:grid-cols-2",
        columns === 3 && "lg:grid-cols-3",
        columns === 4 && "lg:grid-cols-4",
        className
      )}
    >
      {products.map((product, i) => (
        <Reveal as="li" key={product.id} delay={Math.min(i, 5) * 60}>
          <ProductCard
            product={product}
            priority={i < priorityCount}
            sizes={
              columns === 4
                ? "(min-width: 1280px) 300px, (min-width: 640px) 45vw, 90vw"
                : "(min-width: 1280px) 400px, (min-width: 640px) 45vw, 90vw"
            }
          />
        </Reveal>
      ))}
    </ul>
  );
}
