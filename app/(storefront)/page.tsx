import type { Metadata } from "next";

import { FaqJsonLd } from "@/components/seo/json-ld";
import { BrandValues } from "@/components/storefront/brand-values";
import { CategoryRail } from "@/components/storefront/category-rail";
import { FaqSection } from "@/components/storefront/faq-section";
import { Hero } from "@/components/storefront/hero";
import { JournalTeaser } from "@/components/storefront/journal-teaser";
import { MembershipCta } from "@/components/storefront/membership-cta";
import { ProductGrid } from "@/components/storefront/product-grid";
import { SectionHeading } from "@/components/storefront/section-heading";
import { StoryBlock } from "@/components/storefront/story-block";
import { Testimonials } from "@/components/storefront/testimonials";
import { Separator } from "@/components/ui/separator";
import {
  getBestSellers,
  getCategoriesWithCounts,
  getFeaturedProducts,
  getNewArrivals,
} from "@/lib/queries/catalog";
import {
  getBanner,
  getBrandValues,
  getFaqs,
  getJournalPosts,
  getMembershipTiers,
  getStorySections,
  getTestimonials,
} from "@/lib/queries/content";
import { SITE } from "@/lib/utils/site";

// No `title` here on purpose. The root layout sets a title template of
// `%s — BRUNO`, so setting `BRUNO — Premium Apparel` here rendered
// `BRUNO — Premium Apparel — BRUNO`. Omitting it falls through to the layout's
// `title.default`, which is already exactly `BRUNO — Premium Apparel`.
export const metadata: Metadata = {
  description: SITE.description,
  alternates: { canonical: "/" },
};

// Content is CMS-driven and changes rarely. Revalidate hourly rather than on
// every request; the admin will call revalidatePath on publish in Phase 4.
export const revalidate = 3600;

export default async function HomePage() {
  const [
    heroBanner,
    membershipBanner,
    featured,
    newArrivals,
    bestSellers,
    categories,
    stories,
    values,
    testimonials,
    tiers,
    journal,
    faqs,
  ] = await Promise.all([
    getBanner("HOME_HERO"),
    getBanner("HOME_PROMO"),
    getFeaturedProducts(6),
    getNewArrivals(3),
    getBestSellers(3),
    getCategoriesWithCounts(),
    getStorySections(),
    getBrandValues(),
    getTestimonials(6),
    getMembershipTiers(),
    getJournalPosts(3),
    getFaqs(8),
  ]);

  const spotlight = featured[0] ?? bestSellers[0] ?? null;

  return (
    <>
      <Hero
        banner={heroBanner}
        spotlight={spotlight}
        stats={[
          { value: "60", label: "pieces per release" },
          { value: "11", label: "hours finishing a coat" },
          { value: "7", label: "partners, all visited" },
        ]}
      />

      <CategoryRail categories={categories} />

      <Separator className="shell" />

      <section className="section" aria-labelledby="featured-title">
        <div className="shell">
          <SectionHeading
            eyebrow="The vitrine"
            title="Featured this season"
            body="Six pieces chosen for what they are made of rather than what they cost."
            link={{ label: "See the full collection", href: "/collection" }}
          />
          <ProductGrid products={featured} columns={3} className="mt-14" priorityCount={3} />
        </div>
      </section>

      {stories[0] && <StoryBlock story={stories[0]} index={0} />}

      {newArrivals.length > 0 && (
        <section className="section" aria-labelledby="new-title">
          <div className="shell">
            <SectionHeading
              eyebrow="Just released"
              title="New arrivals"
              link={{ label: "All new pieces", href: "/collection?sort=newest" }}
            />
            <ProductGrid products={newArrivals} columns={3} className="mt-14" />
          </div>
        </section>
      )}

      <BrandValues values={values} />

      {stories[1] && <StoryBlock story={stories[1]} index={1} />}

      <MembershipCta banner={membershipBanner} tiers={tiers} />

      {bestSellers.length > 0 && (
        <section className="section" aria-labelledby="best-title">
          <div className="shell">
            <SectionHeading
              eyebrow="Most bought"
              title="Best sellers"
              link={{ label: "Sort by best selling", href: "/collection?sort=best-selling" }}
            />
            <ProductGrid products={bestSellers} columns={3} className="mt-14" />
          </div>
        </section>
      )}

      <Testimonials items={testimonials} />

      {stories[2] && <StoryBlock story={stories[2]} index={2} />}

      <JournalTeaser posts={journal} />

      <FaqSection faqs={faqs} />
      <FaqJsonLd faqs={faqs} />
    </>
  );
}
