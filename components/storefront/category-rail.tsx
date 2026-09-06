import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/storefront/reveal";
import { SectionHeading } from "@/components/storefront/section-heading";
import type { Category } from "@/types";

export function CategoryRail({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="section" aria-labelledby="categories-title">
      <div className="shell">
        <SectionHeading
          eyebrow="By category"
          title="Six ways in"
          link={{ label: "See everything", href: "/collection" }}
        />

        <ul className="scrollbar-none rail-mask mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 lg:grid lg:grid-cols-6 lg:overflow-visible lg:[mask-image:none]">
          {categories.map((category, i) => (
            <Reveal
              as="li"
              key={category.slug}
              delay={i * 50}
              className="w-[46vw] shrink-0 snap-start sm:w-[30vw] lg:w-auto"
            >
              <Link
                href={`/category/${category.slug}`}
                className="group block rounded-[20px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-line"
              >
                <div className="glass-pane glass-interactive relative overflow-hidden">
                  <div className="relative aspect-4/5 overflow-hidden rounded-[19px]">
                    {category.imageUrl && (
                      <Image
                        src={category.imageUrl}
                        alt={category.imageAlt ?? ""}
                        fill
                        sizes="(min-width: 1024px) 200px, 46vw"
                        className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.05]"
                      />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-scrim/85 via-scrim/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <h3 className="font-display text-base font-normal leading-tight tracking-[-0.005em] text-ink-on-scrim">
                        {category.name}
                      </h3>
                      {category.productCount !== undefined && (
                        <p className="tnum mt-0.5 text-[0.6875rem] uppercase tracking-[0.16em] text-accent-on-scrim">
                          {category.productCount} pieces
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
