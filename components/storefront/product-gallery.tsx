"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils/cn";
import type { ProductImage } from "@/types";

interface ProductGalleryProps {
  images: readonly ProductImage[];
  productName: string;
}

/**
 * One large frame plus a thumbnail rail. Fully keyboard-operable, and every
 * frame is locked to 4:5 so switching images cannot shift the page.
 */
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  if (!current) {
    return <div className="glass-pane aspect-4/5 w-full" aria-label={`${productName} — no image`} />;
  }

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row">
      {images.length > 1 && (
        <div
          role="tablist"
          aria-label={`${productName} images`}
          className="scrollbar-none flex gap-3 overflow-x-auto lg:w-20 lg:flex-col lg:overflow-visible"
        >
          {images.map((image, i) => (
            <button
              key={image.url}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`View image ${i + 1} of ${images.length}`}
              onClick={() => setActive(i)}
              className={cn(
                "relative aspect-4/5 w-16 shrink-0 overflow-hidden rounded-[10px] border transition-colors duration-200 lg:w-full",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line",
                i === active
                  ? "border-accent-line/70"
                  : "border-hairline opacity-65 hover:opacity-100"
              )}
            >
              <Image src={image.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="glass-vitrine plinth relative flex-1 overflow-hidden p-2.5">
        <div className="relative aspect-4/5 w-full overflow-hidden rounded-[26px]">
          <Image
            key={current.url}
            src={current.url}
            alt={current.alt}
            fill
            priority
            sizes="(min-width: 1024px) 620px, 92vw"
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}
