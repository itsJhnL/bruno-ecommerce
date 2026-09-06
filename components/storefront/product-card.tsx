import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { cn } from "@/lib/utils/cn";
import { discountPercent, formatPrice } from "@/lib/utils/format";
import type { ProductCard as ProductCardType } from "@/types";

interface ProductCardProps {
  product: ProductCardType;
  priority?: boolean;
  className?: string;
  /** Sets the `sizes` hint so the browser downloads the right resolution. */
  sizes?: string;
}

export function ProductCard({
  product,
  priority = false,
  className,
  sizes = "(min-width: 1280px) 320px, (min-width: 768px) 45vw, 90vw",
}: ProductCardProps) {
  const off = discountPercent(product.price, product.compareAtPrice);
  const lowStock = product.isInStock && product.availableQuantity <= 6;

  return (
    <article className={cn("group relative", className)}>
      <Link
        href={`/product/${product.slug}`}
        className="block rounded-[20px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-line"
      >
        {/* Fixed 4:5 frame — no exceptions, no layout shift. */}
        <div className="glass-pane glass-interactive plinth relative overflow-hidden">
          <div className="relative aspect-4/5 w-full overflow-hidden rounded-[19px]">
            <Image
              src={product.imageUrl}
              alt={product.imageAlt}
              fill
              sizes={sizes}
              priority={priority}
              className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.035]"
            />

            {/* Badges carry an icon-free word, never colour alone. */}
            <div className="absolute left-4 top-4 z-10 flex flex-col items-start gap-2">
              {product.isLimited && <Badge tone="accentOnScrim">Limited</Badge>}
              {product.isNew && !product.isLimited && <Badge tone="accentOnScrim">New</Badge>}
              {product.isMembersOnly && <Badge tone="accentOnScrim">Members</Badge>}
              {off !== null && <Badge tone="onScrim">{off}% off</Badge>}
            </div>

            {!product.isInStock && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-scrim/70 backdrop-blur-[2px]">
                <Badge tone="onScrim">Sold out</Badge>
              </div>
            )}

            {lowStock && (
              <div className="absolute bottom-4 left-4 z-10">
                <Badge tone="onScrim">{product.availableQuantity} left</Badge>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-start justify-between gap-6">
          <div className="min-w-0">
            {product.categoryName && (
              <p className="eyebrow mb-2 text-accent-quiet">{product.categoryName}</p>
            )}
            <h3 className="display-s text-ink-primary transition-colors group-hover:text-accent-strong">
              {product.name}
            </h3>
            {product.subtitle && (
              <p className="mt-1.5 line-clamp-1 text-[0.8125rem] text-ink-tertiary">
                {product.subtitle}
              </p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <p className="figure text-xl text-accent">
              {formatPrice(product.price, product.currency)}
            </p>
            {product.compareAtPrice && (
              <p className="tnum mt-0.5 text-xs text-ink-muted line-through">
                {formatPrice(product.compareAtPrice, product.currency)}
              </p>
            )}
          </div>
        </div>

        {product.ratingCount > 0 && (
          <Rating value={product.ratingAverage} count={product.ratingCount} className="mt-3" />
        )}
      </Link>
    </article>
  );
}
