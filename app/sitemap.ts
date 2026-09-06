import type { MetadataRoute } from "next";

import { getAllProductSlugs, getCategories } from "@/lib/queries/catalog";
import { getJournalPosts, getPages } from "@/lib/queries/content";
import { siteUrl } from "@/lib/utils/site";

/** Generated from live data (PRD FR-E2), not a hand-maintained list. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, posts, pages] = await Promise.all([
    getAllProductSlugs(),
    getCategories(),
    getJournalPosts(200),
    getPages(),
  ]);

  const now = new Date();

  return [
    { url: siteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: siteUrl("/collection"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: siteUrl("/membership"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: siteUrl("/journal"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    ...categories.map((category) => ({
      url: siteUrl(`/category/${category.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((slug) => ({
      url: siteUrl(`/product/${slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    ...posts.map((post) => ({
      url: siteUrl(`/journal/${post.slug}`),
      lastModified: post.publishedAt ? new Date(post.publishedAt) : now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...pages.map((page) => ({
      url: siteUrl(`/${page.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
