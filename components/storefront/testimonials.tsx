import { Quote } from "lucide-react";

import { Reveal } from "@/components/storefront/reveal";
import { SectionHeading } from "@/components/storefront/section-heading";
import { Rating } from "@/components/ui/rating";
import type { Testimonial } from "@/types";

export function Testimonials({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;

  return (
    <section className="section" aria-labelledby="testimonials-title">
      <div className="shell">
        <SectionHeading eyebrow="From the ledger" title="What clients say in year three" />

        <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 6).map((item, i) => (
            <Reveal as="li" key={`${item.author}-${i}`} delay={i * 70}>
              <figure className="glass-pane glass-interactive flex h-full flex-col gap-6 p-7">
                <Quote className="size-5 shrink-0 text-accent-quiet" strokeWidth={1.5} aria-hidden />

                <blockquote className="flex-1">
                  <p className="font-display text-[1.25rem] font-light leading-snug tracking-[-0.015em] text-ink-primary">
                    “{item.quote}”
                  </p>
                </blockquote>

                <figcaption className="border-t border-hairline-faint pt-5">
                  <p className="text-sm font-medium text-ink-primary">{item.author}</p>
                  <p className="mt-0.5 text-xs text-ink-tertiary">
                    {[item.title, item.location].filter(Boolean).join(" · ")}
                  </p>
                  {item.rating !== null && <Rating value={item.rating} className="mt-3" />}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
