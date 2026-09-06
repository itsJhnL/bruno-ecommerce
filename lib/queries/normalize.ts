import type { ProductCardRow } from "@/types/database";
import { EMPTY_CART } from "@/lib/cart/empty";

import type {
  CartLine,
  CartPricing,
  OrderAddress,
  ProductCard,
  ProductDetail,
  ProductVariant,
} from "@/types";

const PLACEHOLDER_IMAGE = "/images/editorial/placeholder.svg";

/** Supabase `product_cards` row → the shape components consume. */
export function toProductCard(row: ProductCardRow): ProductCard {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price === null ? null : Number(row.compare_at_price),
    currency: row.currency,
    badge: row.badge,
    isFeatured: row.is_featured,
    isNew: row.is_new,
    isLimited: row.is_limited,
    isMembersOnly: row.is_members_only,
    ratingAverage: Number(row.rating_average),
    ratingCount: row.rating_count,
    unitsSold: row.units_sold,
    tags: row.tags ?? [],
    imageUrl: row.image_url ?? PLACEHOLDER_IMAGE,
    imageAlt: row.image_alt ?? row.name,
    availableQuantity: row.available_quantity,
    isInStock: row.is_in_stock,
    categoryName: row.primary_category,
    categorySlug: row.primary_category_slug,
    createdAt: row.created_at,
  };
}

/** Fallback catalogue entry → ProductCard. Same output shape, different source. */
type FallbackProduct = (typeof import("@/lib/fallback-catalog"))["fallbackData"]["products"][number];

export function fallbackToProductCard(p: FallbackProduct): ProductCard {
  const images = (p.images ?? []) as readonly { url: string; alt: string }[];
  const variants = (p.variants ?? []) as readonly { stock: number }[];
  const available = variants.reduce((sum, v) => sum + Math.max(v.stock, 0), 0);
  const first = images[0];

  return {
    id: p.slug,
    slug: p.slug,
    name: p.name,
    subtitle: p.subtitle,
    price: Number(p.price),
    compareAtPrice: p.compare_at_price === null ? null : Number(p.compare_at_price),
    currency: p.currency,
    badge: p.badge,
    isFeatured: p.is_featured,
    isNew: p.is_new,
    isLimited: p.is_limited,
    isMembersOnly: p.is_members_only,
    ratingAverage: Number(p.rating_average),
    ratingCount: p.rating_count,
    unitsSold: p.units_sold,
    tags: p.tags ?? [],
    imageUrl: first?.url ?? PLACEHOLDER_IMAGE,
    imageAlt: first?.alt ?? p.name,
    availableQuantity: available,
    isInStock: available > 0,
    categoryName: p.category_name,
    categorySlug: p.category_slug,
    createdAt: null,
  };
}

export function fallbackToProductDetail(p: FallbackProduct): ProductDetail {
  const card = fallbackToProductCard(p);
  const rawVariants = (p.variants ?? []) as readonly {
    title: string;
    sku: string;
    options: Record<string, string>;
    stock: number;
  }[];

  const variants: ProductVariant[] = rawVariants.map((v) => ({
    id: v.sku,
    title: v.title,
    sku: v.sku,
    options: v.options,
    price: null,
    stock: v.stock,
    isAvailable: v.stock > 0,
  }));

  const reviews = ((p.reviews ?? []) as readonly {
    author: string;
    location: string | null;
    rating: number;
    title: string | null;
    body: string;
    verified: boolean;
    createdAt: string;
  }[]).map((r, i) => ({
    id: `${p.slug}-review-${i}`,
    author: r.author,
    location: r.location,
    rating: r.rating,
    title: r.title,
    body: r.body,
    isVerified: r.verified,
    createdAt: r.createdAt,
  }));

  return {
    ...card,
    description: p.description,
    story: p.story,
    sku: p.sku,
    materials: p.materials,
    careInstructions: p.care_instructions,
    origin: p.origin,
    specifications: (p.specifications ?? {}) as Record<string, string>,
    shippingInfo: p.shipping_info,
    returnsInfo: p.returns_info,
    seoTitle: p.seo_title,
    seoDescription: p.seo_description,
    images: ((p.images ?? []) as readonly { url: string; alt: string; width: number; height: number }[]).map((i) => ({
      url: i.url,
      alt: i.alt,
      width: i.width ?? 1000,
      height: i.height ?? 1250,
    })),
    options: ((p.options ?? []) as readonly { name: string; values: readonly string[] }[]).map((o) => ({
      name: o.name,
      values: o.values,
    })),
    variants,
    reviews,
    relatedSlugs: (p.related ?? []) as readonly string[],
  };
}

/* ---------------------------------------------------------------------------
   Commerce
   --------------------------------------------------------------------------- */

const num = (value: unknown, fallback = 0): number => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const str = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

export { EMPTY_CART };

/**
 * `price_cart()` returns jsonb. This is the one place that shape is trusted,
 * and every field is coerced rather than cast — a wrong assumption here would
 * put a NaN on a price tag.
 */
export function toCartPricing(payload: unknown): CartPricing {
  if (!payload || typeof payload !== "object") return EMPTY_CART;
  const raw = payload as Record<string, unknown>;
  if (raw.exists !== true) return EMPTY_CART;

  const rawLines = Array.isArray(raw.lines) ? raw.lines : [];

  const lines: CartLine[] = rawLines.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const l = entry as Record<string, unknown>;
    const itemId = str(l.item_id);
    const variantId = str(l.variant_id);
    const productId = str(l.product_id);
    if (!itemId || !variantId || !productId) return [];

    return [
      {
        itemId,
        variantId,
        productId,
        name: str(l.name) ?? "Item",
        slug: str(l.slug) ?? "",
        variantTitle: str(l.variant_title),
        sku: str(l.sku),
        imageUrl: str(l.image_url),
        imageAlt: str(l.image_alt),
        unitPrice: num(l.unit_price),
        compareAtPrice: l.compare_at_price == null ? null : num(l.compare_at_price),
        quantity: num(l.quantity, 1),
        lineTotal: num(l.line_total),
        available: num(l.available),
        isAvailable: l.is_available === true,
        inStock: l.in_stock === true,
      },
    ];
  });

  return {
    exists: true,
    cartId: str(raw.cart_id),
    currency: str(raw.currency) ?? "USD",
    lines,
    itemCount: num(raw.item_count),
    subtotal: num(raw.subtotal),
    compareTotal: num(raw.compare_total),
    savings: num(raw.savings),
    couponCode: str(raw.coupon_code),
    couponId: str(raw.coupon_id),
    couponValid: raw.coupon_valid === true,
    couponReason: str(raw.coupon_reason),
    discountTotal: num(raw.discount_total),
    freeShipping: raw.free_shipping === true,
    shippingMethodId: str(raw.shipping_method_id),
    shippingMethod: str(raw.shipping_method),
    shippingTotal: num(raw.shipping_total),
    taxRate: num(raw.tax_rate),
    taxTotal: num(raw.tax_total),
    grandTotal: num(raw.grand_total),
    hasUnavailable: raw.has_unavailable === true,
  };
}

/** Address JSON on an order is snapshotted, so it is read defensively too. */
export function toOrderAddress(payload: unknown): OrderAddress | null {
  if (!payload || typeof payload !== "object") return null;
  const a = payload as Record<string, unknown>;
  const line1 = str(a.line1);
  if (!line1) return null;

  return {
    firstName: str(a.first_name) ?? "",
    lastName: str(a.last_name) ?? "",
    company: str(a.company),
    line1,
    line2: str(a.line2),
    city: str(a.city) ?? "",
    region: str(a.region),
    postalCode: str(a.postal_code) ?? "",
    countryCode: str(a.country_code) ?? "",
    phone: str(a.phone),
  };
}
