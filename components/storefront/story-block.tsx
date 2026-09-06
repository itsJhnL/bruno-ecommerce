import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Reveal } from "@/components/storefront/reveal";
import { cn } from "@/lib/utils/cn";
import type { StorySection } from "@/types";

/**
 * The storytelling section. Alternating 7/5 split, generous air, a pull quote
 * set in the display serif, and one number that carries the argument.
 */
export function StoryBlock({ story, index }: { story: StorySection; index: number }) {
  const flipped = index % 2 === 1;
  const paragraphs = story.body.split("\n\n").filter(Boolean);

  return (
    <section className="section" aria-labelledby={`story-${story.key}`}>
      <div className="shell">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-20">
          <Reveal
            className={cn("lg:col-span-5", flipped ? "lg:order-2" : "lg:order-1")}
          >
            <div className="glass-vitrine relative overflow-hidden p-2.5">
              <div className="relative aspect-4/5 overflow-hidden rounded-[26px]">
                {story.imageUrl && (
                  <Image
                    src={story.imageUrl}
                    alt={story.imageAlt ?? ""}
                    fill
                    sizes="(min-width: 1024px) 460px, 92vw"
                    className="object-cover"
                  />
                )}
              </div>

              {story.statValue && (
                <div className="absolute bottom-7 left-7 right-7">
                  <div className="glass-pane inline-flex flex-col px-5 py-4">
                    <span className="figure text-4xl leading-none text-accent">
                      {story.statValue}
                    </span>
                    <span className="mt-2 max-w-[22ch] text-[0.6875rem] uppercase leading-relaxed tracking-[0.14em] text-ink-tertiary">
                      {story.statLabel}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Reveal>

          <Reveal
            delay={120}
            className={cn("lg:col-span-7", flipped ? "lg:order-1" : "lg:order-2")}
          >
            {story.eyebrow && <p className="eyebrow">{story.eyebrow}</p>}

            <h2 id={`story-${story.key}`} className="display-l mt-5 max-w-[16ch] text-ink-primary">
              {story.title}
            </h2>

            <div className="prose-house mt-8">
              {paragraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            {story.quote && (
              <blockquote className="mt-10 border-l border-accent-quiet/50 pl-6">
                <p className="font-display text-[1.375rem] font-light leading-snug tracking-[-0.015em] text-accent-strong md:text-[1.625rem]">
                  “{story.quote}”
                </p>
              </blockquote>
            )}

            {story.ctaHref && story.ctaLabel && (
              <Link
                href={story.ctaHref}
                className="group mt-10 inline-flex items-center gap-2 text-sm text-accent transition-colors hover:text-accent-strong"
              >
                {story.ctaLabel}
                <ArrowUpRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </Link>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
