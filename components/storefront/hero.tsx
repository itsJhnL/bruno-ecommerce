import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/storefront/reveal";
import { Button } from "@/components/ui/button";
import type { Banner, ProductCard as ProductCardType } from "@/types";
import { formatPrice } from "@/lib/utils/format";

interface HeroProps {
  banner: Banner | null;
  spotlight: ProductCardType | null;
  stats: { value: string; label: string }[];
}

export function Hero({ banner, spotlight, stats }: HeroProps) {
  const eyebrow = banner?.eyebrow ?? "Autumn / Winter";
  const title = banner?.title ?? "Clothes that outlast the reason you bought them";
  const body =
    banner?.subtitle ??
    "Grade-A cashmere, vegetable-tanned leather and half-canvas tailoring, made in numbers small enough to finish by hand.";

  return (
    <section className="relative overflow-hidden pb-16 pt-10 md:pb-24 md:pt-16" aria-labelledby="hero-title">
      {/* The hero backdrop. Purely decorative, so it is a CSS background rather
          than an <img> — that way only the ACTIVE theme's file is ever
          downloaded (the variants are swapped by --editorial-hero). */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="editorial-hero absolute inset-0" />
        <div className="absolute inset-0 bg-linear-to-b from-canvas/40 via-canvas/20 to-canvas" />
      </div>

      <div className="shell">
        {/* 7/5, not 6/6. Symmetry reads corporate. */}
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-7">
            <p className="eyebrow">{eyebrow}</p>

            <h1 id="hero-title" className="display-xl mt-7 max-w-[15ch] text-ink-primary">
              {title}
            </h1>

            <p className="lede mt-8 max-w-xl">{body}</p>

            <div className="mt-11 flex flex-wrap items-center gap-4">
              <Button asChild size="lg">
                <Link href={banner?.ctaHref ?? "/collection"}>
                  {banner?.ctaLabel ?? "Explore the collection"}
                  <ArrowRight className="size-4" strokeWidth={1.5} />
                </Link>
              </Button>

              {banner?.secondaryCtaHref && banner.secondaryCtaLabel && (
                <Button asChild variant="outline" size="lg">
                  <Link href={banner.secondaryCtaHref}>{banner.secondaryCtaLabel}</Link>
                </Button>
              )}
            </div>

            {stats.length > 0 && (
              <dl className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-hairline-faint pt-8">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <dt className="sr-only">{stat.label}</dt>
                    <dd>
                      <span className="figure block text-3xl text-accent">
                        {stat.value}
                      </span>
                      <span className="mt-1.5 block text-[0.6875rem] uppercase tracking-[0.16em] text-ink-tertiary">
                        {stat.label}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </Reveal>

          {spotlight && (
            <Reveal delay={140} className="lg:col-span-5">
              {/* The single Monolith on the page. Design.md §4. */}
              <Link
                href={`/product/${spotlight.slug}`}
                className="glass-monolith plinth group relative block overflow-hidden p-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-line"
              >
                <div className="relative aspect-4/5 w-full overflow-hidden rounded-[26px]">
                  <Image
                    src={spotlight.imageUrl}
                    alt={spotlight.imageAlt}
                    fill
                    priority
                    sizes="(min-width: 1024px) 440px, 90vw"
                    className="object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-scrim/90 to-transparent p-6 pt-16">
                    <p className="eyebrow text-accent-on-scrim">
                      {spotlight.isLimited ? "Limited release" : "In the vitrine"}
                    </p>
                    <h2 className="display-s mt-2 text-ink-on-scrim">{spotlight.name}</h2>
                    <p className="figure mt-1 text-lg text-accent-on-scrim">
                      {formatPrice(spotlight.price, spotlight.currency)}
                    </p>
                  </div>
                </div>
              </Link>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
