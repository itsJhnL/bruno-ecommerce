import type { BannerPlacement } from "./database";

/** Application-level types. These are what components consume — never raw rows. */

export interface ProductCard {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  badge: string | null;
  isFeatured: boolean;
  isNew: boolean;
  isLimited: boolean;
  isMembersOnly: boolean;
  ratingAverage: number;
  ratingCount: number;
  unitsSold: number;
  tags: readonly string[];
  imageUrl: string;
  imageAlt: string;
  availableQuantity: number;
  isInStock: boolean;
  categoryName: string | null;
  categorySlug: string | null;
  createdAt: string | null;
}

export interface ProductImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku: string;
  options: Record<string, string>;
  price: number | null;
  stock: number;
  isAvailable: boolean;
}

export interface ProductOption {
  name: string;
  values: readonly string[];
}

export interface Review {
  id: string;
  author: string;
  location: string | null;
  rating: number;
  title: string | null;
  body: string;
  isVerified: boolean;
  createdAt: string;
}

export interface ProductDetail extends ProductCard {
  description: string | null;
  story: string | null;
  sku: string | null;
  materials: string | null;
  careInstructions: string | null;
  origin: string | null;
  specifications: Record<string, string>;
  shippingInfo: string | null;
  returnsInfo: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  images: readonly ProductImage[];
  options: readonly ProductOption[];
  variants: readonly ProductVariant[];
  reviews: readonly Review[];
  relatedSlugs: readonly string[];
}

export interface Category {
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  isFeatured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  productCount?: number;
}

export interface Testimonial {
  author: string;
  title: string | null;
  location: string | null;
  quote: string;
  rating: number | null;
  isFeatured: boolean;
}

export interface Faq {
  question: string;
  answer: string;
  category: string;
}

export interface BrandValue {
  title: string;
  description: string;
  icon: string | null;
  detail: string | null;
}

export interface StorySection {
  key: string;
  eyebrow: string | null;
  title: string;
  body: string;
  quote: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  statValue: string | null;
  statLabel: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
}

export interface Banner {
  placement: BannerPlacement;
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaHref: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface MembershipTier {
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  benefits: readonly string[];
  minSpend: number;
  discountPercent: number;
  earlyAccessHours: number;
}

export interface JournalPost {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  author: string | null;
  tags: readonly string[];
  readingMinutes: number | null;
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

export type SortKey =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "newest"
  | "best-selling"
  | "rating";

export interface CatalogFilters {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colours?: string[];
  inStock?: boolean;
  sort?: SortKey;
  page?: number;
  perPage?: number;
}

export interface CatalogResult {
  products: ProductCard[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  facets: {
    categories: { slug: string; name: string; count: number }[];
    sizes: { value: string; count: number }[];
    colours: { value: string; count: number }[];
    priceRange: { min: number; max: number };
  };
}

/* ---------------------------------------------------------------------------
   Commerce (Phase 2)
   --------------------------------------------------------------------------- */

/**
 * The shape every mutation returns. A Server Action never throws at the caller;
 * it reports. `field` lets a form highlight the input that was wrong.
 */
export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: string };

export interface CartLine {
  itemId: string;
  variantId: string;
  productId: string;
  name: string;
  slug: string;
  variantTitle: string | null;
  sku: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  lineTotal: number;
  available: number;
  isAvailable: boolean;
  inStock: boolean;
}

/**
 * Computed by `price_cart()` in Postgres, never in the browser and never here.
 * Agents.md rule 3 — the client does not decide money.
 */
export interface CartPricing {
  exists: boolean;
  cartId: string | null;
  currency: string;
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  compareTotal: number;
  savings: number;
  couponCode: string | null;
  couponId: string | null;
  couponValid: boolean;
  couponReason: string | null;
  discountTotal: number;
  freeShipping: boolean;
  shippingMethodId: string | null;
  shippingMethod: string | null;
  shippingTotal: number;
  taxRate: number;
  taxTotal: number;
  grandTotal: number;
  hasUnavailable: boolean;
}

export interface ShippingOption {
  id: string;
  name: string;
  description: string | null;
  price: number;
  freeOver: number | null;
  minDays: number | null;
  maxDays: number | null;
}

export interface OrderAddress {
  firstName: string;
  lastName: string;
  company: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string;
  countryCode: string;
  phone: string | null;
}

export interface OrderLine {
  id: string;
  name: string;
  variantTitle: string | null;
  sku: string | null;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  email: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  currency: string;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
  couponCode: string | null;
  shippingMethod: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  carrier: string | null;
  placedAt: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  shippingAddress: OrderAddress | null;
  billingAddress: OrderAddress | null;
  customerNote: string | null;
  lines: OrderLine[];
}
