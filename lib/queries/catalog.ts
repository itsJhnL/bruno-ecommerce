import "server-only";

import { fallbackData } from "@/lib/fallback-catalog";
import { createAnonClient } from "@/lib/supabase/server";
import type {
  CatalogFilters,
  CatalogResult,
  Category,
  ProductCard,
  ProductDetail,
  SortKey,
} from "@/types";
import type { ProductCardRow } from "@/types/database";

import {
  fallbackToProductCard,
  fallbackToProductDetail,
  toProductCard,
} from "./normalize";

/**
 * Reads run as `anon`, without the request's cookies.
 *
 * Everything here is public catalogue content, protected by RLS exactly as a
 * logged-out visitor sees it — so there is no session to honour. It matters
 * because touching `cookies()` opts a route into dynamic rendering: using the
 * session client here silently turned the landing page from static into
 * server-rendered-on-demand the moment Supabase was configured (Memory.md D-027).
 */

const DEFAULT_PER_PAGE = 12;

const SORT_COLUMNS: Record<SortKey, { column: string; ascending: boolean }> = {
  featured: { column: "units_sold", ascending: false },
  "price-asc": { column: "price", ascending: true },
  "price-desc": { column: "price", ascending: false },
  newest: { column: "published_at", ascending: false },
  "best-selling": { column: "units_sold", ascending: false },
  rating: { column: "rating_average", ascending: false },
};

/* -------------------------------------------------------------------------- */
/* Fallback catalogue, computed once                                          */
/* -------------------------------------------------------------------------- */

const fallbackCards: ProductCard[] = fallbackData.products.map(fallbackToProductCard);

const fallbackVariantOptions = new Map<string, { sizes: Set<string>; colours: Set<string> }>(
  fallbackData.products.map((p) => {
    const sizes = new Set<string>();
    const colours = new Set<string>();
    for (const v of (p.variants ?? []) as readonly { options: Record<string, string> }[]) {
      if (v.options["Size"]) sizes.add(v.options["Size"]);
      if (v.options["Colour"]) colours.add(v.options["Colour"]);
    }
    return [p.slug, { sizes, colours }];
  })
);

/* -------------------------------------------------------------------------- */
/* Catalogue                                                                   */
/* -------------------------------------------------------------------------- */

export async function getProducts(filters: CatalogFilters = {}): Promise<CatalogResult> {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = filters.perPage ?? DEFAULT_PER_PAGE;
  const sort: SortKey = filters.sort ?? "featured";

  const supabase = createAnonClient();
  if (supabase) {
    try {
      return await queryProductsFromDb(supabase, filters, page, perPage, sort);
    } catch {
      // Fall through to the static catalogue rather than 500 the storefront.
    }
  }

  return filterFallbackProducts(filters, page, perPage, sort);
}

async function queryProductsFromDb(
  supabase: NonNullable<ReturnType<typeof createAnonClient>>,
  filters: CatalogFilters,
  page: number,
  perPage: number,
  sort: SortKey
): Promise<CatalogResult> {
  // Size / colour filters live on variants, so resolve them to product ids first.
  let variantProductIds: string[] | null = null;
  const attributeFilters = [
    ...(filters.sizes ?? []).map((v) => ({ key: "Size", value: v })),
    ...(filters.colours ?? []).map((v) => ({ key: "Colour", value: v })),
  ];

  if (attributeFilters.length > 0) {
    const orClause = attributeFilters
      .map((f) => `option_values->>${f.key}.eq.${f.value}`)
      .join(",");
    const { data: variantRows } = await supabase
      .from("product_variants")
      .select("product_id")
      .eq("is_active", true)
      .gt("stock_quantity", 0)
      .or(orClause);
    variantProductIds = [...new Set((variantRows ?? []).map((r) => r.product_id))];
    if (variantProductIds.length === 0) {
      return emptyResult(page, perPage);
    }
  }

  let query = supabase.from("product_cards").select("*", { count: "exact" });

  if (filters.q) query = query.textSearch("search_vector", filters.q, { type: "websearch" });
  if (filters.category) query = query.eq("primary_category_slug", filters.category);
  if (filters.minPrice !== undefined) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte("price", filters.maxPrice);
  if (filters.inStock) query = query.eq("is_in_stock", true);
  if (variantProductIds) query = query.in("id", variantProductIds);

  const order = SORT_COLUMNS[sort];
  query = query
    .order(order.column, { ascending: order.ascending, nullsFirst: false })
    .range((page - 1) * perPage, page * perPage - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  const products = (data as ProductCardRow[]).map(toProductCard);
  const total = count ?? products.length;

  return {
    products,
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
    facets: await getFacetsFromDb(supabase),
  };
}

async function getFacetsFromDb(
  supabase: NonNullable<ReturnType<typeof createAnonClient>>
): Promise<CatalogResult["facets"]> {
  const [{ data: cards }, { data: variants }] = await Promise.all([
    supabase.from("product_cards").select("price, primary_category, primary_category_slug"),
    supabase.from("product_variants").select("option_values").eq("is_active", true),
  ]);

  const categoryCounts = new Map<string, { slug: string; name: string; count: number }>();
  let min = Number.POSITIVE_INFINITY;
  let max = 0;

  for (const row of cards ?? []) {
    const price = Number(row.price);
    if (price < min) min = price;
    if (price > max) max = price;
    if (row.primary_category_slug && row.primary_category) {
      const existing = categoryCounts.get(row.primary_category_slug);
      if (existing) existing.count += 1;
      else
        categoryCounts.set(row.primary_category_slug, {
          slug: row.primary_category_slug,
          name: row.primary_category,
          count: 1,
        });
    }
  }

  const sizeCounts = new Map<string, number>();
  const colourCounts = new Map<string, number>();
  for (const v of variants ?? []) {
    const opts = v.option_values as Record<string, string>;
    if (opts["Size"]) sizeCounts.set(opts["Size"], (sizeCounts.get(opts["Size"]) ?? 0) + 1);
    if (opts["Colour"]) colourCounts.set(opts["Colour"], (colourCounts.get(opts["Colour"]) ?? 0) + 1);
  }

  return {
    categories: [...categoryCounts.values()].sort((a, b) => a.name.localeCompare(b.name)),
    sizes: [...sizeCounts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => compareSizes(a.value, b.value)),
    colours: [...colourCounts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value)),
    priceRange: {
      min: Number.isFinite(min) ? Math.floor(min) : 0,
      max: Math.ceil(max) || 2500,
    },
  };
}

function filterFallbackProducts(
  filters: CatalogFilters,
  page: number,
  perPage: number,
  sort: SortKey
): CatalogResult {
  let results = [...fallbackCards];

  if (filters.q) {
    const needle = filters.q.toLowerCase();
    results = results.filter((p) => {
      const haystack = [p.name, p.subtitle ?? "", p.categoryName ?? "", ...p.tags]
        .join(" ")
        .toLowerCase();
      return needle.split(/\s+/).every((word) => haystack.includes(word));
    });
  }

  if (filters.category) results = results.filter((p) => p.categorySlug === filters.category);
  if (filters.minPrice !== undefined) results = results.filter((p) => p.price >= filters.minPrice!);
  if (filters.maxPrice !== undefined) results = results.filter((p) => p.price <= filters.maxPrice!);
  if (filters.inStock) results = results.filter((p) => p.isInStock);

  if (filters.sizes?.length) {
    results = results.filter((p) =>
      filters.sizes!.some((s) => fallbackVariantOptions.get(p.slug)?.sizes.has(s))
    );
  }
  if (filters.colours?.length) {
    results = results.filter((p) =>
      filters.colours!.some((c) => fallbackVariantOptions.get(p.slug)?.colours.has(c))
    );
  }

  results.sort((a, b) => {
    switch (sort) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "rating":
        return b.ratingAverage - a.ratingAverage;
      case "newest":
        return Number(b.isNew) - Number(a.isNew) || b.unitsSold - a.unitsSold;
      case "best-selling":
      case "featured":
      default:
        return Number(b.isFeatured) - Number(a.isFeatured) || b.unitsSold - a.unitsSold;
    }
  });

  const total = results.length;
  const start = (page - 1) * perPage;

  return {
    products: results.slice(start, start + perPage),
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
    facets: fallbackFacets(),
  };
}

function fallbackFacets(): CatalogResult["facets"] {
  const categoryCounts = new Map<string, { slug: string; name: string; count: number }>();
  const sizeCounts = new Map<string, number>();
  const colourCounts = new Map<string, number>();
  let min = Number.POSITIVE_INFINITY;
  let max = 0;

  for (const p of fallbackCards) {
    if (p.price < min) min = p.price;
    if (p.price > max) max = p.price;
    if (p.categorySlug && p.categoryName) {
      const existing = categoryCounts.get(p.categorySlug);
      if (existing) existing.count += 1;
      else categoryCounts.set(p.categorySlug, { slug: p.categorySlug, name: p.categoryName, count: 1 });
    }
    const opts = fallbackVariantOptions.get(p.slug);
    for (const s of opts?.sizes ?? []) sizeCounts.set(s, (sizeCounts.get(s) ?? 0) + 1);
    for (const c of opts?.colours ?? []) colourCounts.set(c, (colourCounts.get(c) ?? 0) + 1);
  }

  return {
    categories: [...categoryCounts.values()].sort((a, b) => a.name.localeCompare(b.name)),
    sizes: [...sizeCounts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => compareSizes(a.value, b.value)),
    colours: [...colourCounts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value)),
    priceRange: { min: Number.isFinite(min) ? Math.floor(min) : 0, max: Math.ceil(max) },
  };
}

/** S < M < L < XL, and numeric sizes numerically. Alphabetical would be wrong. */
const LETTER_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "One Size"];
function compareSizes(a: string, b: string): number {
  const ai = LETTER_ORDER.indexOf(a);
  const bi = LETTER_ORDER.indexOf(b);
  if (ai !== -1 && bi !== -1) return ai - bi;
  if (ai !== -1) return -1;
  if (bi !== -1) return 1;
  const an = Number(a);
  const bn = Number(b);
  if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
  return a.localeCompare(b);
}

function emptyResult(page: number, perPage: number): CatalogResult {
  return {
    products: [],
    total: 0,
    page,
    perPage,
    pageCount: 1,
    facets: fallbackFacets(),
  };
}

/* -------------------------------------------------------------------------- */
/* Single product                                                              */
/* -------------------------------------------------------------------------- */

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const supabase = createAnonClient();

  if (supabase) {
    try {
      const { data: product, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("status", "ACTIVE")
        .single();

      if (error || !product) throw error ?? new Error("not found");

      const [{ data: images }, { data: variants }, { data: options }, { data: reviews }, { data: card }] =
        await Promise.all([
          supabase.from("product_images").select("*").eq("product_id", product.id).order("position"),
          supabase
            .from("product_variants")
            .select("*")
            .eq("product_id", product.id)
            .eq("is_active", true)
            .order("position"),
          supabase.from("product_options").select("*").eq("product_id", product.id).order("position"),
          supabase
            .from("reviews")
            .select("*")
            .eq("product_id", product.id)
            .eq("status", "APPROVED")
            .order("created_at", { ascending: false })
            .limit(20),
          supabase.from("product_cards").select("*").eq("id", product.id).single(),
        ]);

      const base = card ? toProductCard(card as ProductCardRow) : null;
      if (!base) throw new Error("card missing");

      return {
        ...base,
        description: product.description,
        story: product.story,
        sku: product.sku,
        materials: product.materials,
        careInstructions: product.care_instructions,
        origin: product.origin,
        specifications: (product.specifications ?? {}) as Record<string, string>,
        shippingInfo: product.shipping_info,
        returnsInfo: product.returns_info,
        seoTitle: product.seo_title,
        seoDescription: product.seo_description,
        images: (images ?? []).map((i) => ({
          url: i.url,
          alt: i.alt,
          width: i.width ?? 1000,
          height: i.height ?? 1250,
        })),
        options: (options ?? []).map((o) => ({ name: o.name, values: o.values })),
        variants: (variants ?? []).map((v) => ({
          id: v.id,
          title: v.title,
          sku: v.sku,
          options: v.option_values as Record<string, string>,
          price: v.price === null ? null : Number(v.price),
          stock: Math.max(v.stock_quantity - v.reserved_quantity, 0),
          isAvailable: v.stock_quantity - v.reserved_quantity > 0,
        })),
        reviews: (reviews ?? []).map((r) => ({
          id: r.id,
          author: r.author_name,
          location: r.author_location,
          rating: r.rating,
          title: r.title,
          body: r.body,
          isVerified: r.is_verified_purchase,
          createdAt: r.created_at,
        })),
        relatedSlugs: [],
      };
    } catch {
      // fall through
    }
  }

  const match = fallbackData.products.find((p) => p.slug === slug);
  return match ? fallbackToProductDetail(match) : null;
}

export async function getRelatedProducts(slug: string, limit = 4): Promise<ProductCard[]> {
  const detail = await getProductBySlug(slug);
  if (!detail) return [];

  const supabase = createAnonClient();
  if (supabase) {
    try {
      const { data } = await supabase.rpc("related_products", {
        p_product_id: detail.id,
        p_limit: limit,
      });
      if (data && data.length > 0) return (data as ProductCardRow[]).map(toProductCard);
    } catch {
      // fall through
    }
  }

  const explicit = detail.relatedSlugs
    .map((s) => fallbackCards.find((p) => p.slug === s))
    .filter((p): p is ProductCard => Boolean(p));

  const sameCategory = fallbackCards
    .filter(
      (p) =>
        p.slug !== slug &&
        p.categorySlug === detail.categorySlug &&
        !explicit.some((e) => e.slug === p.slug)
    )
    .sort((a, b) => b.unitsSold - a.unitsSold);

  return [...explicit, ...sameCategory].slice(0, limit);
}

/* -------------------------------------------------------------------------- */
/* Curated lists                                                               */
/* -------------------------------------------------------------------------- */

async function curated(
  predicate: (p: ProductCard) => boolean,
  compare: (a: ProductCard, b: ProductCard) => number,
  limit: number,
  dbFilter?: (q: ReturnType<NonNullable<ReturnType<typeof createAnonClient>>["from"]>) => unknown
): Promise<ProductCard[]> {
  void dbFilter;
  const { products } = await getProducts({ perPage: 60, sort: "featured" });
  const pool = products.length > 0 ? products : fallbackCards;
  return pool.filter(predicate).sort(compare).slice(0, limit);
}

export function getFeaturedProducts(limit = 4): Promise<ProductCard[]> {
  return curated((p) => p.isFeatured, (a, b) => b.unitsSold - a.unitsSold, limit);
}

export function getNewArrivals(limit = 4): Promise<ProductCard[]> {
  return curated((p) => p.isNew, (a, b) => b.unitsSold - a.unitsSold, limit);
}

export function getBestSellers(limit = 4): Promise<ProductCard[]> {
  return curated(() => true, (a, b) => b.unitsSold - a.unitsSold, limit);
}

export async function getAllProductSlugs(): Promise<string[]> {
  const supabase = createAnonClient();
  if (supabase) {
    try {
      const { data } = await supabase.from("products").select("slug").eq("status", "ACTIVE");
      if (data?.length) return data.map((r) => r.slug);
    } catch {
      // fall through
    }
  }
  return fallbackData.products.map((p) => p.slug);
}

/* -------------------------------------------------------------------------- */
/* Categories                                                                  */
/* -------------------------------------------------------------------------- */

export async function getCategories(): Promise<Category[]> {
  const supabase = createAnonClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("position");
      if (data?.length) {
        return data.map((c) => ({
          slug: c.slug,
          name: c.name,
          description: c.description,
          imageUrl: c.image_url,
          imageAlt: c.image_alt,
          isFeatured: c.is_featured,
          seoTitle: c.seo_title,
          seoDescription: c.seo_description,
        }));
      }
    } catch {
      // fall through
    }
  }

  return fallbackData.categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.description,
    imageUrl: c.image_url,
    imageAlt: c.image_alt,
    isFeatured: c.is_featured,
    seoTitle: c.seo_title,
    seoDescription: c.seo_description,
  }));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const all = await getCategories();
  return all.find((c) => c.slug === slug) ?? null;
}

export async function getCategoriesWithCounts(): Promise<Category[]> {
  const [categories, { facets }] = await Promise.all([getCategories(), getProducts({ perPage: 1 })]);
  return categories.map((c) => ({
    ...c,
    productCount: facets.categories.find((f) => f.slug === c.slug)?.count ?? 0,
  }));
}
