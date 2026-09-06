import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Reveal } from "@/components/storefront/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import type { Banner, MembershipTier } from "@/types";

interface MembershipCtaProps {
  banner: Banner | null;
  tiers: MembershipTier[];
}

/** The exclusivity moment. One Vitrine, three tiers, and a clear way in. */
export function MembershipCta({ banner, tiers }: MembershipCtaProps) {
  return (
    <section className="section" aria-labelledby="membership-title">
      <div className="shell">
        <Reveal>
          <div className="glass-vitrine relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
              <div className="editorial-membership absolute inset-0" />
              <div className="absolute inset-0 bg-linear-to-r from-canvas/90 via-canvas/60 to-canvas/85" />
            </div>

            <div className="grid gap-12 p-8 md:p-14 lg:grid-cols-12 lg:gap-16 lg:p-16">
              <div className="lg:col-span-5">
                <Badge tone="accent">By invitation</Badge>

                <h2 id="membership-title" className="display-l mt-6 max-w-[14ch] text-ink-primary">
                  {banner?.title ?? "Some pieces never reach the public floor"}
                </h2>

                <p className="lede mt-6">
                  {banner?.subtitle ??
                    "Members see every release forty-eight hours early, and a small number of pieces are never released beyond the Circle at all."}
                </p>

                <div className="mt-10 flex flex-wrap gap-4">
                  <Button asChild size="lg">
                    <Link href={banner?.ctaHref ?? "/membership"}>
                      {banner?.ctaLabel ?? "Request an invitation"}
                      <ArrowRight className="size-4" strokeWidth={1.5} />
                    </Link>
                  </Button>
                </div>

                <p className="mt-6 text-xs leading-relaxed text-ink-muted">
                  Membership is free and begins with your first order. There is no subscription,
                  and there never will be.
                </p>
              </div>

              <ul className="grid gap-4 lg:col-span-7 lg:grid-cols-3">
                {tiers.map((tier, i) => (
                  <li key={tier.slug}>
                    <div
                      className={cn(
                        "flex h-full flex-col gap-5 rounded-[20px] border p-6 backdrop-blur-md transition-colors duration-200",
                        i === 1
                          ? "border-accent-line/40 bg-accent-wash/25"
                          : "border-hairline bg-tint hover:bg-tint-strong"
                      )}
                    >
                      <div>
                        <h3 className="display-s text-ink-primary">{tier.name}</h3>
                        {tier.tagline && (
                          <p className="mt-1 text-[0.6875rem] uppercase tracking-[0.16em] text-accent-quiet">
                            {tier.tagline}
                          </p>
                        )}
                      </div>

                      <p className="tnum text-xs text-ink-tertiary">
                        {tier.minSpend === 0
                          ? "Opens with your first order"
                          : `From ${formatPrice(tier.minSpend)} lifetime`}
                      </p>

                      <ul className="flex-1 space-y-2.5">
                        {tier.benefits.slice(0, 4).map((benefit) => (
                          <li key={benefit} className="flex gap-2.5 text-[0.8125rem] leading-relaxed text-ink-secondary">
                            <Check
                              className="mt-0.5 size-3.5 shrink-0 text-accent"
                              strokeWidth={2}
                              aria-hidden
                            />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>

                      {tier.discountPercent > 0 && (
                        <p className="tnum border-t border-hairline-faint pt-4 text-xs text-accent">
                          {tier.discountPercent}% on every order
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
