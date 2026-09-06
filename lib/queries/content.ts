import "server-only";

import { fallbackData } from "@/lib/fallback-catalog";
import { createAnonClient } from "@/lib/supabase/server";
import type {
  Banner,
  BrandValue,
  Faq,
  JournalPost,
  MembershipTier,
  NavItem,
  StorySection,
  Testimonial,
} from "@/types";

/**
 * Every content read follows the same shape: try Supabase, and if it is not
 * configured, errors, or returns nothing, use the curated static content
 * (Memory.md D-011). `withFallback` keeps that from being written eleven times.
 */
async function withFallback<T>(
  fetcher: (
    supabase: NonNullable<ReturnType<typeof createAnonClient>>
  ) => Promise<T[] | null | undefined>,
  fallback: () => T[]
): Promise<T[]> {
  const supabase = createAnonClient();
  if (supabase) {
    try {
      const result = await fetcher(supabase);
      if (result && result.length > 0) return result;
    } catch {
      // fall through
    }
  }
  return fallback();
}

export function getBanners(placement: Banner["placement"]): Promise<Banner[]> {
  return withFallback<Banner>(
    async (supabase) => {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("placement", placement)
        .eq("is_active", true)
        .order("position");
      return (data ?? []).map((b) => ({
        placement: b.placement,
        eyebrow: b.eyebrow,
        title: b.title,
        subtitle: b.subtitle,
        body: b.body,
        ctaLabel: b.cta_label,
        ctaHref: b.cta_href,
        secondaryCtaLabel: b.secondary_cta_label,
        secondaryCtaHref: b.secondary_cta_href,
        imageUrl: b.image_url,
        imageAlt: b.image_alt,
      }));
    },
    () =>
      fallbackData.banners
        .filter((b) => b.placement === placement)
        .map((b) => ({
          placement: b.placement,
          eyebrow: b.eyebrow,
          title: b.title,
          subtitle: b.subtitle,
          body: b.body,
          ctaLabel: b.cta_label,
          ctaHref: b.cta_href,
          secondaryCtaLabel: b.secondary_cta_label,
          secondaryCtaHref: b.secondary_cta_href,
          imageUrl: b.image_url,
          imageAlt: b.image_alt,
        }))
  );
}

export async function getBanner(placement: Banner["placement"]): Promise<Banner | null> {
  const [first] = await getBanners(placement);
  return first ?? null;
}

export function getTestimonials(limit = 6): Promise<Testimonial[]> {
  return withFallback<Testimonial>(
    async (supabase) => {
      const { data } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_active", true)
        .order("position")
        .limit(limit);
      return (data ?? []).map((t) => ({
        author: t.author_name,
        title: t.author_title,
        location: t.author_location,
        quote: t.quote,
        rating: t.rating,
        isFeatured: t.is_featured,
      }));
    },
    () =>
      fallbackData.testimonials.slice(0, limit).map((t) => ({
        author: t.author_name,
        title: t.author_title,
        location: t.author_location,
        quote: t.quote,
        rating: t.rating,
        isFeatured: t.is_featured,
      }))
  );
}

export function getFaqs(limit = 20): Promise<Faq[]> {
  return withFallback<Faq>(
    async (supabase) => {
      const { data } = await supabase
        .from("faqs")
        .select("*")
        .eq("is_active", true)
        .is("product_id", null)
        .order("position")
        .limit(limit);
      return (data ?? []).map((f) => ({ question: f.question, answer: f.answer, category: f.category }));
    },
    () =>
      fallbackData.faqs
        .slice(0, limit)
        .map((f) => ({ question: f.question, answer: f.answer, category: f.category }))
  );
}

export function getBrandValues(): Promise<BrandValue[]> {
  return withFallback<BrandValue>(
    async (supabase) => {
      const { data } = await supabase
        .from("brand_values")
        .select("*")
        .eq("is_active", true)
        .order("position");
      return (data ?? []).map((b) => ({
        title: b.title,
        description: b.description,
        icon: b.icon,
        detail: b.detail,
      }));
    },
    () =>
      fallbackData.brandValues.map((b) => ({
        title: b.title,
        description: b.description,
        icon: b.icon,
        detail: b.detail,
      }))
  );
}

export function getStorySections(): Promise<StorySection[]> {
  return withFallback<StorySection>(
    async (supabase) => {
      const { data } = await supabase
        .from("story_sections")
        .select("*")
        .eq("is_active", true)
        .order("position");
      return (data ?? []).map(mapStory);
    },
    () => fallbackData.stories.map(mapStory)
  );
}

type StoryLike = {
  key: string;
  eyebrow: string | null;
  title: string;
  body: string;
  quote: string | null;
  image_url: string | null;
  image_alt: string | null;
  stat_value: string | null;
  stat_label: string | null;
  cta_label: string | null;
  cta_href: string | null;
};

function mapStory(s: StoryLike): StorySection {
  return {
    key: s.key,
    eyebrow: s.eyebrow,
    title: s.title,
    body: s.body,
    quote: s.quote,
    imageUrl: s.image_url,
    imageAlt: s.image_alt,
    statValue: s.stat_value,
    statLabel: s.stat_label,
    ctaLabel: s.cta_label,
    ctaHref: s.cta_href,
  };
}

export function getNavigation(menu: string): Promise<NavItem[]> {
  return withFallback<NavItem>(
    async (supabase) => {
      const { data } = await supabase
        .from("navigation_items")
        .select("label, href, position")
        .eq("menu", menu)
        .eq("is_active", true)
        .order("position");
      return (data ?? []).map((n) => ({ label: n.label, href: n.href }));
    },
    () =>
      fallbackData.navigation
        .filter((n) => n.menu === menu)
        .map((n) => ({ label: n.label, href: n.href }))
  );
}

export function getMembershipTiers(): Promise<MembershipTier[]> {
  return withFallback<MembershipTier>(
    async (supabase) => {
      const { data } = await supabase
        .from("membership_tiers")
        .select("*")
        .eq("is_active", true)
        .order("position");
      return (data ?? []).map((m) => ({
        name: m.name,
        slug: m.slug,
        tagline: m.tagline,
        description: m.description,
        benefits: m.benefits,
        minSpend: Number(m.min_spend),
        discountPercent: Number(m.discount_percent),
        earlyAccessHours: m.early_access_hours,
      }));
    },
    () =>
      fallbackData.membershipTiers.map((m) => ({
        name: m.name,
        slug: m.slug,
        tagline: m.tagline,
        description: m.description,
        benefits: m.benefits,
        minSpend: Number(m.min_spend),
        discountPercent: Number(m.discount_percent),
        earlyAccessHours: m.early_access_hours,
      }))
  );
}

export function getJournalPosts(limit = 12): Promise<JournalPost[]> {
  return withFallback<JournalPost>(
    async (supabase) => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "PUBLISHED")
        .order("published_at", { ascending: false })
        .limit(limit);
      return (data ?? []).map((p) => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        content: p.content,
        imageUrl: p.featured_image_url,
        imageAlt: p.featured_image_alt,
        author: p.author_name,
        tags: p.tags,
        readingMinutes: p.reading_minutes,
        publishedAt: p.published_at,
        seoTitle: p.seo_title,
        seoDescription: p.seo_description,
      }));
    },
    () =>
      fallbackData.journal.slice(0, limit).map((p) => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        content: p.content,
        imageUrl: p.featured_image_url,
        imageAlt: p.featured_image_alt,
        author: p.author_name,
        tags: p.tags,
        readingMinutes: p.reading_minutes,
        publishedAt: p.published_at,
        seoTitle: p.seo_title,
        seoDescription: p.seo_description,
      }))
  );
}

export async function getJournalPost(slug: string): Promise<JournalPost | null> {
  const posts = await getJournalPosts(50);
  return posts.find((p) => p.slug === slug) ?? null;
}

/* -------------------------------------------------------------------------- */
/* CMS pages                                                                   */
/* -------------------------------------------------------------------------- */

export interface CmsPage {
  slug: string;
  title: string;
  subtitle: string | null;
  content: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

export function getPages(): Promise<CmsPage[]> {
  return withFallback<CmsPage>(
    async (supabase) => {
      const { data } = await supabase
        .from("pages")
        .select("slug, title, subtitle, content, seo_title, seo_description, status, published_at")
        .eq("status", "PUBLISHED");
      return (data ?? []).map((p) => ({
        slug: p.slug,
        title: p.title,
        subtitle: p.subtitle,
        content: p.content,
        seoTitle: p.seo_title,
        seoDescription: p.seo_description,
      }));
    },
    () =>
      fallbackData.pages.map((p) => ({
        slug: p.slug,
        title: p.title,
        subtitle: p.subtitle,
        content: p.content,
        seoTitle: p.seo_title,
        seoDescription: p.seo_description,
      }))
  );
}

export async function getPage(slug: string): Promise<CmsPage | null> {
  const pages = await getPages();
  return pages.find((p) => p.slug === slug) ?? null;
}
