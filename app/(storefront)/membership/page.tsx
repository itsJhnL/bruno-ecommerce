import type { Metadata } from "next";
import { Check } from "lucide-react";

import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Reveal } from "@/components/storefront/reveal";
import { SectionHeading } from "@/components/storefront/section-heading";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { MembershipForm } from "@/components/storefront/membership-form";
import { getMembershipTiers } from "@/lib/queries/content";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Membership",
  description:
    "Atelier, Circle and Maison. Early access to every release, private allocation on limited runs, lifetime repairs, and made-to-measure. Free, and never a subscription.",
  alternates: { canonical: "/membership" },
};

export default async function MembershipPage() {
  const tiers = await getMembershipTiers();

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Membership", href: "/membership" },
  ];

  return (
    <div className="pb-8">
      <div className="shell pt-10 md:pt-14">
        <Breadcrumb items={crumbs} />
        <BreadcrumbJsonLd items={crumbs} />
      </div>

      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          <div className="editorial-membership absolute inset-0" />
          <div className="absolute inset-0 bg-linear-to-b from-canvas/60 via-canvas/30 to-canvas" />
        </div>

        <div className="shell max-w-3xl text-center">
          <Badge tone="accent">By invitation</Badge>
          <h1 className="display-xl mt-7 text-ink-primary">The House</h1>
          <p className="lede mx-auto mt-8">
            Membership costs nothing and is not a subscription. It begins with your first order and
            deepens with the relationship — early sight of every release, private allocation on
            limited runs, and eventually made-to-measure.
          </p>
        </div>
      </section>

      <section className="section pt-0" aria-labelledby="tiers-title">
        <div className="shell">
          <SectionHeading
            eyebrow="Three tiers"
            title="How it deepens"
            align="center"
            className="sr-only"
          />

          <ul className="grid gap-5 lg:grid-cols-3">
            {tiers.map((tier, i) => (
              <Reveal as="li" key={tier.slug} delay={i * 90}>
                <div
                  className={cn(
                    "flex h-full flex-col gap-7 p-8",
                    i === 1 ? "glass-vitrine" : "glass-pane glass-interactive"
                  )}
                >
                  <div>
                    <div className="flex items-baseline justify-between gap-4">
                      <h2 className="display-m text-ink-primary">{tier.name}</h2>
                      {i === 1 && <Badge tone="accent">Most held</Badge>}
                    </div>
                    {tier.tagline && (
                      <p className="mt-2 text-[0.6875rem] uppercase tracking-[0.2em] text-accent-quiet">
                        {tier.tagline}
                      </p>
                    )}
                  </div>

                  {tier.description && (
                    <p className="text-sm leading-relaxed text-ink-secondary">{tier.description}</p>
                  )}

                  <dl className="grid grid-cols-2 gap-4 border-y border-hairline-faint py-5 text-xs">
                    <div>
                      <dt className="text-ink-muted">Opens at</dt>
                      <dd className="tnum mt-1 text-ink-primary">
                        {tier.minSpend === 0 ? "First order" : formatPrice(tier.minSpend)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-muted">Early access</dt>
                      <dd className="tnum mt-1 text-ink-primary">{tier.earlyAccessHours} hours</dd>
                    </div>
                  </dl>

                  <ul className="flex-1 space-y-3">
                    {tier.benefits.map((benefit) => (
                      <li key={benefit} className="flex gap-3 text-sm leading-relaxed text-ink-secondary">
                        <Check className="mt-1 size-3.5 shrink-0 text-accent" strokeWidth={2} aria-hidden />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  {tier.discountPercent > 0 && (
                    <p className="tnum text-sm text-accent">
                      {tier.discountPercent}% on every order
                    </p>
                  )}
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section pt-0" aria-labelledby="apply-title">
        <div className="shell">
          <div className="glass-vitrine mx-auto max-w-2xl p-8 md:p-12">
            <h2 id="apply-title" className="display-m text-ink-primary">
              Request an invitation
            </h2>
            <p className="lede mt-4 text-sm">
              Tell us what you are looking for. Our client care team reads every note and replies
              within two working days.
            </p>
            <MembershipForm className="mt-8" />
          </div>
        </div>
      </section>
    </div>
  );
}
