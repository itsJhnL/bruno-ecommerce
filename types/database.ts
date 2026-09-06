/**
 * Supabase schema types.
 *
 * This file is normally GENERATED. After any migration, regenerate it:
 *
 *   npx supabase gen types typescript --project-id <id> --schema public > types/database.ts
 *
 * Until you have a project, this hand-written subset covers every table and
 * view the Phase 1 storefront reads. It is deliberately narrower than the full
 * schema — regenerating will widen it. Do not hand-edit after generating.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "EDITOR" | "CUSTOMER";
export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type ContentStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
export type ReviewStatus = "PENDING" | "APPROVED" | "HIDDEN" | "REJECTED";
export type BannerPlacement =
  | "HOME_HERO"
  | "HOME_PROMO"
  | "CATALOG_TOP"
  | "ANNOUNCEMENT_BAR"
  | "FOOTER";

export type AccountStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type FulfillmentStatus =
  | "UNFULFILLED"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED"
  | "RETURNED";

export type PaymentStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
export type DiscountScope = "ORDER" | "PRODUCT" | "CATEGORY";
export type AddressType = "SHIPPING" | "BILLING";
export type InventoryReason =
  | "INITIAL"
  | "RESTOCK"
  | "SALE"
  | "RETURN"
  | "DAMAGE"
  | "CORRECTION"
  | "RESERVATION"
  | "RELEASE";

/**
 * NOTE: every row shape here is a `type`, not an `interface`, on purpose.
 * Interfaces have no implicit index signature, so they are not assignable to
 * PostgREST's `Record<string, unknown>` constraint — and when that constraint
 * fails, every query silently resolves to `never` instead of erroring.
 */
export type ProductCardRow = {
  id: string;
  name: string;
  slug: string;
  subtitle: string | null;
  price: number;
  compare_at_price: number | null;
  currency: string;
  badge: string | null;
  is_featured: boolean;
  is_new: boolean;
  is_limited: boolean;
  is_members_only: boolean;
  rating_average: number;
  rating_count: number;
  units_sold: number;
  tags: string[];
  published_at: string | null;
  created_at: string;
  image_url: string | null;
  image_alt: string | null;
  blur_data: string | null;
  available_quantity: number;
  is_in_stock: boolean;
  primary_category: string | null;
  primary_category_slug: string | null;
}

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  story: string | null;
  sku: string | null;
  status: ProductStatus;
  price: number;
  compare_at_price: number | null;
  currency: string;
  is_featured: boolean;
  is_new: boolean;
  is_limited: boolean;
  is_members_only: boolean;
  materials: string | null;
  care_instructions: string | null;
  origin: string | null;
  specifications: Record<string, string>;
  shipping_info: string | null;
  returns_info: string | null;
  tags: string[];
  badge: string | null;
  rating_average: number;
  rating_count: number;
  units_sold: number;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  og_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export type ProductImageRow = {
  id: string;
  product_id: string;
  variant_id: string | null;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  blur_data: string | null;
  position: number;
  is_primary: boolean;
}

export type ProductVariantRow = {
  id: string;
  product_id: string;
  title: string;
  sku: string;
  option_values: Record<string, string>;
  price: number | null;
  compare_at_price: number | null;
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  allow_backorder: boolean;
  image_url: string | null;
  position: number;
  is_active: boolean;
}

export type ProductOptionRow = {
  id: string;
  product_id: string;
  name: string;
  position: number;
  values: string[];
}

export type CategoryRow = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  image_alt: string | null;
  position: number;
  is_active: boolean;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  og_image_url: string | null;
}

export type ReviewRow = {
  id: string;
  product_id: string;
  profile_id: string | null;
  order_id: string | null;
  author_name: string;
  author_location: string | null;
  rating: number;
  title: string | null;
  body: string;
  status: ReviewStatus;
  is_verified_purchase: boolean;
  is_featured: boolean;
  helpful_count: number;
  admin_response: string | null;
  created_at: string;
}

export type FaqRow = {
  id: string;
  question: string;
  answer: string;
  category: string;
  product_id: string | null;
  position: number;
  is_active: boolean;
}

export type TestimonialRow = {
  id: string;
  author_name: string;
  author_title: string | null;
  author_location: string | null;
  avatar_url: string | null;
  quote: string;
  rating: number | null;
  position: number;
  is_featured: boolean;
  is_active: boolean;
}

export type BannerRow = {
  id: string;
  placement: BannerPlacement;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  eyebrow: string | null;
  image_url: string | null;
  image_alt: string | null;
  cta_label: string | null;
  cta_href: string | null;
  secondary_cta_label: string | null;
  secondary_cta_href: string | null;
  theme: string;
  position: number;
  is_active: boolean;
}

export type BrandValueRow = {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  detail: string | null;
  position: number;
  is_active: boolean;
}

export type StorySectionRow = {
  id: string;
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
  position: number;
  is_active: boolean;
}

export type NavigationItemRow = {
  id: string;
  menu: string;
  parent_id: string | null;
  label: string;
  href: string;
  position: number;
  is_active: boolean;
  opens_new_tab: boolean;
}

export type MembershipTierRow = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  benefits: string[];
  min_spend: number;
  discount_percent: number;
  early_access_hours: number;
  position: number;
  is_active: boolean;
}

export type CollectionRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  position: number;
  seo_title: string | null;
  seo_description: string | null;
}

export type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  category_id: string | null;
  author_name: string | null;
  tags: string[];
  status: ContentStatus;
  reading_minutes: number | null;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

export type PageRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  content: string | null;
  status: ContentStatus;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  og_image_url: string | null;
}

export type SiteSettingRow = {
  key: string;
  value: Json;
  group_name: string;
  is_public: boolean;
}

/* -------------------------------------------------------------------------
   Commerce (Phase 2)
   ------------------------------------------------------------------------- */

export type CartRow = {
  id: string;
  profile_id: string | null;
  session_token: string | null;
  currency: string;
  coupon_id: string | null;
  note: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

export type CartItemRow = {
  id: string;
  cart_id: string;
  variant_id: string;
  quantity: number;
  added_at: string;
};

export type ShippingMethodRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  free_over: number | null;
  min_delivery_days: number | null;
  max_delivery_days: number | null;
  country_codes: string[];
  is_active: boolean;
  position: number;
};

export type CouponRow = {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  scope: DiscountScope;
  value: number;
  minimum_order: number | null;
  maximum_discount: number | null;
  usage_limit: number | null;
  usage_limit_per_customer: number | null;
  used_count: number;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  members_only: boolean;
};

export type OrderRow = {
  id: string;
  order_number: string;
  cart_id: string | null;
  profile_id: string | null;
  email: string;
  phone: string | null;
  status: OrderStatus;
  fulfillment_status: FulfillmentStatus;
  payment_status: PaymentStatus;
  currency: string;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  grand_total: number;
  refunded_total: number;
  coupon_id: string | null;
  coupon_code: string | null;
  shipping_method: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  carrier: string | null;
  shipping_address: Json;
  billing_address: Json;
  customer_note: string | null;
  internal_note: string | null;
  cancel_reason: string | null;
  placed_at: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  variant_id: string | null;
  product_id: string | null;
  product_name: string;
  variant_title: string | null;
  sku: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  discount_total: number;
  tax_total: number;
  line_total: number;
  created_at: string;
};

export type PaymentRow = {
  id: string;
  order_id: string;
  provider: string;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  stripe_charge_id: string | null;
  status: PaymentStatus;
  amount: number;
  amount_refunded: number;
  currency: string;
  card_brand: string | null;
  card_last4: string | null;
  failure_code: string | null;
  failure_message: string | null;
  processed_at: string | null;
  created_at: string;
};

export type AddressRow = {
  id: string;
  profile_id: string;
  type: AddressType;
  label: string | null;
  first_name: string;
  last_name: string;
  company: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postal_code: string;
  country_code: string;
  phone: string | null;
  is_default: boolean;
  created_at: string;
};

export type WebhookEventRow = {
  id: string;
  provider: string;
  type: string;
  payload: Json;
  processed_at: string;
  error: string | null;
};

export type EmailLogRow = {
  id: string;
  template: string;
  recipient: string;
  subject: string;
  status: string;
  provider_id: string | null;
  error: string | null;
  order_id: string | null;
  metadata: Json;
  created_at: string;
};

/**
 * The generic shape `@supabase/supabase-js` expects. `Relationships` and the
 * Enums / CompositeTypes keys are required by PostgREST's type inference — omit
 * them and every query silently resolves to `never`.
 */
type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };
type View<Row> = { Row: Row; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      products: Table<ProductRow>;
      product_images: Table<ProductImageRow>;
      product_variants: Table<ProductVariantRow>;
      product_options: Table<ProductOptionRow>;
      categories: Table<CategoryRow>;
      reviews: Table<ReviewRow>;
      faqs: Table<FaqRow>;
      testimonials: Table<TestimonialRow>;
      banners: Table<BannerRow>;
      brand_values: Table<BrandValueRow>;
      story_sections: Table<StorySectionRow>;
      navigation_items: Table<NavigationItemRow>;
      membership_tiers: Table<MembershipTierRow>;
      collections: Table<CollectionRow>;
      blog_posts: Table<BlogPostRow>;
      pages: Table<PageRow>;
      site_settings: Table<SiteSettingRow>;
      profiles: Table<{
        id: string;
        email: string;
        full_name: string | null;
        first_name: string | null;
        last_name: string | null;
        phone: string | null;
        avatar_url: string | null;
        role: UserRole;
        status: AccountStatus;
        accepts_marketing: boolean;
        stripe_customer_id: string | null;
        last_seen_at: string | null;
        created_at: string;
      }>;
      wishlists: Table<{
        id: string;
        profile_id: string;
        name: string;
        is_public: boolean;
        share_token: string | null;
        created_at: string;
      }>;
      wishlist_items: Table<{
        id: string;
        wishlist_id: string;
        product_id: string;
        variant_id: string | null;
        note: string | null;
        added_at: string;
      }>;
      newsletter_subscribers: Table<{
        id: string;
        email: string;
        first_name: string | null;
        source: string | null;
        is_confirmed: boolean;
      }>;
      membership_applications: Table<{
        id: string;
        email: string;
        full_name: string | null;
        message: string | null;
        status: string;
      }>;
      analytics_events: Table<{
        id: number;
        name: string;
        product_id: string | null;
        profile_id: string | null;
        session_id: string | null;
        value: number | null;
        currency: string | null;
        metadata: Json;
        created_at: string;
      }>;
      carts: Table<CartRow>;
      cart_items: Table<CartItemRow>;
      orders: Table<OrderRow>;
      order_items: Table<OrderItemRow>;
      payments: Table<PaymentRow>;
      shipping_methods: Table<ShippingMethodRow>;
      coupons: Table<CouponRow>;
      addresses: Table<AddressRow>;
      webhook_events: Table<WebhookEventRow>;
      email_log: Table<EmailLogRow>;
      notifications: Table<{
        id: string;
        profile_id: string | null;
        audience: string;
        type: string;
        title: string;
        body: string | null;
        href: string | null;
        is_read: boolean;
        created_at: string;
      }>;
    };
    Views: {
      product_cards: View<ProductCardRow>;
    };
    Functions: {
      related_products: {
        Args: { p_product_id: string; p_limit?: number };
        Returns: ProductCardRow[];
      };
      frequently_bought_together: {
        Args: { p_product_id: string; p_limit?: number };
        Returns: ProductCardRow[];
      };
      ensure_cart: {
        Args: { p_profile_id?: string | null; p_session_token?: string | null };
        Returns: string;
      };
      merge_guest_cart: {
        Args: { p_session_token: string; p_profile_id: string };
        Returns: string;
      };
      price_cart: {
        Args: {
          p_cart_id: string;
          p_shipping_method_id?: string | null;
          p_coupon_code?: string | null;
          p_profile_id?: string | null;
        };
        Returns: Json;
      };
      create_order_from_cart: {
        Args: {
          p_cart_id: string;
          p_email: string;
          p_shipping_address: Json;
          p_billing_address?: Json | null;
          p_shipping_method_id?: string | null;
          p_coupon_code?: string | null;
          p_phone?: string | null;
          p_customer_note?: string | null;
          p_profile_id?: string | null;
        };
        Returns: Json;
      };
      mark_order_paid: {
        Args: {
          p_order_id: string;
          p_payment_intent_id?: string | null;
          p_checkout_session_id?: string | null;
          p_amount?: number | null;
          p_card_brand?: string | null;
          p_card_last4?: string | null;
          p_charge_id?: string | null;
        };
        Returns: Json;
      };
      mark_order_payment_failed: {
        Args: { p_order_id: string; p_reason?: string | null };
        Returns: undefined;
      };
      release_order_reservations: {
        Args: { p_order_id: string; p_note?: string | null };
        Returns: undefined;
      };
    };
    Enums: {
      user_role: UserRole;
      account_status: AccountStatus;
      product_status: ProductStatus;
      content_status: ContentStatus;
      review_status: ReviewStatus;
      banner_placement: BannerPlacement;
      order_status: OrderStatus;
      fulfillment_status: FulfillmentStatus;
      payment_status: PaymentStatus;
      discount_type: DiscountType;
      discount_scope: DiscountScope;
      address_type: AddressType;
      inventory_reason: InventoryReason;
    };
    CompositeTypes: Record<never, never>;
  };
}
