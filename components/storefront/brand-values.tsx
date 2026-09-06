import { Gem, Layers, RefreshCw, Scissors, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Reveal } from "@/components/storefront/reveal";
import { SectionHeading } from "@/components/storefront/section-heading";
import type { BrandValue } from "@/types";

/** Icons are referenced by name in the CMS, so the map lives here, not in the DB. */
const ICONS: Record<string, LucideIcon> = {
  Gem,
  Layers,
  Scissors,
  RefreshCw,
  Sparkles,
};

export function BrandValues({ values }: { values: BrandValue[] }) {
  if (values.length === 0) return null;

  return (
    <section className="section" aria-labelledby="values-title">
      <div className="shell">
        <SectionHeading
          eyebrow="What we hold to"
          title="Four rules, and no exceptions to them"
          body="Every one of these costs us margin. That is rather the point — they are the reasons a BRUNO piece is still worth owning in its third year."
          align="center"
        />

        <ul className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {values.map((value, i) => {
            const Icon = (value.icon && ICONS[value.icon]) || Sparkles;
            return (
              <Reveal as="li" key={value.title} delay={i * 70}>
                <div className="glass-pane glass-interactive flex h-full flex-col gap-5 p-7">
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-full border border-accent-quiet/40 bg-accent-wash/30"
                    aria-hidden
                  >
                    <Icon className="size-[18px] text-accent" strokeWidth={1.35} />
                  </span>

                  <div>
                    <h3 className="display-s text-ink-primary">
                      {value.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-ink-secondary">
                      {value.description}
                    </p>
                  </div>

                  {value.detail && (
                    <p className="mt-auto border-t border-hairline-faint pt-5 text-[0.8125rem] leading-relaxed text-ink-tertiary">
                      {value.detail}
                    </p>
                  )}
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
