-- =============================================================================
-- BRUNO COMMERCE — apply everything, in order, in one paste.
--
-- GENERATED FILE. Do not edit by hand: run `npm run db:bundle` to rebuild it
-- from supabase/migrations/*.sql and supabase/seed.sql.
--
-- HOW TO USE
--   1. Supabase dashboard -> SQL Editor -> New query
--   2. Paste this whole file
--   3. Run
--
-- It is safe on an empty database and safe to re-run the seed (every insert is
-- idempotent on its natural key). It is NOT safe to re-run the migrations over
-- a database that already has them: `create table` will error on the first
-- table it meets. That error is the correct behaviour — it means the schema is
-- already there.
--
-- After running, regenerate the types:
--   npx supabase gen types typescript --project-id <id> --schema public > types/database.ts
-- =============================================================================

begin;


-- =============================================================================
-- 0001_extensions_and_enums.sql
-- =============================================================================

-- =============================================================================
-- 0001 · Extensions, enums, and shared helpers
-- =============================================================================

create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "citext";        -- case-insensitive email
create extension if not exists "pg_trgm";       -- fuzzy search on names/SKUs
create extension if not exists "unaccent";      -- accent-insensitive search

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------

create type user_role as enum (
  'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EDITOR', 'CUSTOMER'
);

create type account_status as enum ('ACTIVE', 'SUSPENDED', 'DELETED');

create type product_status as enum ('DRAFT', 'ACTIVE', 'ARCHIVED');

create type order_status as enum (
  'PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'
);

create type fulfillment_status as enum (
  'UNFULFILLED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'RETURNED'
);

create type payment_status as enum (
  'PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'
);

create type discount_type as enum ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING');

create type discount_scope as enum ('ORDER', 'PRODUCT', 'CATEGORY');

create type address_type as enum ('SHIPPING', 'BILLING');

create type review_status as enum ('PENDING', 'APPROVED', 'HIDDEN', 'REJECTED');

create type content_status as enum ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

create type inventory_reason as enum (
  'INITIAL', 'RESTOCK', 'SALE', 'RETURN', 'DAMAGE', 'CORRECTION', 'RESERVATION', 'RELEASE'
);

create type banner_placement as enum (
  'HOME_HERO', 'HOME_PROMO', 'CATALOG_TOP', 'ANNOUNCEMENT_BAR', 'FOOTER'
);

-- -----------------------------------------------------------------------------
-- Shared helpers
-- -----------------------------------------------------------------------------

-- Keeps updated_at honest on every table that has one.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Deterministic, URL-safe slug from arbitrary text.
create or replace function slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(
      regexp_replace(lower(unaccent(coalesce(value, ''))), '[^a-z0-9]+', '-', 'g'),
      '-{2,}', '-', 'g'
    )
  );
$$;

comment on function slugify is 'Lowercase, accent-stripped, hyphenated slug. Uniqueness is enforced by unique indexes, not here.';

-- array_to_string is only STABLE (it depends on the element output function), so a
-- generated column cannot call it directly. This wrapper is immutable for text[].
create or replace function text_array_to_string(arr text[], sep text)
returns text
language sql
immutable
as $$
  select array_to_string(coalesce(arr, '{}'::text[]), sep);
$$;


-- =============================================================================
-- 0002_identity.sql
-- =============================================================================

-- =============================================================================
-- 0002 · Identity: profiles, roles, permissions, addresses
-- Supabase owns auth.users. profiles is our 1:1 mirror with app-level fields.
-- =============================================================================

create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           citext not null unique,
  full_name       text,
  first_name      text,
  last_name       text,
  phone           text,
  avatar_url      text,
  role            user_role not null default 'CUSTOMER',
  status          account_status not null default 'ACTIVE',
  accepts_marketing boolean not null default false,
  marketing_opted_in_at timestamptz,
  default_shipping_address_id uuid,
  default_billing_address_id  uuid,
  stripe_customer_id text unique,
  notes           text,                       -- internal, admin-only
  last_seen_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint profiles_phone_shape check (phone is null or length(phone) between 5 and 32)
);

comment on table profiles is 'Application profile for every auth.users row. role drives RBAC via auth_role().';
comment on column profiles.notes is 'Internal admin notes. Never exposed to the customer — see RLS column guidance in 0009.';

create index profiles_role_idx    on profiles (role);
create index profiles_status_idx  on profiles (status);
create index profiles_created_idx on profiles (created_at desc);
create index profiles_name_trgm   on profiles using gin (coalesce(full_name, '') gin_trgm_ops);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- Role helpers used by every RLS policy. SECURITY DEFINER so that reading the
-- caller's own role does not itself require a policy (which would recurse).
-- -----------------------------------------------------------------------------

create or replace function auth_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from profiles where id = auth.uid()),
    'CUSTOMER'::user_role
  );
$$;

create or replace function is_staff()
returns boolean
language sql
stable
as $$
  select auth_role() in ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EDITOR');
$$;

-- Can change catalog, inventory, orders, pricing.
create or replace function can_manage_commerce()
returns boolean
language sql
stable
as $$
  select auth_role() in ('SUPER_ADMIN', 'ADMIN', 'MANAGER');
$$;

-- Can change marketing content: pages, blog, banners, FAQs, testimonials.
create or replace function can_manage_content()
returns boolean
language sql
stable
as $$
  select auth_role() in ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EDITOR');
$$;

-- Can see customer PII, refunds, settings, and other staff accounts.
create or replace function is_admin()
returns boolean
language sql
stable
as $$
  select auth_role() in ('SUPER_ADMIN', 'ADMIN');
$$;

-- -----------------------------------------------------------------------------
-- Granular permission matrix. The helpers above cover 95% of policies; this
-- table exists so the admin UI can show and tune per-role capabilities without
-- a migration.
-- -----------------------------------------------------------------------------

create table permissions (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,       -- e.g. 'orders.refund'
  resource    text not null,              -- e.g. 'orders'
  action      text not null,              -- e.g. 'refund'
  description text not null,
  created_at  timestamptz not null default now()
);

create table role_permissions (
  role          user_role not null,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role, permission_id)
);

create index role_permissions_role_idx on role_permissions (role);

-- -----------------------------------------------------------------------------
-- Addresses
-- -----------------------------------------------------------------------------

create table addresses (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references profiles(id) on delete cascade,
  type          address_type not null default 'SHIPPING',
  label         text,                        -- 'Home', 'Studio'
  first_name    text not null,
  last_name     text not null,
  company       text,
  line1         text not null,
  line2         text,
  city          text not null,
  region        text,                        -- state / province
  postal_code   text not null,
  country_code  char(2) not null,
  phone         text,
  is_default    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint addresses_country_upper check (country_code = upper(country_code))
);

create index addresses_profile_idx on addresses (profile_id);
create unique index addresses_one_default_per_type
  on addresses (profile_id, type) where is_default;

create trigger addresses_set_updated_at
  before update on addresses
  for each row execute function set_updated_at();

alter table profiles
  add constraint profiles_default_shipping_fk
    foreign key (default_shipping_address_id) references addresses(id) on delete set null,
  add constraint profiles_default_billing_fk
    foreign key (default_billing_address_id) references addresses(id) on delete set null;

-- -----------------------------------------------------------------------------
-- Provision a profile whenever Supabase Auth creates a user.
-- -----------------------------------------------------------------------------

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, first_name, last_name, avatar_url)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')), ''),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- =============================================================================
-- 0003_catalog.sql
-- =============================================================================

-- =============================================================================
-- 0003 · Catalog: categories, products, variants, images, options, collections
-- =============================================================================

create table categories (
  id               uuid primary key default gen_random_uuid(),
  parent_id        uuid references categories(id) on delete set null,
  name             text not null,
  slug             text not null unique,
  description      text,
  image_url        text,
  image_alt        text,
  position         integer not null default 0,
  is_active        boolean not null default true,
  is_featured      boolean not null default false,
  -- SEO (see Memory.md D-003: first-class columns, not a blob)
  seo_title        text,
  seo_description  text,
  canonical_url    text,
  og_image_url     text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint categories_not_own_parent check (id <> parent_id),
  constraint categories_slug_shape check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create index categories_parent_idx   on categories (parent_id);
create index categories_active_idx   on categories (is_active, position);
create index categories_featured_idx on categories (is_featured) where is_featured;

create trigger categories_set_updated_at
  before update on categories
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- Products
-- -----------------------------------------------------------------------------

create table products (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  slug               text not null unique,
  subtitle           text,
  description        text,
  story              text,                      -- long-form atelier narrative
  sku                text unique,
  status             product_status not null default 'DRAFT',
  price              numeric(12,2) not null,
  compare_at_price   numeric(12,2),             -- the "was" price; sale when set and higher
  cost_price         numeric(12,2),             -- admin-only margin data
  currency           char(3) not null default 'USD',
  tax_code           text,
  is_featured        boolean not null default false,
  is_new             boolean not null default false,
  is_limited         boolean not null default false,
  is_members_only    boolean not null default false,
  requires_shipping  boolean not null default true,
  weight_grams       integer,
  materials          text,
  care_instructions  text,
  origin             text,
  specifications     jsonb not null default '{}'::jsonb,
  shipping_info      text,
  returns_info       text,
  tags               text[] not null default '{}',
  badge              text,
  rating_average     numeric(3,2) not null default 0,
  rating_count       integer not null default 0,
  units_sold         integer not null default 0,
  view_count         integer not null default 0,
  position           integer not null default 0,
  published_at       timestamptz,
  -- SEO
  seo_title          text,
  seo_description    text,
  canonical_url      text,
  og_image_url       text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint products_price_nonneg      check (price >= 0),
  constraint products_compare_gt_price  check (compare_at_price is null or compare_at_price > price),
  constraint products_cost_nonneg       check (cost_price is null or cost_price >= 0),
  constraint products_rating_range      check (rating_average between 0 and 5),
  constraint products_slug_shape        check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint products_currency_upper    check (currency = upper(currency))
);

comment on column products.compare_at_price is 'Original price. A product is on sale exactly when this is set and greater than price.';
comment on column products.cost_price is 'Admin-only. Never selected in storefront queries.';

-- Full-text search (Memory.md D-005). Weighted: name > subtitle/description > tags.
alter table products add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(subtitle, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('english', text_array_to_string(tags, ' ')), 'D')
  ) stored;

create index products_search_idx     on products using gin (search_vector);
create index products_name_trgm_idx  on products using gin (name gin_trgm_ops);
create index products_status_idx     on products (status, published_at desc);
create index products_featured_idx   on products (is_featured) where is_featured and status = 'ACTIVE';
create index products_price_idx      on products (price);
create index products_tags_idx       on products using gin (tags);
create index products_units_sold_idx on products (units_sold desc);
create index products_created_idx    on products (created_at desc);

create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- Product ↔ category (many-to-many, one primary)
-- -----------------------------------------------------------------------------

create table product_categories (
  product_id  uuid not null references products(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  is_primary  boolean not null default false,
  primary key (product_id, category_id)
);

create index product_categories_category_idx on product_categories (category_id);
create unique index product_categories_one_primary
  on product_categories (product_id) where is_primary;

-- -----------------------------------------------------------------------------
-- Options and variants
-- -----------------------------------------------------------------------------

create table product_options (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name       text not null,                 -- 'Size', 'Colour'
  position   integer not null default 0,
  values     text[] not null default '{}',
  unique (product_id, name)
);

create index product_options_product_idx on product_options (product_id);

create table product_variants (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references products(id) on delete cascade,
  title             text not null,                    -- 'Bone / M'
  sku               text not null unique,
  barcode           text,
  option_values     jsonb not null default '{}'::jsonb, -- {"Colour":"Bone","Size":"M"}
  price             numeric(12,2),                    -- null → inherit product price
  compare_at_price  numeric(12,2),
  stock_quantity    integer not null default 0,
  reserved_quantity integer not null default 0,
  low_stock_threshold integer not null default 5,
  allow_backorder   boolean not null default false,
  weight_grams      integer,
  image_url         text,
  position          integer not null default 0,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint variants_stock_nonneg     check (stock_quantity >= 0),
  constraint variants_reserved_nonneg  check (reserved_quantity >= 0),
  constraint variants_reserved_lte     check (reserved_quantity <= stock_quantity),
  constraint variants_price_nonneg     check (price is null or price >= 0),
  constraint variants_threshold_nonneg check (low_stock_threshold >= 0)
);

comment on column product_variants.reserved_quantity is 'Held by in-flight checkouts. Sellable = stock_quantity - reserved_quantity.';

create index variants_product_idx  on product_variants (product_id, position);
create index variants_active_idx   on product_variants (is_active);
create index variants_low_stock_idx
  on product_variants (stock_quantity)
  where is_active and stock_quantity <= low_stock_threshold;
create index variants_options_idx  on product_variants using gin (option_values);

create trigger variants_set_updated_at
  before update on product_variants
  for each row execute function set_updated_at();

-- Sellable stock, used everywhere instead of raw stock_quantity.
create or replace function variant_available(v product_variants)
returns integer
language sql
stable
as $$
  select greatest(v.stock_quantity - v.reserved_quantity, 0);
$$;

-- -----------------------------------------------------------------------------
-- Images
-- -----------------------------------------------------------------------------

create table product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  variant_id  uuid references product_variants(id) on delete set null,
  url         text not null,
  alt         text not null default '',
  width       integer,
  height      integer,
  blur_data   text,                        -- base64 LQIP for next/image
  position    integer not null default 0,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now()
);

comment on column product_images.alt is 'Required for accessibility and SEO. Empty string only for purely decorative plates.';

create index product_images_product_idx on product_images (product_id, position);
create unique index product_images_one_primary
  on product_images (product_id) where is_primary;

-- -----------------------------------------------------------------------------
-- Curated collections (editorial groupings independent of the category tree)
-- -----------------------------------------------------------------------------

create table collections (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  description     text,
  image_url       text,
  is_active       boolean not null default true,
  position        integer not null default 0,
  seo_title       text,
  seo_description text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table collection_products (
  collection_id uuid not null references collections(id) on delete cascade,
  product_id    uuid not null references products(id) on delete cascade,
  position      integer not null default 0,
  primary key (collection_id, product_id)
);

create index collection_products_product_idx on collection_products (product_id);

create trigger collections_set_updated_at
  before update on collections
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- Frequently bought together / manual cross-sells
-- -----------------------------------------------------------------------------

create table product_relations (
  product_id  uuid not null references products(id) on delete cascade,
  related_id  uuid not null references products(id) on delete cascade,
  kind        text not null default 'RELATED',  -- RELATED | FBT | UPSELL
  position    integer not null default 0,
  primary key (product_id, related_id, kind),
  constraint product_relations_not_self check (product_id <> related_id)
);

create index product_relations_related_idx on product_relations (related_id);


-- =============================================================================
-- 0004_commerce.sql
-- =============================================================================

-- =============================================================================
-- 0004 · Commerce: inventory ledger, carts, orders, payments, shipments
-- =============================================================================

create table inventory_transactions (
  id          uuid primary key default gen_random_uuid(),
  variant_id  uuid not null references product_variants(id) on delete cascade,
  delta       integer not null,
  reason      inventory_reason not null,
  balance_after integer not null,
  reference_type text,                      -- 'order', 'manual', 'return'
  reference_id   uuid,
  note        text,
  actor_id    uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint inventory_delta_nonzero check (delta <> 0)
);

comment on table inventory_transactions is 'Immutable ledger (Memory.md D-004). Never updated, never deleted — corrections are new rows.';

create index inventory_tx_variant_idx  on inventory_transactions (variant_id, created_at desc);
create index inventory_tx_reference_idx on inventory_transactions (reference_type, reference_id);
create index inventory_tx_created_idx   on inventory_transactions (created_at desc);

-- -----------------------------------------------------------------------------
-- Carts. Exactly one of profile_id / session_token identifies the owner.
-- -----------------------------------------------------------------------------

create table carts (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid references profiles(id) on delete cascade,
  session_token  text unique,                -- anonymous guest cookie
  currency       char(3) not null default 'USD',
  coupon_id      uuid,                       -- FK added in 0005 (coupons)
  note           text,
  expires_at     timestamptz not null default (now() + interval '30 days'),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint carts_owner_present check (profile_id is not null or session_token is not null)
);

create unique index carts_one_active_per_profile on carts (profile_id) where profile_id is not null;
create index carts_expires_idx on carts (expires_at);

create trigger carts_set_updated_at
  before update on carts
  for each row execute function set_updated_at();

create table cart_items (
  id         uuid primary key default gen_random_uuid(),
  cart_id    uuid not null references carts(id) on delete cascade,
  variant_id uuid not null references product_variants(id) on delete cascade,
  quantity   integer not null default 1,
  added_at   timestamptz not null default now(),
  unique (cart_id, variant_id),
  constraint cart_items_qty_positive check (quantity > 0 and quantity <= 99)
);

comment on table cart_items is 'No price column by design — price is always read live from the variant (Agents.md rule 3).';

create index cart_items_cart_idx on cart_items (cart_id);

-- -----------------------------------------------------------------------------
-- Orders
-- -----------------------------------------------------------------------------

create sequence order_number_seq start 1000;

create table orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        text not null unique default ('BR-' || lpad(nextval('order_number_seq')::text, 6, '0')),
  profile_id          uuid references profiles(id) on delete set null,
  email               citext not null,
  phone               text,
  status              order_status not null default 'PENDING',
  fulfillment_status  fulfillment_status not null default 'UNFULFILLED',
  payment_status      payment_status not null default 'PENDING',
  currency            char(3) not null default 'USD',

  subtotal            numeric(12,2) not null default 0,
  discount_total      numeric(12,2) not null default 0,
  shipping_total      numeric(12,2) not null default 0,
  tax_total           numeric(12,2) not null default 0,
  grand_total         numeric(12,2) not null default 0,
  refunded_total      numeric(12,2) not null default 0,

  coupon_id           uuid,                  -- FK added in 0005
  coupon_code         text,                  -- snapshot
  shipping_method     text,
  tracking_number     text,
  tracking_url        text,
  carrier             text,

  -- Address snapshots. An order is a historical record (Memory.md D-008).
  shipping_address    jsonb,
  billing_address     jsonb,

  customer_note       text,
  internal_note       text,
  cancel_reason       text,

  placed_at           timestamptz,
  paid_at             timestamptz,
  shipped_at          timestamptz,
  delivered_at        timestamptz,
  cancelled_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint orders_totals_nonneg check (
    subtotal >= 0 and discount_total >= 0 and shipping_total >= 0
    and tax_total >= 0 and grand_total >= 0 and refunded_total >= 0
  ),
  constraint orders_refund_lte_total check (refunded_total <= grand_total)
);

create index orders_profile_idx  on orders (profile_id, created_at desc);
create index orders_status_idx   on orders (status, created_at desc);
create index orders_payment_idx  on orders (payment_status);
create index orders_email_idx    on orders (email);
create index orders_created_idx  on orders (created_at desc);
create index orders_number_trgm  on orders using gin (order_number gin_trgm_ops);

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

create table order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  variant_id    uuid references product_variants(id) on delete set null,
  product_id    uuid references products(id) on delete set null,
  -- Snapshots: editing a product must not rewrite history (Memory.md D-008).
  product_name  text not null,
  variant_title text,
  sku           text,
  image_url     text,
  unit_price    numeric(12,2) not null,
  quantity      integer not null,
  discount_total numeric(12,2) not null default 0,
  tax_total     numeric(12,2) not null default 0,
  line_total    numeric(12,2) not null,
  created_at    timestamptz not null default now(),
  constraint order_items_qty_positive check (quantity > 0),
  constraint order_items_price_nonneg check (unit_price >= 0 and line_total >= 0)
);

create index order_items_order_idx   on order_items (order_id);
create index order_items_product_idx on order_items (product_id);
create index order_items_variant_idx on order_items (variant_id);

-- -----------------------------------------------------------------------------
-- Payments. No card data is ever stored (PRD FR-C5).
-- -----------------------------------------------------------------------------

create table payments (
  id                        uuid primary key default gen_random_uuid(),
  order_id                  uuid not null references orders(id) on delete cascade,
  provider                  text not null default 'stripe',
  stripe_payment_intent_id  text unique,
  stripe_checkout_session_id text unique,
  stripe_charge_id          text,
  status                    payment_status not null default 'PENDING',
  amount                    numeric(12,2) not null,
  amount_refunded           numeric(12,2) not null default 0,
  currency                  char(3) not null default 'USD',
  card_brand                text,            -- display only, from Stripe
  card_last4                char(4),         -- display only, from Stripe
  failure_code              text,
  failure_message           text,
  processed_at              timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint payments_amount_nonneg check (amount >= 0 and amount_refunded >= 0),
  constraint payments_refund_lte    check (amount_refunded <= amount)
);

comment on table payments is 'Stripe references only. Storing a PAN here would be a PCI violation and is impossible by schema.';

create index payments_order_idx  on payments (order_id);
create index payments_status_idx on payments (status);

create trigger payments_set_updated_at
  before update on payments
  for each row execute function set_updated_at();

create table refunds (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references orders(id) on delete cascade,
  payment_id        uuid references payments(id) on delete set null,
  stripe_refund_id  text unique,
  amount            numeric(12,2) not null,
  reason            text,
  note              text,
  actor_id          uuid references profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  constraint refunds_amount_positive check (amount > 0)
);

create index refunds_order_idx on refunds (order_id);

-- -----------------------------------------------------------------------------
-- Shipments
-- -----------------------------------------------------------------------------

create table shipments (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references orders(id) on delete cascade,
  carrier         text,
  service         text,
  tracking_number text,
  tracking_url    text,
  status          text not null default 'PENDING',
  shipped_at      timestamptz,
  delivered_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index shipments_order_idx on shipments (order_id);

create trigger shipments_set_updated_at
  before update on shipments
  for each row execute function set_updated_at();

create table shipment_items (
  shipment_id   uuid not null references shipments(id) on delete cascade,
  order_item_id uuid not null references order_items(id) on delete cascade,
  quantity      integer not null,
  primary key (shipment_id, order_item_id),
  constraint shipment_items_qty_positive check (quantity > 0)
);

-- -----------------------------------------------------------------------------
-- Shipping methods (rates the storefront offers at checkout)
-- -----------------------------------------------------------------------------

create table shipping_methods (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  description         text,
  price               numeric(12,2) not null default 0,
  free_over           numeric(12,2),          -- free when subtotal exceeds this
  min_delivery_days   integer,
  max_delivery_days   integer,
  country_codes       char(2)[] not null default '{}',  -- empty = everywhere
  is_active           boolean not null default true,
  position            integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint shipping_price_nonneg check (price >= 0)
);

create trigger shipping_methods_set_updated_at
  before update on shipping_methods
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- Stripe webhook idempotency (Memory.md D-007)
-- -----------------------------------------------------------------------------

create table webhook_events (
  id           text primary key,             -- Stripe event id, e.g. evt_...
  provider     text not null default 'stripe',
  type         text not null,
  payload      jsonb,
  processed_at timestamptz not null default now(),
  error        text
);

create index webhook_events_type_idx on webhook_events (type, processed_at desc);


-- =============================================================================
-- 0005_marketing.sql
-- =============================================================================

-- =============================================================================
-- 0005 · Marketing: coupons, reviews, wishlists, newsletter, memberships
-- =============================================================================

create table coupons (
  id                 uuid primary key default gen_random_uuid(),
  code               citext not null unique,
  description        text,
  discount_type      discount_type not null,
  scope              discount_scope not null default 'ORDER',
  value              numeric(12,2) not null default 0,   -- percent, or fixed amount
  minimum_order      numeric(12,2),
  maximum_discount   numeric(12,2),                      -- cap for percentage coupons
  usage_limit        integer,                            -- total redemptions allowed
  usage_limit_per_customer integer,
  used_count         integer not null default 0,
  starts_at          timestamptz not null default now(),
  ends_at            timestamptz,
  is_active          boolean not null default true,
  members_only       boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint coupons_value_nonneg check (value >= 0),
  constraint coupons_percentage_range check (
    discount_type <> 'PERCENTAGE' or value between 0 and 100
  ),
  constraint coupons_window check (ends_at is null or ends_at > starts_at),
  constraint coupons_used_nonneg check (used_count >= 0)
);

create index coupons_active_idx on coupons (is_active, starts_at, ends_at);

create trigger coupons_set_updated_at
  before update on coupons
  for each row execute function set_updated_at();

-- Scope a coupon to specific products or categories.
create table coupon_products (
  coupon_id  uuid not null references coupons(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  primary key (coupon_id, product_id)
);

create table coupon_categories (
  coupon_id   uuid not null references coupons(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (coupon_id, category_id)
);

create table coupon_redemptions (
  id         uuid primary key default gen_random_uuid(),
  coupon_id  uuid not null references coupons(id) on delete cascade,
  order_id   uuid not null references orders(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null,
  amount     numeric(12,2) not null,
  created_at timestamptz not null default now(),
  unique (coupon_id, order_id)
);

create index coupon_redemptions_profile_idx on coupon_redemptions (profile_id);

-- Deferred FKs from 0004
alter table carts  add constraint carts_coupon_fk  foreign key (coupon_id) references coupons(id) on delete set null;
alter table orders add constraint orders_coupon_fk foreign key (coupon_id) references coupons(id) on delete set null;

-- -----------------------------------------------------------------------------
-- Reviews
-- -----------------------------------------------------------------------------

create table reviews (
  id                 uuid primary key default gen_random_uuid(),
  product_id         uuid not null references products(id) on delete cascade,
  profile_id         uuid references profiles(id) on delete set null,
  order_id           uuid references orders(id) on delete set null,
  author_name        text not null,
  author_location    text,
  rating             integer not null,
  title              text,
  body               text not null,
  status             review_status not null default 'PENDING',
  is_verified_purchase boolean not null default false,
  is_featured        boolean not null default false,
  helpful_count      integer not null default 0,
  admin_response     text,
  responded_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint reviews_rating_range check (rating between 1 and 5),
  constraint reviews_body_length check (char_length(body) between 10 and 5000)
);

create index reviews_product_idx  on reviews (product_id, status, created_at desc);
create index reviews_profile_idx  on reviews (profile_id);
create index reviews_status_idx   on reviews (status);
create unique index reviews_one_per_customer_product
  on reviews (product_id, profile_id) where profile_id is not null;

create trigger reviews_set_updated_at
  before update on reviews
  for each row execute function set_updated_at();

-- Keep products.rating_average / rating_count in sync with APPROVED reviews only.
create or replace function refresh_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.product_id, old.product_id);
begin
  update products p set
    rating_average = coalesce((
      select round(avg(r.rating)::numeric, 2) from reviews r
      where r.product_id = target and r.status = 'APPROVED'
    ), 0),
    rating_count = (
      select count(*) from reviews r
      where r.product_id = target and r.status = 'APPROVED'
    )
  where p.id = target;
  return null;
end;
$$;

create trigger reviews_refresh_rating
  after insert or update or delete on reviews
  for each row execute function refresh_product_rating();

-- -----------------------------------------------------------------------------
-- Wishlists
-- -----------------------------------------------------------------------------

create table wishlists (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name       text not null default 'Saved',
  is_public  boolean not null default false,
  share_token text unique,
  created_at timestamptz not null default now(),
  unique (profile_id, name)
);

create table wishlist_items (
  id          uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references wishlists(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  variant_id  uuid references product_variants(id) on delete set null,
  note        text,
  added_at    timestamptz not null default now(),
  unique (wishlist_id, product_id, variant_id)
);

create index wishlist_items_wishlist_idx on wishlist_items (wishlist_id);
create index wishlist_items_product_idx  on wishlist_items (product_id);

-- -----------------------------------------------------------------------------
-- Newsletter and membership
-- -----------------------------------------------------------------------------

create table newsletter_subscribers (
  id             uuid primary key default gen_random_uuid(),
  email          citext not null unique,
  first_name     text,
  source         text,                      -- 'footer', 'membership-cta', 'checkout'
  is_confirmed   boolean not null default false,
  confirm_token  uuid not null default gen_random_uuid(),
  confirmed_at   timestamptz,
  unsubscribed_at timestamptz,
  created_at     timestamptz not null default now()
);

create index newsletter_confirmed_idx on newsletter_subscribers (is_confirmed);

create table membership_tiers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,        -- 'Atelier', 'Circle', 'Maison'
  slug          text not null unique,
  tagline       text,
  description   text,
  benefits      text[] not null default '{}',
  min_spend     numeric(12,2) not null default 0,
  discount_percent numeric(5,2) not null default 0,
  early_access_hours integer not null default 0,
  position      integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  constraint membership_discount_range check (discount_percent between 0 and 100)
);

create table memberships (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  tier_id     uuid not null references membership_tiers(id) on delete restrict,
  status      text not null default 'ACTIVE',
  joined_at   timestamptz not null default now(),
  expires_at  timestamptz,
  lifetime_spend numeric(12,2) not null default 0,
  unique (profile_id)
);

create index memberships_tier_idx on memberships (tier_id);

create table membership_applications (
  id           uuid primary key default gen_random_uuid(),
  email        citext not null,
  full_name    text,
  message      text,
  status       text not null default 'PENDING',
  reviewed_by  uuid references profiles(id) on delete set null,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index membership_applications_status_idx on membership_applications (status, created_at desc);


-- =============================================================================
-- 0006_cms.sql
-- =============================================================================

-- =============================================================================
-- 0006 · CMS: pages, blog, banners, FAQs, testimonials, navigation, settings
-- Everything on the storefront that is words or pictures lives here, so the
-- owner never edits code (PRD FR-D3).
-- =============================================================================

create table pages (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  subtitle        text,
  content         text,                       -- markdown
  blocks          jsonb not null default '[]'::jsonb,  -- structured sections
  status          content_status not null default 'DRAFT',
  published_at    timestamptz,
  seo_title       text,
  seo_description text,
  canonical_url   text,
  og_image_url    text,
  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint pages_slug_shape check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create index pages_status_idx on pages (status, published_at desc);

create trigger pages_set_updated_at
  before update on pages
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- Blog / Journal
-- -----------------------------------------------------------------------------

create table blog_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create table blog_posts (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  title             text not null,
  excerpt           text,
  content           text,
  featured_image_url text,
  featured_image_alt text,
  category_id       uuid references blog_categories(id) on delete set null,
  author_id         uuid references profiles(id) on delete set null,
  author_name       text,
  tags              text[] not null default '{}',
  status            content_status not null default 'DRAFT',
  reading_minutes   integer,
  view_count        integer not null default 0,
  published_at      timestamptz,
  scheduled_for     timestamptz,
  seo_title         text,
  seo_description   text,
  canonical_url     text,
  og_image_url      text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint blog_slug_shape check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

alter table blog_posts add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) stored;

create index blog_posts_search_idx    on blog_posts using gin (search_vector);
create index blog_posts_status_idx    on blog_posts (status, published_at desc);
create index blog_posts_category_idx  on blog_posts (category_id);
create index blog_posts_tags_idx      on blog_posts using gin (tags);

create trigger blog_posts_set_updated_at
  before update on blog_posts
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- Banners, FAQs, testimonials
-- -----------------------------------------------------------------------------

create table banners (
  id             uuid primary key default gen_random_uuid(),
  placement      banner_placement not null,
  title          text,
  subtitle       text,
  body           text,
  eyebrow        text,
  image_url      text,
  image_alt      text,
  cta_label      text,
  cta_href       text,
  secondary_cta_label text,
  secondary_cta_href  text,
  theme          text not null default 'obsidian',
  position       integer not null default 0,
  is_active      boolean not null default true,
  starts_at      timestamptz,
  ends_at        timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint banners_window check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create index banners_placement_idx on banners (placement, position) where is_active;

create trigger banners_set_updated_at
  before update on banners
  for each row execute function set_updated_at();

create table faqs (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null,
  category   text not null default 'General',
  product_id uuid references products(id) on delete cascade,  -- null = site-wide
  position   integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index faqs_active_idx  on faqs (is_active, category, position);
create index faqs_product_idx on faqs (product_id);

create trigger faqs_set_updated_at
  before update on faqs
  for each row execute function set_updated_at();

create table testimonials (
  id           uuid primary key default gen_random_uuid(),
  author_name  text not null,
  author_title text,
  author_location text,
  avatar_url   text,
  quote        text not null,
  rating       integer,
  product_id   uuid references products(id) on delete set null,
  position     integer not null default 0,
  is_featured  boolean not null default false,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint testimonials_rating_range check (rating is null or rating between 1 and 5)
);

create index testimonials_active_idx on testimonials (is_active, position);

create trigger testimonials_set_updated_at
  before update on testimonials
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- Brand values / storytelling blocks (the "premium brand values" section)
-- -----------------------------------------------------------------------------

create table brand_values (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null,
  icon        text,                          -- lucide icon name
  detail      text,
  position    integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table story_sections (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,          -- 'atelier', 'materials', 'craft'
  eyebrow     text,
  title       text not null,
  body        text not null,
  quote       text,
  image_url   text,
  image_alt   text,
  stat_value  text,
  stat_label  text,
  cta_label   text,
  cta_href    text,
  position    integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger story_sections_set_updated_at
  before update on story_sections
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- Navigation
-- -----------------------------------------------------------------------------

create table navigation_items (
  id         uuid primary key default gen_random_uuid(),
  menu       text not null,                  -- 'header', 'footer-shop', 'footer-house'
  parent_id  uuid references navigation_items(id) on delete cascade,
  label      text not null,
  href       text not null,
  position   integer not null default 0,
  is_active  boolean not null default true,
  opens_new_tab boolean not null default false,
  created_at timestamptz not null default now()
);

create index navigation_menu_idx on navigation_items (menu, position) where is_active;

-- -----------------------------------------------------------------------------
-- Site settings — a typed key/value store the admin UI renders as a form.
-- -----------------------------------------------------------------------------

create table site_settings (
  key         text primary key,
  value       jsonb not null,
  group_name  text not null default 'general',
  label       text,
  description text,
  is_public   boolean not null default false,  -- safe to expose to the storefront
  updated_by  uuid references profiles(id) on delete set null,
  updated_at  timestamptz not null default now()
);

comment on column site_settings.is_public is 'Only rows with is_public = true are readable by anon. Keys and secrets must stay false.';

create index site_settings_group_idx on site_settings (group_name);

create trigger site_settings_set_updated_at
  before update on site_settings
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- Notifications and audit
-- -----------------------------------------------------------------------------

create table notifications (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid references profiles(id) on delete cascade,
  audience    text not null default 'USER',  -- USER | STAFF
  type        text not null,                 -- 'order.placed', 'inventory.low'
  title       text not null,
  body        text,
  href        text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index notifications_profile_idx on notifications (profile_id, is_read, created_at desc);
create index notifications_audience_idx on notifications (audience, created_at desc);

create table audit_log (
  id          bigserial primary key,
  actor_id    uuid references profiles(id) on delete set null,
  actor_email citext,
  action      text not null,                 -- 'product.update'
  entity      text not null,                 -- 'products'
  entity_id   uuid,
  changes     jsonb,
  ip_address  inet,
  created_at  timestamptz not null default now()
);

create index audit_log_entity_idx on audit_log (entity, entity_id, created_at desc);
create index audit_log_actor_idx  on audit_log (actor_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Storefront analytics events (first-party, complements GA4)
-- -----------------------------------------------------------------------------

create table analytics_events (
  id          bigserial primary key,
  session_id  text,
  profile_id  uuid references profiles(id) on delete set null,
  name        text not null,                 -- 'product_view', 'add_to_cart'
  product_id  uuid references products(id) on delete set null,
  value       numeric(12,2),
  currency    char(3),
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index analytics_events_name_idx    on analytics_events (name, created_at desc);
create index analytics_events_product_idx on analytics_events (product_id, created_at desc);


-- =============================================================================
-- 0007_views_and_functions.sql
-- =============================================================================

-- =============================================================================
-- 0007 · Reporting views and callable functions
-- =============================================================================

-- Storefront product list shape: one row per active product with its primary
-- image, price range and stock rollup. Keeps list queries to a single scan.
create or replace view product_cards
with (security_invoker = true)
as
select
  p.id,
  p.name,
  p.slug,
  p.subtitle,
  p.price,
  p.compare_at_price,
  p.currency,
  p.badge,
  p.is_featured,
  p.is_new,
  p.is_limited,
  p.is_members_only,
  p.rating_average,
  p.rating_count,
  p.units_sold,
  p.tags,
  p.published_at,
  p.created_at,
  img.url  as image_url,
  img.alt  as image_alt,
  img.blur_data,
  coalesce(stock.total_available, 0)              as available_quantity,
  coalesce(stock.total_available, 0) > 0          as is_in_stock,
  cat.name as primary_category,
  cat.slug as primary_category_slug
from products p
left join lateral (
  select pi.url, pi.alt, pi.blur_data
  from product_images pi
  where pi.product_id = p.id
  order by pi.is_primary desc, pi.position
  limit 1
) img on true
left join lateral (
  select sum(greatest(v.stock_quantity - v.reserved_quantity, 0))::int as total_available
  from product_variants v
  where v.product_id = p.id and v.is_active
) stock on true
left join lateral (
  select c.name, c.slug
  from product_categories pc
  join categories c on c.id = pc.category_id
  where pc.product_id = p.id
  order by pc.is_primary desc
  limit 1
) cat on true
where p.status = 'ACTIVE';

comment on view product_cards is 'Storefront list projection. security_invoker means RLS on products still applies.';

-- Variants at or below their low-stock threshold, for the admin dashboard.
create or replace view low_stock_variants
with (security_invoker = true)
as
select
  v.id           as variant_id,
  v.sku,
  v.title        as variant_title,
  v.stock_quantity,
  v.reserved_quantity,
  greatest(v.stock_quantity - v.reserved_quantity, 0) as available_quantity,
  v.low_stock_threshold,
  p.id           as product_id,
  p.name         as product_name,
  p.slug         as product_slug
from product_variants v
join products p on p.id = v.product_id
where v.is_active
  and p.status <> 'ARCHIVED'
  and v.stock_quantity <= v.low_stock_threshold;

-- Daily revenue for the dashboard chart.
create or replace view daily_revenue
with (security_invoker = true)
as
select
  date_trunc('day', o.paid_at)::date as day,
  count(*)                            as order_count,
  sum(o.grand_total)                  as revenue,
  sum(o.grand_total - o.refunded_total) as net_revenue,
  avg(o.grand_total)                  as average_order_value
from orders o
where o.paid_at is not null
  and o.status not in ('CANCELLED')
group by 1;

-- Sales by category.
create or replace view category_sales
with (security_invoker = true)
as
select
  c.id       as category_id,
  c.name     as category_name,
  c.slug     as category_slug,
  count(distinct o.id) as order_count,
  sum(oi.quantity)     as units_sold,
  sum(oi.line_total)   as revenue
from order_items oi
join orders o             on o.id = oi.order_id and o.paid_at is not null
join product_categories pc on pc.product_id = oi.product_id and pc.is_primary
join categories c          on c.id = pc.category_id
group by 1, 2, 3;

-- -----------------------------------------------------------------------------
-- Inventory adjustment. The only supported way to change stock — it writes the
-- ledger row and the balance in one transaction (Memory.md D-004).
-- -----------------------------------------------------------------------------
create or replace function adjust_inventory(
  p_variant_id     uuid,
  p_delta          integer,
  p_reason         inventory_reason,
  p_note           text default null,
  p_reference_type text default null,
  p_reference_id   uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  if p_delta = 0 then
    raise exception 'adjust_inventory: delta must be non-zero';
  end if;

  update product_variants
     set stock_quantity = stock_quantity + p_delta
   where id = p_variant_id
  returning stock_quantity into v_balance;

  if not found then
    raise exception 'adjust_inventory: variant % not found', p_variant_id;
  end if;

  insert into inventory_transactions
    (variant_id, delta, reason, balance_after, note, reference_type, reference_id, actor_id)
  values
    (p_variant_id, p_delta, p_reason, v_balance, p_note, p_reference_type, p_reference_id, auth.uid());

  return v_balance;
end;
$$;

revoke all on function adjust_inventory(uuid, integer, inventory_reason, text, text, uuid) from public, anon;
grant execute on function adjust_inventory(uuid, integer, inventory_reason, text, text, uuid) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Coupon validation. Returns a single row describing whether the code applies
-- and, if so, what it is worth. Called from a Server Action, never trusted
-- from the client (Agents.md rule 3).
-- -----------------------------------------------------------------------------
create or replace function validate_coupon(
  p_code     citext,
  p_subtotal numeric,
  p_profile  uuid default null
)
returns table (
  is_valid        boolean,
  coupon_id       uuid,
  reason          text,
  discount_amount numeric,
  free_shipping   boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c coupons%rowtype;
  used_by_customer integer;
  amount numeric := 0;
begin
  select * into c from coupons where code = p_code;

  if not found then
    return query select false, null::uuid, 'This code is not recognised.', 0::numeric, false;
    return;
  end if;

  if not c.is_active then
    return query select false, c.id, 'This code is no longer active.', 0::numeric, false;
    return;
  end if;

  if c.starts_at > now() then
    return query select false, c.id, 'This code is not active yet.', 0::numeric, false;
    return;
  end if;

  if c.ends_at is not null and c.ends_at < now() then
    return query select false, c.id, 'This code has expired.', 0::numeric, false;
    return;
  end if;

  if c.usage_limit is not null and c.used_count >= c.usage_limit then
    return query select false, c.id, 'This code has reached its limit.', 0::numeric, false;
    return;
  end if;

  if c.minimum_order is not null and p_subtotal < c.minimum_order then
    return query select false, c.id,
      format('Spend %s to use this code.', to_char(c.minimum_order, 'FM999,999.00')),
      0::numeric, false;
    return;
  end if;

  if c.usage_limit_per_customer is not null and p_profile is not null then
    select count(*) into used_by_customer
      from coupon_redemptions r
     where r.coupon_id = c.id and r.profile_id = p_profile;
    if used_by_customer >= c.usage_limit_per_customer then
      return query select false, c.id, 'You have already used this code.', 0::numeric, false;
      return;
    end if;
  end if;

  if c.members_only and (
       p_profile is null
       or not exists (select 1 from memberships m where m.profile_id = p_profile and m.status = 'ACTIVE')
     ) then
    return query select false, c.id, 'This code is reserved for members.', 0::numeric, false;
    return;
  end if;

  amount := case c.discount_type
    when 'PERCENTAGE'    then round(p_subtotal * c.value / 100.0, 2)
    when 'FIXED_AMOUNT'  then least(c.value, p_subtotal)
    else 0
  end;

  if c.maximum_discount is not null then
    amount := least(amount, c.maximum_discount);
  end if;

  return query select true, c.id, null::text, amount, (c.discount_type = 'FREE_SHIPPING');
end;
$$;

grant execute on function validate_coupon(citext, numeric, uuid) to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Related products: manual relations first, then same-category best sellers.
-- -----------------------------------------------------------------------------
create or replace function related_products(p_product_id uuid, p_limit integer default 4)
returns setof product_cards
language sql
stable
as $$
  with manual as (
    select pc.*, 0 as rank_group, pr.position as ord
    from product_relations pr
    join product_cards pc on pc.id = pr.related_id
    where pr.product_id = p_product_id and pr.kind = 'RELATED'
  ),
  same_category as (
    select pc.*, 1 as rank_group, 0 as ord
    from product_cards pc
    where pc.id <> p_product_id
      and pc.primary_category_slug = (
        select primary_category_slug from product_cards where id = p_product_id
      )
      and pc.id not in (select id from manual)
    order by pc.units_sold desc
    limit p_limit
  )
  select id, name, slug, subtitle, price, compare_at_price, currency, badge,
         is_featured, is_new, is_limited, is_members_only, rating_average,
         rating_count, units_sold, tags, published_at, created_at, image_url,
         image_alt, blur_data, available_quantity, is_in_stock,
         primary_category, primary_category_slug
  from (select * from manual union all select * from same_category) t
  order by rank_group, ord
  limit p_limit;
$$;

grant execute on function related_products(uuid, integer) to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Frequently bought together, derived from actual order history.
-- -----------------------------------------------------------------------------
create or replace function frequently_bought_together(p_product_id uuid, p_limit integer default 3)
returns setof product_cards
language sql
stable
as $$
  select pc.*
  from order_items a
  join order_items b on b.order_id = a.order_id and b.product_id <> a.product_id
  join product_cards pc on pc.id = b.product_id
  where a.product_id = p_product_id
  group by pc.id, pc.name, pc.slug, pc.subtitle, pc.price, pc.compare_at_price,
           pc.currency, pc.badge, pc.is_featured, pc.is_new, pc.is_limited,
           pc.is_members_only, pc.rating_average, pc.rating_count, pc.units_sold,
           pc.tags, pc.published_at, pc.created_at, pc.image_url, pc.image_alt,
           pc.blur_data, pc.available_quantity, pc.is_in_stock,
           pc.primary_category, pc.primary_category_slug
  order by count(*) desc
  limit p_limit;
$$;

grant execute on function frequently_bought_together(uuid, integer) to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Dashboard summary in one round trip.
-- -----------------------------------------------------------------------------
create or replace function admin_dashboard_summary(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
  since timestamptz := now() - make_interval(days => p_days);
begin
  if not is_staff() then
    raise exception 'admin_dashboard_summary: forbidden';
  end if;

  select jsonb_build_object(
    'revenue',        coalesce((select sum(grand_total - refunded_total) from orders where paid_at >= since), 0),
    'order_count',    (select count(*) from orders where created_at >= since),
    'customer_count', (select count(*) from profiles where role = 'CUSTOMER' and created_at >= since),
    'aov',            coalesce((select avg(grand_total) from orders where paid_at >= since), 0),
    'units_sold',     coalesce((select sum(oi.quantity) from order_items oi
                                join orders o on o.id = oi.order_id
                                where o.paid_at >= since), 0),
    'pending_orders', (select count(*) from orders where status = 'PENDING'),
    'low_stock',      (select count(*) from low_stock_variants),
    'conversion_rate', (
      select case when sessions = 0 then 0 else round(purchases::numeric / sessions * 100, 2) end
      from (
        select
          count(distinct session_id) filter (where name = 'session_start') as sessions,
          count(*) filter (where name = 'purchase') as purchases
        from analytics_events where created_at >= since
      ) s
    )
  ) into result;

  return result;
end;
$$;

grant execute on function admin_dashboard_summary(integer) to authenticated, service_role;


-- =============================================================================
-- 0008_rls.sql
-- =============================================================================

-- =============================================================================
-- 0008 · Row Level Security
--
-- Model: deny by default. Enable RLS on every table, then grant the narrowest
-- policy that satisfies a real use case. Storefront reads are public but only
-- for published rows. Customers see only their own rows. Staff privileges come
-- from the helper functions in 0002.
-- =============================================================================

alter table profiles                enable row level security;
alter table permissions             enable row level security;
alter table role_permissions        enable row level security;
alter table addresses               enable row level security;
alter table categories              enable row level security;
alter table products                enable row level security;
alter table product_categories      enable row level security;
alter table product_options         enable row level security;
alter table product_variants        enable row level security;
alter table product_images          enable row level security;
alter table collections             enable row level security;
alter table collection_products     enable row level security;
alter table product_relations       enable row level security;
alter table inventory_transactions  enable row level security;
alter table carts                   enable row level security;
alter table cart_items              enable row level security;
alter table orders                  enable row level security;
alter table order_items             enable row level security;
alter table payments                enable row level security;
alter table refunds                 enable row level security;
alter table shipments               enable row level security;
alter table shipment_items          enable row level security;
alter table shipping_methods        enable row level security;
alter table webhook_events          enable row level security;
alter table coupons                 enable row level security;
alter table coupon_products         enable row level security;
alter table coupon_categories       enable row level security;
alter table coupon_redemptions      enable row level security;
alter table reviews                 enable row level security;
alter table wishlists               enable row level security;
alter table wishlist_items          enable row level security;
alter table newsletter_subscribers  enable row level security;
alter table membership_tiers        enable row level security;
alter table memberships             enable row level security;
alter table membership_applications enable row level security;
alter table pages                   enable row level security;
alter table blog_categories         enable row level security;
alter table blog_posts              enable row level security;
alter table banners                 enable row level security;
alter table faqs                    enable row level security;
alter table testimonials            enable row level security;
alter table brand_values            enable row level security;
alter table story_sections          enable row level security;
alter table navigation_items        enable row level security;
alter table site_settings           enable row level security;
alter table notifications           enable row level security;
alter table audit_log               enable row level security;
alter table analytics_events        enable row level security;

-- -----------------------------------------------------------------------------
-- Identity
-- -----------------------------------------------------------------------------

create policy "profiles: read own" on profiles
  for select using (id = auth.uid());

create policy "profiles: staff read all" on profiles
  for select using (is_staff());

create policy "profiles: update own" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Role escalation guard: a customer updating their own row must not be able to
-- change role or status. Enforced by a trigger because RLS cannot compare to OLD.
create or replace function guard_profile_privilege()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    new.role   := old.role;
    new.status := old.status;
    new.notes  := old.notes;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_privilege
  before update on profiles
  for each row execute function guard_profile_privilege();

create policy "profiles: admin write" on profiles
  for all using (is_admin()) with check (is_admin());

create policy "permissions: staff read" on permissions
  for select using (is_staff());
create policy "permissions: admin write" on permissions
  for all using (is_admin()) with check (is_admin());

create policy "role_permissions: staff read" on role_permissions
  for select using (is_staff());
create policy "role_permissions: admin write" on role_permissions
  for all using (auth_role() = 'SUPER_ADMIN') with check (auth_role() = 'SUPER_ADMIN');

create policy "addresses: own" on addresses
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "addresses: staff read" on addresses
  for select using (is_staff());

-- -----------------------------------------------------------------------------
-- Catalog — public read of published rows, commerce roles write
-- -----------------------------------------------------------------------------

create policy "categories: public read active" on categories
  for select using (is_active or is_staff());
create policy "categories: manage" on categories
  for all using (can_manage_commerce()) with check (can_manage_commerce());

create policy "products: public read active" on products
  for select using (status = 'ACTIVE' or is_staff());
create policy "products: manage" on products
  for all using (can_manage_commerce()) with check (can_manage_commerce());

create policy "product_categories: public read" on product_categories
  for select using (true);
create policy "product_categories: manage" on product_categories
  for all using (can_manage_commerce()) with check (can_manage_commerce());

create policy "product_options: public read" on product_options
  for select using (true);
create policy "product_options: manage" on product_options
  for all using (can_manage_commerce()) with check (can_manage_commerce());

create policy "product_variants: public read active" on product_variants
  for select using (
    is_staff() or exists (
      select 1 from products p where p.id = product_id and p.status = 'ACTIVE'
    )
  );
create policy "product_variants: manage" on product_variants
  for all using (can_manage_commerce()) with check (can_manage_commerce());

create policy "product_images: public read" on product_images
  for select using (
    is_staff() or exists (
      select 1 from products p where p.id = product_id and p.status = 'ACTIVE'
    )
  );
create policy "product_images: manage" on product_images
  for all using (can_manage_commerce()) with check (can_manage_commerce());

create policy "collections: public read active" on collections
  for select using (is_active or is_staff());
create policy "collections: manage" on collections
  for all using (can_manage_commerce()) with check (can_manage_commerce());

create policy "collection_products: public read" on collection_products
  for select using (true);
create policy "collection_products: manage" on collection_products
  for all using (can_manage_commerce()) with check (can_manage_commerce());

create policy "product_relations: public read" on product_relations
  for select using (true);
create policy "product_relations: manage" on product_relations
  for all using (can_manage_commerce()) with check (can_manage_commerce());

-- -----------------------------------------------------------------------------
-- Inventory — staff only, ledger is append-only even for staff
-- -----------------------------------------------------------------------------

create policy "inventory_tx: staff read" on inventory_transactions
  for select using (is_staff());
create policy "inventory_tx: commerce insert" on inventory_transactions
  for insert with check (can_manage_commerce());
-- Deliberately no UPDATE or DELETE policy: the ledger is immutable.

-- -----------------------------------------------------------------------------
-- Carts — owned by a profile, or by an anonymous session token.
-- Guest carts are addressed by an unguessable token held in an httpOnly cookie
-- and are only ever reached through Server Actions using the service role, so
-- no anon policy is granted here.
-- -----------------------------------------------------------------------------

create policy "carts: own" on carts
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "carts: staff read" on carts
  for select using (is_staff());

create policy "cart_items: own" on cart_items
  for all using (
    exists (select 1 from carts c where c.id = cart_id and c.profile_id = auth.uid())
  ) with check (
    exists (select 1 from carts c where c.id = cart_id and c.profile_id = auth.uid())
  );
create policy "cart_items: staff read" on cart_items
  for select using (is_staff());

-- -----------------------------------------------------------------------------
-- Orders — customers read their own; only the service role writes.
-- Order creation happens in a Server Action / Stripe webhook, never client-side.
-- -----------------------------------------------------------------------------

create policy "orders: read own" on orders
  for select using (profile_id = auth.uid());
create policy "orders: staff read" on orders
  for select using (is_staff());
create policy "orders: commerce write" on orders
  for all using (can_manage_commerce()) with check (can_manage_commerce());

create policy "order_items: read own" on order_items
  for select using (
    exists (select 1 from orders o where o.id = order_id and o.profile_id = auth.uid())
  );
create policy "order_items: staff read" on order_items
  for select using (is_staff());
create policy "order_items: commerce write" on order_items
  for all using (can_manage_commerce()) with check (can_manage_commerce());

create policy "payments: read own" on payments
  for select using (
    exists (select 1 from orders o where o.id = order_id and o.profile_id = auth.uid())
  );
create policy "payments: admin read" on payments
  for select using (is_admin());
create policy "payments: admin write" on payments
  for all using (is_admin()) with check (is_admin());

create policy "refunds: read own" on refunds
  for select using (
    exists (select 1 from orders o where o.id = order_id and o.profile_id = auth.uid())
  );
create policy "refunds: admin all" on refunds
  for all using (is_admin()) with check (is_admin());

create policy "shipments: read own" on shipments
  for select using (
    exists (select 1 from orders o where o.id = order_id and o.profile_id = auth.uid())
  );
create policy "shipments: staff all" on shipments
  for all using (can_manage_commerce()) with check (can_manage_commerce());

create policy "shipment_items: read own" on shipment_items
  for select using (
    exists (
      select 1 from shipments s join orders o on o.id = s.order_id
      where s.id = shipment_id and o.profile_id = auth.uid()
    )
  );
create policy "shipment_items: staff all" on shipment_items
  for all using (can_manage_commerce()) with check (can_manage_commerce());

create policy "shipping_methods: public read active" on shipping_methods
  for select using (is_active or is_staff());
create policy "shipping_methods: manage" on shipping_methods
  for all using (can_manage_commerce()) with check (can_manage_commerce());

-- webhook_events: service role only. No policies at all — RLS denies everyone
-- else by default, and the service role bypasses RLS.

-- -----------------------------------------------------------------------------
-- Marketing
-- -----------------------------------------------------------------------------

-- Coupon codes are NOT publicly listable — that would leak every discount.
-- Validation goes through validate_coupon(), which is SECURITY DEFINER.
create policy "coupons: staff read" on coupons
  for select using (is_staff());
create policy "coupons: manage" on coupons
  for all using (can_manage_commerce()) with check (can_manage_commerce());

create policy "coupon_products: staff read" on coupon_products
  for select using (is_staff());
create policy "coupon_products: manage" on coupon_products
  for all using (can_manage_commerce()) with check (can_manage_commerce());

create policy "coupon_categories: staff read" on coupon_categories
  for select using (is_staff());
create policy "coupon_categories: manage" on coupon_categories
  for all using (can_manage_commerce()) with check (can_manage_commerce());

create policy "coupon_redemptions: read own" on coupon_redemptions
  for select using (profile_id = auth.uid());
create policy "coupon_redemptions: staff read" on coupon_redemptions
  for select using (is_staff());

create policy "reviews: public read approved" on reviews
  for select using (status = 'APPROVED' or profile_id = auth.uid() or is_staff());
create policy "reviews: customer insert own" on reviews
  for insert with check (profile_id = auth.uid());
create policy "reviews: customer update own pending" on reviews
  for update using (profile_id = auth.uid() and status = 'PENDING')
          with check (profile_id = auth.uid() and status = 'PENDING');
create policy "reviews: staff moderate" on reviews
  for all using (can_manage_content()) with check (can_manage_content());

create policy "wishlists: own" on wishlists
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "wishlists: public shared" on wishlists
  for select using (is_public);

create policy "wishlist_items: own" on wishlist_items
  for all using (
    exists (select 1 from wishlists w where w.id = wishlist_id and w.profile_id = auth.uid())
  ) with check (
    exists (select 1 from wishlists w where w.id = wishlist_id and w.profile_id = auth.uid())
  );
create policy "wishlist_items: public shared" on wishlist_items
  for select using (
    exists (select 1 from wishlists w where w.id = wishlist_id and w.is_public)
  );

-- Anyone may subscribe; nobody but staff may read the list.
create policy "newsletter: anyone subscribe" on newsletter_subscribers
  for insert with check (true);
create policy "newsletter: staff read" on newsletter_subscribers
  for select using (is_staff());
create policy "newsletter: staff manage" on newsletter_subscribers
  for all using (is_admin()) with check (is_admin());

create policy "membership_tiers: public read active" on membership_tiers
  for select using (is_active or is_staff());
create policy "membership_tiers: manage" on membership_tiers
  for all using (is_admin()) with check (is_admin());

create policy "memberships: read own" on memberships
  for select using (profile_id = auth.uid());
create policy "memberships: staff read" on memberships
  for select using (is_staff());
create policy "memberships: admin write" on memberships
  for all using (is_admin()) with check (is_admin());

create policy "membership_applications: anyone apply" on membership_applications
  for insert with check (true);
create policy "membership_applications: staff read" on membership_applications
  for select using (is_staff());
create policy "membership_applications: staff manage" on membership_applications
  for all using (is_admin()) with check (is_admin());

-- -----------------------------------------------------------------------------
-- CMS — public reads published content, editors write
-- -----------------------------------------------------------------------------

create policy "pages: public read published" on pages
  for select using (
    (status = 'PUBLISHED' and (published_at is null or published_at <= now())) or is_staff()
  );
create policy "pages: manage" on pages
  for all using (can_manage_content()) with check (can_manage_content());

create policy "blog_categories: public read" on blog_categories
  for select using (true);
create policy "blog_categories: manage" on blog_categories
  for all using (can_manage_content()) with check (can_manage_content());

create policy "blog_posts: public read published" on blog_posts
  for select using (
    (status = 'PUBLISHED' and (published_at is null or published_at <= now())) or is_staff()
  );
create policy "blog_posts: manage" on blog_posts
  for all using (can_manage_content()) with check (can_manage_content());

create policy "banners: public read live" on banners
  for select using (
    is_staff() or (
      is_active
      and (starts_at is null or starts_at <= now())
      and (ends_at   is null or ends_at   >= now())
    )
  );
create policy "banners: manage" on banners
  for all using (can_manage_content()) with check (can_manage_content());

create policy "faqs: public read active" on faqs
  for select using (is_active or is_staff());
create policy "faqs: manage" on faqs
  for all using (can_manage_content()) with check (can_manage_content());

create policy "testimonials: public read active" on testimonials
  for select using (is_active or is_staff());
create policy "testimonials: manage" on testimonials
  for all using (can_manage_content()) with check (can_manage_content());

create policy "brand_values: public read active" on brand_values
  for select using (is_active or is_staff());
create policy "brand_values: manage" on brand_values
  for all using (can_manage_content()) with check (can_manage_content());

create policy "story_sections: public read active" on story_sections
  for select using (is_active or is_staff());
create policy "story_sections: manage" on story_sections
  for all using (can_manage_content()) with check (can_manage_content());

create policy "navigation_items: public read active" on navigation_items
  for select using (is_active or is_staff());
create policy "navigation_items: manage" on navigation_items
  for all using (can_manage_content()) with check (can_manage_content());

-- Only settings explicitly flagged public are readable by the storefront.
create policy "site_settings: public read public" on site_settings
  for select using (is_public or is_staff());
create policy "site_settings: admin write" on site_settings
  for all using (is_admin()) with check (is_admin());

create policy "notifications: read own" on notifications
  for select using (profile_id = auth.uid() or (audience = 'STAFF' and is_staff()));
create policy "notifications: update own" on notifications
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "notifications: staff manage" on notifications
  for all using (is_admin()) with check (is_admin());

-- Audit log is append-only and admin-readable.
create policy "audit_log: admin read" on audit_log
  for select using (is_admin());
create policy "audit_log: staff insert" on audit_log
  for insert with check (is_staff());

-- Analytics: write-only from the storefront, staff-readable.
create policy "analytics_events: anyone insert" on analytics_events
  for insert with check (true);
create policy "analytics_events: staff read" on analytics_events
  for select using (is_staff());

-- -----------------------------------------------------------------------------
-- Grants. RLS decides rows; grants decide tables. Both must allow.
-- -----------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant insert on newsletter_subscribers, membership_applications, analytics_events to anon;
grant usage, select on all sequences in schema public to authenticated;

-- Revoke the columns that must never leave the server, even for staff reads
-- performed with an anon key.
revoke select (cost_price) on products from anon;


-- =============================================================================
-- 0009_cart_and_checkout.sql
-- =============================================================================

-- =============================================================================
-- 0009 · Phase 2 — cart pricing, order creation, payment settlement
--
-- Every number a customer is charged is computed here, in the database, from
-- rows the client cannot influence (Agents.md rule 3). The client sends
-- identifiers and quantities; it never sends a price, a discount or a total.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Transactional email audit trail.
-- -----------------------------------------------------------------------------
create table if not exists email_log (
  id          uuid primary key default gen_random_uuid(),
  template    text not null,
  recipient   citext not null,
  subject     text not null,
  status      text not null default 'SENT',      -- SENT | FAILED | SKIPPED
  provider_id text,
  error       text,
  order_id    uuid references orders(id) on delete set null,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists email_log_created_idx   on email_log (created_at desc);
create index if not exists email_log_recipient_idx on email_log (recipient);
create index if not exists email_log_order_idx     on email_log (order_id);

alter table email_log enable row level security;

drop policy if exists "email_log: admin read" on email_log;
create policy "email_log: admin read" on email_log
  for select using (is_admin());

comment on table email_log is
  'Every transactional send, including SKIPPED when no provider is configured. Written by the service role only.';

-- -----------------------------------------------------------------------------
-- Guest carts are addressed by an unguessable token in an httpOnly cookie and
-- reached only through Server Actions running as the service role, so they have
-- no anon policy by design. This index keeps that lookup cheap.
-- -----------------------------------------------------------------------------
create index if not exists carts_session_token_idx
  on carts (session_token) where session_token is not null;

-- Which cart became this order. Without it, settlement has to guess which cart
-- to clear by matching variant ids — and for two guests holding the same piece
-- that guess is wrong, clearing a stranger's bag.
alter table orders add column if not exists cart_id uuid references carts(id) on delete set null;

-- -----------------------------------------------------------------------------
-- ensure_cart — idempotently return the caller's cart id.
-- Exactly one of p_profile_id / p_session_token must be supplied.
-- -----------------------------------------------------------------------------
create or replace function ensure_cart(
  p_profile_id    uuid default null,
  p_session_token text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_cart_id uuid;
begin
  if p_profile_id is null and p_session_token is null then
    raise exception 'ensure_cart: one of profile_id or session_token is required';
  end if;

  if p_profile_id is not null then
    select id into v_cart_id from carts where profile_id = p_profile_id;
    if v_cart_id is null then
      insert into carts (profile_id) values (p_profile_id) returning id into v_cart_id;
    end if;
  else
    select id into v_cart_id from carts where session_token = p_session_token;
    if v_cart_id is null then
      insert into carts (session_token) values (p_session_token) returning id into v_cart_id;
    end if;
  end if;

  update carts set expires_at = now() + interval '30 days' where id = v_cart_id;
  return v_cart_id;
end;
$fn$;

revoke all on function ensure_cart(uuid, text) from public, anon;
grant execute on function ensure_cart(uuid, text) to service_role;

-- -----------------------------------------------------------------------------
-- merge_guest_cart — called once, on sign-in. Quantities add.
-- -----------------------------------------------------------------------------
create or replace function merge_guest_cart(p_session_token text, p_profile_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_guest_id  uuid;
  v_target_id uuid;
begin
  select id into v_guest_id from carts where session_token = p_session_token;
  v_target_id := ensure_cart(p_profile_id, null);

  if v_guest_id is null or v_guest_id = v_target_id then
    return v_target_id;
  end if;

  insert into cart_items (cart_id, variant_id, quantity)
  select v_target_id, gi.variant_id, gi.quantity
    from cart_items gi
   where gi.cart_id = v_guest_id
  on conflict (cart_id, variant_id) do update
    set quantity = least(cart_items.quantity + excluded.quantity, 99);

  -- Carry a guest-applied coupon over only if the customer has none.
  update carts t
     set coupon_id = g.coupon_id
    from carts g
   where t.id = v_target_id
     and g.id = v_guest_id
     and t.coupon_id is null
     and g.coupon_id is not null;

  delete from carts where id = v_guest_id;
  return v_target_id;
end;
$fn$;

revoke all on function merge_guest_cart(text, uuid) from public, anon;
grant execute on function merge_guest_cart(text, uuid) to service_role;

-- -----------------------------------------------------------------------------
-- validate_coupon, replacing the 0007 version.
--
-- New: p_eligible_subtotal. A PRODUCT- or CATEGORY-scoped coupon discounts only
-- the qualifying lines, but its minimum_order still tests the whole order.
-- Passing null keeps the old behaviour, so 3-argument callers are unaffected.
-- -----------------------------------------------------------------------------
drop function if exists validate_coupon(citext, numeric, uuid);

create or replace function validate_coupon(
  p_code              citext,
  p_subtotal          numeric,
  p_profile           uuid default null,
  p_eligible_subtotal numeric default null
)
returns table (
  is_valid        boolean,
  coupon_id       uuid,
  reason          text,
  discount_amount numeric,
  free_shipping   boolean
)
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  c coupons%rowtype;
  used_by_customer integer;
  base   numeric := coalesce(p_eligible_subtotal, p_subtotal);
  amount numeric := 0;
begin
  select * into c from coupons where code = p_code;

  if not found then
    return query select false, null::uuid, 'This code is not recognised.', 0::numeric, false;
    return;
  end if;

  if not c.is_active then
    return query select false, c.id, 'This code is no longer active.', 0::numeric, false;
    return;
  end if;

  if c.starts_at > now() then
    return query select false, c.id, 'This code is not active yet.', 0::numeric, false;
    return;
  end if;

  if c.ends_at is not null and c.ends_at < now() then
    return query select false, c.id, 'This code has expired.', 0::numeric, false;
    return;
  end if;

  if c.usage_limit is not null and c.used_count >= c.usage_limit then
    return query select false, c.id, 'This code has reached its limit.', 0::numeric, false;
    return;
  end if;

  if c.minimum_order is not null and p_subtotal < c.minimum_order then
    return query select false, c.id,
      format('Spend %s to use this code.', to_char(c.minimum_order, 'FM999,999.00')),
      0::numeric, false;
    return;
  end if;

  if c.usage_limit_per_customer is not null and p_profile is not null then
    select count(*) into used_by_customer
      from coupon_redemptions r
     where r.coupon_id = c.id and r.profile_id = p_profile;
    if used_by_customer >= c.usage_limit_per_customer then
      return query select false, c.id, 'You have already used this code.', 0::numeric, false;
      return;
    end if;
  end if;

  if c.members_only and (
       p_profile is null
       or not exists (
         select 1 from memberships m
          where m.profile_id = p_profile and m.status = 'ACTIVE'
       )
     ) then
    return query select false, c.id, 'This code is reserved for members.', 0::numeric, false;
    return;
  end if;

  -- A scoped coupon with nothing qualifying in the basket.
  if c.scope <> 'ORDER' and c.discount_type <> 'FREE_SHIPPING' and base <= 0 then
    return query select false, c.id,
      'This code does not apply to anything in your bag.', 0::numeric, false;
    return;
  end if;

  amount := case c.discount_type
    when 'PERCENTAGE'   then round(base * c.value / 100.0, 2)
    when 'FIXED_AMOUNT' then least(c.value, base)
    else 0
  end;

  if c.maximum_discount is not null then
    amount := least(amount, c.maximum_discount);
  end if;

  return query select true, c.id, null::text, amount, (c.discount_type = 'FREE_SHIPPING');
end;
$fn$;

grant execute on function validate_coupon(citext, numeric, uuid, numeric) to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- price_cart — THE pricing engine.
--
-- One function computes what the cart page shows, what the checkout summary
-- shows, and what the order is written with. There is no second implementation
-- in TypeScript to drift away from it.
-- -----------------------------------------------------------------------------
create or replace function price_cart(
  p_cart_id            uuid,
  p_shipping_method_id uuid default null,
  p_coupon_code        citext default null,
  p_profile_id         uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_currency        char(3) := 'USD';
  v_lines           jsonb   := '[]'::jsonb;
  v_subtotal        numeric := 0;
  v_compare_total   numeric := 0;
  v_item_count      integer := 0;
  v_code            citext;
  v_coupon          record;
  v_eligible        numeric := 0;
  v_scope           discount_scope;
  v_coupon_id       uuid;
  v_discount        numeric := 0;
  v_free_shipping   boolean := false;
  v_coupon_valid    boolean := false;
  v_coupon_reason   text;
  v_shipping_name   text;
  v_shipping_price  numeric;
  v_shipping_free_over numeric;
  v_shipping        numeric := 0;
  v_tax_rate        numeric := 0;
  v_tax             numeric := 0;
  v_taxable         numeric := 0;
  v_grand           numeric := 0;
begin
  if p_cart_id is null then
    return jsonb_build_object('exists', false);
  end if;

  select currency, coalesce(p_coupon_code, (select code from coupons where id = c.coupon_id))
    into v_currency, v_code
    from carts c where c.id = p_cart_id;

  if not found then
    return jsonb_build_object('exists', false);
  end if;

  -- ---- Lines. Price always resolves live: variant override, else product. ----
  select
    coalesce(jsonb_agg(l.line order by l.added_at), '[]'::jsonb),
    coalesce(sum(l.line_total), 0),
    coalesce(sum(l.compare_total), 0),
    coalesce(sum(l.quantity), 0)
  into v_lines, v_subtotal, v_compare_total, v_item_count
  from (
    select
      ci.added_at,
      ci.quantity,
      round(coalesce(v.price, p.price) * ci.quantity, 2) as line_total,
      round(coalesce(v.compare_at_price, p.compare_at_price, coalesce(v.price, p.price)) * ci.quantity, 2)
        as compare_total,
      jsonb_build_object(
        'item_id',         ci.id,
        'variant_id',      v.id,
        'product_id',      p.id,
        'name',            p.name,
        'slug',            p.slug,
        'variant_title',   v.title,
        'sku',             v.sku,
        'image_url',       coalesce(v.image_url, img.url),
        'image_alt',       coalesce(img.alt, p.name),
        'unit_price',      coalesce(v.price, p.price),
        'compare_at_price', coalesce(v.compare_at_price, p.compare_at_price),
        'quantity',        ci.quantity,
        'line_total',      round(coalesce(v.price, p.price) * ci.quantity, 2),
        'available',       greatest(v.stock_quantity - v.reserved_quantity, 0),
        'is_available',    (v.is_active and p.status = 'ACTIVE'
                            and greatest(v.stock_quantity - v.reserved_quantity, 0) >= ci.quantity),
        'in_stock',        greatest(v.stock_quantity - v.reserved_quantity, 0) > 0
      ) as line
    from cart_items ci
    join product_variants v on v.id = ci.variant_id
    join products p         on p.id = v.product_id
    left join lateral (
      select pi.url, pi.alt from product_images pi
      where pi.product_id = p.id
      order by pi.is_primary desc, pi.position
      limit 1
    ) img on true
    where ci.cart_id = p_cart_id
  ) l;

  -- ---- Coupon -------------------------------------------------------------
  if v_code is not null then
    select id, scope into v_coupon_id, v_scope from coupons where code = v_code;

    if v_scope = 'PRODUCT' then
      select coalesce(sum(round(coalesce(v.price, p.price) * ci.quantity, 2)), 0)
        into v_eligible
        from cart_items ci
        join product_variants v on v.id = ci.variant_id
        join products p         on p.id = v.product_id
        join coupon_products cp on cp.product_id = p.id and cp.coupon_id = v_coupon_id
       where ci.cart_id = p_cart_id;
    elsif v_scope = 'CATEGORY' then
      select coalesce(sum(round(coalesce(v.price, p.price) * ci.quantity, 2)), 0)
        into v_eligible
        from cart_items ci
        join product_variants v    on v.id = ci.variant_id
        join products p            on p.id = v.product_id
       where ci.cart_id = p_cart_id
         and exists (
           select 1 from product_categories pc
             join coupon_categories cc
               on cc.category_id = pc.category_id and cc.coupon_id = v_coupon_id
            where pc.product_id = p.id
         );
    else
      v_eligible := v_subtotal;
    end if;

    select * into v_coupon
      from validate_coupon(v_code, v_subtotal, p_profile_id, v_eligible);

    v_coupon_valid  := coalesce(v_coupon.is_valid, false);
    v_coupon_reason := v_coupon.reason;
    if v_coupon_valid then
      v_discount      := least(coalesce(v_coupon.discount_amount, 0), v_subtotal);
      v_free_shipping := coalesce(v_coupon.free_shipping, false);
    end if;
  end if;

  -- ---- Shipping -----------------------------------------------------------
  if p_shipping_method_id is not null then
    select name, price, free_over
      into v_shipping_name, v_shipping_price, v_shipping_free_over
      from shipping_methods
     where id = p_shipping_method_id and is_active;

    if v_shipping_name is not null then
      v_shipping := v_shipping_price;
      if v_shipping_free_over is not null
         and (v_subtotal - v_discount) >= v_shipping_free_over then
        v_shipping := 0;
      end if;
      if v_free_shipping then
        v_shipping := 0;
      end if;
    end if;
  end if;

  -- ---- Tax ----------------------------------------------------------------
  select coalesce((value #>> '{}')::numeric, 0) into v_tax_rate
    from site_settings where key = 'commerce.tax_rate';
  v_tax_rate := coalesce(v_tax_rate, 0);

  v_taxable := greatest(v_subtotal - v_discount, 0);
  v_tax     := round(v_taxable * v_tax_rate, 2);
  v_grand   := round(v_taxable + v_shipping + v_tax, 2);

  return jsonb_build_object(
    'exists',          true,
    'cart_id',         p_cart_id,
    'currency',        v_currency,
    'lines',           v_lines,
    'item_count',      v_item_count,
    'subtotal',        v_subtotal,
    'compare_total',   v_compare_total,
    'savings',         greatest(v_compare_total - v_subtotal, 0),
    'coupon_code',     v_code,
    'coupon_id',       case when v_coupon_valid then v_coupon_id else null end,
    'coupon_valid',    v_coupon_valid,
    'coupon_reason',   v_coupon_reason,
    'discount_total',  v_discount,
    'free_shipping',   v_free_shipping,
    'shipping_method_id', p_shipping_method_id,
    'shipping_method',    v_shipping_name,
    'shipping_total',  v_shipping,
    'tax_rate',        v_tax_rate,
    'tax_total',       v_tax,
    'grand_total',     v_grand,
    'has_unavailable', exists (
      select 1
        from jsonb_array_elements(v_lines) e
       where (e->>'is_available')::boolean is not true
    )
  );
end;
$fn$;

revoke all on function price_cart(uuid, uuid, citext, uuid) from public, anon;
grant execute on function price_cart(uuid, uuid, citext, uuid) to service_role;

-- -----------------------------------------------------------------------------
-- create_order_from_cart
--
-- Re-prices from scratch, locks every variant, reserves stock, and snapshots
-- the lines onto the order. The order is PENDING until Stripe says otherwise.
-- -----------------------------------------------------------------------------
create or replace function create_order_from_cart(
  p_cart_id            uuid,
  p_email              citext,
  p_shipping_address   jsonb,
  p_billing_address    jsonb default null,
  p_shipping_method_id uuid default null,
  p_coupon_code        citext default null,
  p_phone              text default null,
  p_customer_note      text default null,
  p_profile_id         uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_pricing  jsonb;
  v_line     jsonb;
  v_order_id uuid;
  v_number   text;
  v_avail    integer;
  v_name     text;
begin
  -- Lock every variant in the cart, in a deterministic order, before reading
  -- availability. Two checkouts racing for the last piece must serialise.
  perform 1
    from cart_items ci
    join product_variants v on v.id = ci.variant_id
   where ci.cart_id = p_cart_id
   order by v.id
     for update of v;

  v_pricing := price_cart(p_cart_id, p_shipping_method_id, p_coupon_code, p_profile_id);

  if not coalesce((v_pricing->>'exists')::boolean, false) then
    raise exception 'create_order_from_cart: cart % not found', p_cart_id
      using errcode = 'no_data_found';
  end if;

  if coalesce((v_pricing->>'item_count')::integer, 0) = 0 then
    raise exception 'Your bag is empty.' using errcode = 'check_violation';
  end if;

  -- Re-check availability under the lock.
  for v_line in select * from jsonb_array_elements(v_pricing->'lines') loop
    select greatest(v.stock_quantity - v.reserved_quantity, 0), p.name
      into v_avail, v_name
      from product_variants v
      join products p on p.id = v.product_id
     where v.id = (v_line->>'variant_id')::uuid;

    if v_avail < (v_line->>'quantity')::integer then
      raise exception '% is no longer available in that quantity.', coalesce(v_name, 'An item')
        using errcode = 'check_violation';
    end if;
  end loop;

  insert into orders (
    cart_id, profile_id, email, phone, currency,
    subtotal, discount_total, shipping_total, tax_total, grand_total,
    coupon_id, coupon_code, shipping_method,
    shipping_address, billing_address, customer_note,
    status, payment_status, placed_at
  ) values (
    p_cart_id,
    p_profile_id,
    p_email,
    p_phone,
    v_pricing->>'currency',
    (v_pricing->>'subtotal')::numeric,
    (v_pricing->>'discount_total')::numeric,
    (v_pricing->>'shipping_total')::numeric,
    (v_pricing->>'tax_total')::numeric,
    (v_pricing->>'grand_total')::numeric,
    nullif(v_pricing->>'coupon_id', '')::uuid,
    case when coalesce((v_pricing->>'coupon_valid')::boolean, false)
         then v_pricing->>'coupon_code' end,
    v_pricing->>'shipping_method',
    p_shipping_address,
    coalesce(p_billing_address, p_shipping_address),
    p_customer_note,
    'PENDING',
    'PENDING',
    now()
  )
  returning id, order_number into v_order_id, v_number;

  -- Snapshot the lines (Memory.md D-008).
  insert into order_items (
    order_id, variant_id, product_id, product_name, variant_title,
    sku, image_url, unit_price, quantity, line_total
  )
  select
    v_order_id,
    (e->>'variant_id')::uuid,
    (e->>'product_id')::uuid,
    e->>'name',
    e->>'variant_title',
    e->>'sku',
    e->>'image_url',
    (e->>'unit_price')::numeric,
    (e->>'quantity')::integer,
    (e->>'line_total')::numeric
  from jsonb_array_elements(v_pricing->'lines') e;

  -- Reserve stock so the piece cannot be sold twice while payment is in flight.
  update product_variants v
     set reserved_quantity = v.reserved_quantity + oi.quantity
    from order_items oi
   where oi.order_id = v_order_id and oi.variant_id = v.id;

  insert into inventory_transactions
    (variant_id, delta, reason, balance_after, reference_type, reference_id, note, actor_id)
  select oi.variant_id, -oi.quantity, 'RESERVATION', v.stock_quantity,
         'order', v_order_id, 'Reserved at checkout for ' || v_number, p_profile_id
    from order_items oi
    join product_variants v on v.id = oi.variant_id
   where oi.order_id = v_order_id;

  return jsonb_build_object(
    'order_id',     v_order_id,
    'order_number', v_number,
    'grand_total',  (v_pricing->>'grand_total')::numeric,
    'currency',     v_pricing->>'currency',
    'email',        p_email
  );
end;
$fn$;

revoke all on function create_order_from_cart(uuid, citext, jsonb, jsonb, uuid, citext, text, text, uuid)
  from public, anon;
grant execute on function create_order_from_cart(uuid, citext, jsonb, jsonb, uuid, citext, text, text, uuid)
  to service_role;

-- -----------------------------------------------------------------------------
-- release_order_reservations — undo what create_order_from_cart reserved.
-- Safe to call twice: reservations_released guards it.
-- -----------------------------------------------------------------------------
create or replace function release_order_reservations(p_order_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  update product_variants v
     set reserved_quantity = greatest(v.reserved_quantity - oi.quantity, 0)
    from order_items oi
   where oi.order_id = p_order_id and oi.variant_id = v.id;

  insert into inventory_transactions
    (variant_id, delta, reason, balance_after, reference_type, reference_id, note)
  select oi.variant_id, oi.quantity, 'RELEASE', v.stock_quantity,
         'order', p_order_id, coalesce(p_note, 'Reservation released')
    from order_items oi
    join product_variants v on v.id = oi.variant_id
   where oi.order_id = p_order_id;
end;
$fn$;

revoke all on function release_order_reservations(uuid, text) from public, anon;
grant execute on function release_order_reservations(uuid, text) to service_role;

-- -----------------------------------------------------------------------------
-- mark_order_paid — called only from the verified Stripe webhook.
-- Idempotent: a replayed event returns already_paid and changes nothing.
-- -----------------------------------------------------------------------------
create or replace function mark_order_paid(
  p_order_id           uuid,
  p_payment_intent_id  text default null,
  p_checkout_session_id text default null,
  p_amount             numeric default null,
  p_card_brand         text default null,
  p_card_last4         text default null,
  p_charge_id          text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  o orders%rowtype;
begin
  select * into o from orders where id = p_order_id for update;

  if not found then
    raise exception 'mark_order_paid: order % not found', p_order_id;
  end if;

  if o.payment_status = 'PAID' then
    return jsonb_build_object('order_number', o.order_number, 'already_paid', true);
  end if;

  update orders
     set status         = 'PAID',
         payment_status = 'PAID',
         paid_at        = coalesce(paid_at, now()),
         placed_at      = coalesce(placed_at, now())
   where id = p_order_id;

  -- Checkout already wrote a PENDING payment row carrying the session id, and
  -- both stripe_checkout_session_id and stripe_payment_intent_id are unique.
  -- Settle by updating that row; insert only if checkout never got that far.
  update payments
     set status                   = 'PAID',
         stripe_payment_intent_id = coalesce(p_payment_intent_id, stripe_payment_intent_id),
         stripe_charge_id         = coalesce(p_charge_id, stripe_charge_id),
         stripe_checkout_session_id = coalesce(p_checkout_session_id, stripe_checkout_session_id),
         amount                   = coalesce(p_amount, amount),
         card_brand               = coalesce(p_card_brand, card_brand),
         card_last4               = coalesce(left(p_card_last4, 4), card_last4),
         processed_at             = now()
   where order_id = p_order_id
     and (
       stripe_checkout_session_id is not distinct from p_checkout_session_id
       or stripe_payment_intent_id is not distinct from p_payment_intent_id
       or status = 'PENDING'
     );

  if not found then
    insert into payments (
      order_id, provider, stripe_payment_intent_id, stripe_checkout_session_id,
      stripe_charge_id, status, amount, currency, card_brand, card_last4, processed_at
    ) values (
      p_order_id, 'stripe', p_payment_intent_id, p_checkout_session_id,
      p_charge_id, 'PAID', coalesce(p_amount, o.grand_total), o.currency,
      p_card_brand, left(p_card_last4, 4), now()
    );
  end if;

  -- Reservation becomes a sale.
  update product_variants v
     set reserved_quantity = greatest(v.reserved_quantity - oi.quantity, 0),
         stock_quantity    = v.stock_quantity - oi.quantity
    from order_items oi
   where oi.order_id = p_order_id and oi.variant_id = v.id;

  insert into inventory_transactions
    (variant_id, delta, reason, balance_after, reference_type, reference_id, note)
  select oi.variant_id, -oi.quantity, 'SALE', v.stock_quantity,
         'order', p_order_id, 'Sold on ' || o.order_number
    from order_items oi
    join product_variants v on v.id = oi.variant_id
   where oi.order_id = p_order_id;

  update products p
     set units_sold = p.units_sold + agg.qty
    from (
      select product_id, sum(quantity) as qty
        from order_items where order_id = p_order_id and product_id is not null
       group by product_id
    ) agg
   where p.id = agg.product_id;

  -- Coupon accounting.
  if o.coupon_id is not null then
    update coupons set used_count = used_count + 1 where id = o.coupon_id;
    insert into coupon_redemptions (coupon_id, order_id, profile_id, amount)
    values (o.coupon_id, p_order_id, o.profile_id, o.discount_total)
    on conflict (coupon_id, order_id) do nothing;
  end if;

  -- Lifetime spend, for membership tiers.
  if o.profile_id is not null then
    update memberships
       set lifetime_spend = lifetime_spend + o.grand_total
     where profile_id = o.profile_id;
  end if;

  insert into notifications (audience, type, title, body, href)
  values (
    'STAFF', 'order.placed',
    'New order ' || o.order_number,
    o.email || ' · ' || to_char(o.grand_total, 'FM999,999.00') || ' ' || o.currency,
    '/admin/orders/' || p_order_id
  );

  -- Low-stock warnings, one per variant that just crossed its threshold.
  insert into notifications (audience, type, title, body, href)
  select 'STAFF', 'inventory.low',
         'Low stock: ' || p.name,
         v.title || ' — ' || v.stock_quantity || ' left',
         '/admin/inventory'
    from order_items oi
    join product_variants v on v.id = oi.variant_id
    join products p on p.id = v.product_id
   where oi.order_id = p_order_id
     and v.stock_quantity <= v.low_stock_threshold;

  -- The cart has done its job. Exactly the one recorded on the order.
  if o.cart_id is not null then
    delete from carts where id = o.cart_id;
  end if;

  return jsonb_build_object(
    'order_number', o.order_number,
    'already_paid', false,
    'email',        o.email,
    'grand_total',  o.grand_total
  );
end;
$fn$;

revoke all on function mark_order_paid(uuid, text, text, numeric, text, text, text) from public, anon;
grant execute on function mark_order_paid(uuid, text, text, numeric, text, text, text) to service_role;

-- -----------------------------------------------------------------------------
-- mark_order_payment_failed — releases the reservation so stock returns to sale.
-- -----------------------------------------------------------------------------
create or replace function mark_order_payment_failed(
  p_order_id uuid,
  p_reason   text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  o orders%rowtype;
begin
  select * into o from orders where id = p_order_id for update;
  if not found or o.payment_status = 'PAID' then
    return;
  end if;

  perform release_order_reservations(p_order_id, 'Payment failed');

  update orders
     set payment_status = 'FAILED',
         status         = 'CANCELLED',
         cancelled_at   = now(),
         cancel_reason  = coalesce(p_reason, 'Payment was not completed')
   where id = p_order_id;

  insert into notifications (audience, type, title, body, href)
  values (
    'STAFF', 'payment.failed',
    'Payment failed on ' || o.order_number,
    coalesce(p_reason, 'The customer did not complete payment.'),
    '/admin/orders/' || p_order_id
  );
end;
$fn$;

revoke all on function mark_order_payment_failed(uuid, text) from public, anon;
grant execute on function mark_order_payment_failed(uuid, text) to service_role;


-- =============================================================================
-- 0010_seed_idempotency.sql
-- =============================================================================

-- =============================================================================
-- 0010 · Make the seed genuinely idempotent, and clean up after when it wasn't
--
-- `seed.sql` ends every insert with `on conflict do nothing` and the header of
-- `apply-all.sql` claimed it was therefore safe to re-run. That claim was
-- false: `on conflict do nothing` catches a *unique violation*, and several of
-- these tables had no unique constraint to violate. Running the seed twice
-- silently doubled them.
--
-- It showed up as a header with every navigation item listed twice, which then
-- overflowed and pushed the account and bag icons off the end of the bar.
--
-- This migration does two things, in order:
--   1. Deletes the duplicates, keeping the oldest row of each set.
--   2. Adds the missing unique constraints, so the claim becomes true.
--
-- Safe on a database that was only seeded once: step 1 deletes nothing.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Remove duplicates, keeping the earliest physical row of each group.
--    `ctid` is the physical row address, which is the only tie-breaker
--    available on tables whose rows are otherwise identical.
-- -----------------------------------------------------------------------------

delete from navigation_items a using navigation_items b
 where a.ctid > b.ctid
   and a.menu = b.menu and a.label = b.label and a.href = b.href;

delete from shipping_methods a using shipping_methods b
 where a.ctid > b.ctid and a.name = b.name;

delete from product_images a using product_images b
 where a.ctid > b.ctid and a.product_id = b.product_id and a.url = b.url;

delete from faqs a using faqs b
 where a.ctid > b.ctid and a.question = b.question;

delete from testimonials a using testimonials b
 where a.ctid > b.ctid and a.author_name = b.author_name and a.quote = b.quote;

delete from brand_values a using brand_values b
 where a.ctid > b.ctid and a.title = b.title;

delete from banners a using banners b
 where a.ctid > b.ctid
   and a.placement = b.placement
   and coalesce(a.title, '') = coalesce(b.title, '');

-- Seeded reviews are anonymous (no profile_id), so the existing
-- `reviews_one_per_customer_product` index never applied to them.
delete from reviews a using reviews b
 where a.ctid > b.ctid
   and a.product_id = b.product_id
   and a.author_name = b.author_name
   and a.profile_id is null and b.profile_id is null;

-- Opening balances. The ledger is append-only by design, but two opening
-- balances for one variant is not history, it is a mistake.
delete from inventory_transactions a using inventory_transactions b
 where a.ctid > b.ctid
   and a.variant_id = b.variant_id
   and a.reason = 'INITIAL' and b.reason = 'INITIAL';

-- -----------------------------------------------------------------------------
-- 2. The constraints that should have existed all along.
--    With these in place, `on conflict do nothing` finally has something to
--    catch, and re-running the seed is a no-op rather than a duplication.
-- -----------------------------------------------------------------------------

create unique index if not exists navigation_items_natural_key
  on navigation_items (menu, label, href);

create unique index if not exists shipping_methods_name_key
  on shipping_methods (name);

create unique index if not exists product_images_product_url_key
  on product_images (product_id, url);

create unique index if not exists faqs_question_key
  on faqs (question);

create unique index if not exists testimonials_natural_key
  on testimonials (author_name, quote);

create unique index if not exists brand_values_title_key
  on brand_values (title);

create unique index if not exists banners_natural_key
  on banners (placement, coalesce(title, ''));

-- Anonymous reviews only: a signed-in customer is already limited to one review
-- per product by `reviews_one_per_customer_product`.
create unique index if not exists reviews_anonymous_natural_key
  on reviews (product_id, author_name) where profile_id is null;

create unique index if not exists inventory_tx_one_opening_balance
  on inventory_transactions (variant_id) where reason = 'INITIAL';

-- -----------------------------------------------------------------------------
-- Rating counts were computed from the duplicated reviews, so they are now
-- wrong on every product that had any. Recompute from what actually remains.
-- -----------------------------------------------------------------------------
update products p set
  rating_average = coalesce((
    select round(avg(r.rating)::numeric, 2) from reviews r
     where r.product_id = p.id and r.status = 'APPROVED'
  ), 0),
  rating_count = (
    select count(*) from reviews r
     where r.product_id = p.id and r.status = 'APPROVED'
  );


-- =============================================================================
-- seed.sql — demo catalogue, content and settings
-- =============================================================================

-- =============================================================================
-- seed.sql · Demo data for BRUNO
--
-- Produces a storefront that looks like a real house: 14 products across 6
-- categories, with variants, imagery, reviews, editorial content and settings.
-- Safe to re-run: every insert is idempotent on its natural key.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Categories
-- -----------------------------------------------------------------------------
insert into categories (name, slug, description, image_url, image_alt, position, is_active, is_featured, seo_title, seo_description) values
  ('Outerwear',   'outerwear',   'Coats and jackets cut for weight, drape and a long life.', '/images/editorial/category-outerwear.svg',  'Layered obsidian and champagne composition representing outerwear', 1, true, true,  'Luxury Outerwear — BRUNO', 'Cashmere overcoats, wool topcoats and leather jackets, cut in limited runs and finished by hand.'),
  ('Tailoring',   'tailoring',   'Soft-shouldered construction with a deliberately quiet line.', '/images/editorial/category-tailoring.svg', 'Vertical light study representing tailoring',                       2, true, true,  'Tailoring — BRUNO', 'Blazers and trousers with half-canvas construction, cut for movement rather than formality.'),
  ('Knitwear',    'knitwear',    'Grade-A cashmere and extrafine merino, knitted in small batches.', '/images/editorial/category-knitwear.svg', 'Soft woven gradient representing knitwear',                     3, true, true,  'Cashmere & Merino Knitwear — BRUNO', 'Rollnecks and crews in grade-A cashmere and extrafine merino, knitted in small batches.'),
  ('Shirting',    'shirting',    'Silk, poplin and linen, in a cut that reads well untucked.', '/images/editorial/category-shirting.svg',  'Fine vertical weave representing shirting',                        4, true, false, 'Shirting — BRUNO', 'Silk, two-fold poplin and washed linen shirts with mother-of-pearl fastenings.'),
  ('Leather',     'leather',     'Vegetable-tanned hides that record where you have been.', '/images/editorial/category-leather.svg',   'Deep grained surface representing leather',                        5, true, false, 'Leather Goods — BRUNO', 'Vegetable-tanned leather bags, belts and jackets, finished in a Florentine workshop.'),
  ('Accessories', 'accessories', 'The last five per cent, which is most of the effect.', '/images/editorial/category-accessories.svg', 'Fine linear composition representing accessories',                6, true, true,  'Accessories — BRUNO', 'Silk scarves, calfskin belts and cashmere wraps to finish a considered wardrobe.')
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Products
-- -----------------------------------------------------------------------------
insert into products (
  name, slug, subtitle, description, story, sku, status, price, compare_at_price, cost_price,
  is_featured, is_new, is_limited, is_members_only, materials, care_instructions, origin,
  specifications, shipping_info, returns_info, tags, badge, units_sold, position, published_at,
  seo_title, seo_description
) values

('Obsidian Cashmere Overcoat', 'obsidian-cashmere-overcoat',
 'Double-faced cashmere, unlined, hand-finished',
 'A full-length overcoat in double-faced Italian cashmere. Because the cloth is bonded rather than lined, the coat carries its own structure and falls in one clean column from the shoulder. Every edge is closed by hand — there is no facing, no lining, and nowhere to hide a shortcut.',
 'The mill in Biella has been weaving double-faced cloth for four generations. It takes two lengths of cashmere, bonds them, and then a finisher separates the layers by hand at every edge so the seam can be closed invisibly. One coat takes eleven hours of hand-finishing. We make sixty a season.',
 'BR-OUT-001', 'ACTIVE', 1890.00, null, 720.00,
 true, false, true, false,
 '100% Italian double-faced cashmere', 'Specialist dry clean only. Brush after wear. Store on a broad wooden hanger.', 'Woven in Biella, Italy. Made in Portugal.',
 '{"Fit":"Straight, mid-calf","Closure":"Concealed four-button placket","Pockets":"Two welt, one interior","Weight":"780 g/m²","Finishing":"Hand-closed edges"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['cashmere','overcoat','winter','hand-finished','limited'], 'Limited', 84, 1, now() - interval '120 days',
 'Obsidian Cashmere Overcoat — BRUNO', 'A double-faced Italian cashmere overcoat, unlined and hand-finished. Sixty made this season.'),

('Nocturne Leather Jacket', 'nocturne-leather-jacket',
 'Vegetable-tanned lambskin, cut close',
 'A short jacket in vegetable-tanned lambskin, cut close through the body with a standing collar. The hide is aniline-finished, so it takes light unevenly and will darken where you fold it. It is meant to look better in five years than it does today.',
 'Vegetable tanning takes forty days and a pit of oak bark. Chrome tanning takes six hours. We use the slow one because it leaves the hide alive — it keeps reacting to light, oil and wear long after it has left the workshop.',
 'BR-OUT-002', 'ACTIVE', 2400.00, null, 940.00,
 true, false, true, true,
 'Vegetable-tanned lambskin, cupro lining', 'Wipe with a dry cloth. Condition annually. Never machine wash.', 'Tanned in Tuscany. Made in Italy.',
 '{"Fit":"Close, hip length","Closure":"Two-way YKK Excella","Pockets":"Two side, one chest, two interior","Lining":"Bemberg cupro","Hardware":"Antiqued brass"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['leather','jacket','members','italy'], 'Members Only', 41, 2, now() - interval '90 days',
 'Nocturne Leather Jacket — BRUNO', 'Vegetable-tanned lambskin jacket, aniline-finished and made in Italy. Reserved for members.'),

('Monolith Wool Topcoat', 'monolith-wool-topcoat',
 'Melton wool, half-canvassed, storm collar',
 'A heavy melton topcoat with a half-canvas chest and a collar that stands when you need it to. The cloth is milled to 820 g/m² and pressed until it sheds rain. It is a coat for standing outside in.',
 'Melton is wool that has been felted until the weave disappears. The finisher raises the nap, shears it, and presses it — three times. What is left is a cloth so dense that water beads on it and the raw edge does not fray.',
 'BR-OUT-003', 'ACTIVE', 1650.00, 1950.00, 610.00,
 true, false, false, false,
 '90% virgin wool, 10% cashmere melton', 'Dry clean sparingly. Brush with a stiff brush after wear.', 'Woven in Yorkshire. Made in Portugal.',
 '{"Fit":"Relaxed, knee length","Closure":"Six-button double-breasted","Pockets":"Two flap, two interior","Weight":"820 g/m²","Construction":"Half-canvas"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['wool','coat','winter','sale'], 'Archive', 156, 3, now() - interval '200 days',
 'Monolith Wool Topcoat — BRUNO', 'A half-canvassed melton wool topcoat at 820 g/m², milled in Yorkshire. Now in the archive.'),

('Atelier Wool Blazer', 'atelier-wool-blazer',
 'Half-canvas, soft shoulder, patch pockets',
 'An unstructured blazer with a soft Neapolitan shoulder and a half-canvas chest. There is no padding, so the jacket takes the shape of whoever is wearing it rather than imposing one.',
 'A soft shoulder is harder to make than a padded one. There is nothing inside to correct a bad cut, so the pattern has to be right the first time. Our cutter spent nine years in Naples learning to make a jacket that does not fight the body.',
 'BR-TAI-001', 'ACTIVE', 1250.00, null, 470.00,
 true, true, false, false,
 'Super 130s virgin wool', 'Dry clean only. Rest 24 hours between wears.', 'Woven in Huddersfield. Made in Italy.',
 '{"Fit":"Soft, two-button","Shoulder":"Unpadded Neapolitan","Pockets":"Three patch","Vents":"Double side","Construction":"Half-canvas"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['tailoring','blazer','wool','new'], 'New', 62, 4, now() - interval '20 days',
 'Atelier Wool Blazer — BRUNO', 'Half-canvassed Super 130s blazer with an unpadded Neapolitan shoulder, made in Italy.'),

('Meridian Tailored Trouser', 'meridian-tailored-trouser',
 'High rise, single pleat, unfinished hem',
 'A high-rise trouser with a single forward pleat and a wide, tapering leg. Shipped with an unfinished hem so your tailor can set the break where you want it.',
 'A pleat is not decoration. It gives the fabric somewhere to go when you sit down, which is why a pleated trouser stays clean through a long day and a flat front does not.',
 'BR-TAI-002', 'ACTIVE', 540.00, null, 195.00,
 false, true, false, false,
 'Super 120s virgin wool tropical', 'Dry clean. Press with a cloth.', 'Woven in Biella. Made in Portugal.',
 '{"Rise":"High","Pleat":"Single forward","Leg":"Wide, tapered","Waistband":"Extended tab, side adjusters","Hem":"Unfinished"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['tailoring','trouser','wool','new'], 'New', 97, 5, now() - interval '30 days',
 'Meridian Tailored Trouser — BRUNO', 'High-rise single-pleat trouser in Super 120s tropical wool, shipped unhemmed.'),

('Cirrus Cashmere Crew', 'cirrus-cashmere-crew',
 'Grade-A Mongolian cashmere, 12-gauge',
 'A crew-neck in 12-gauge grade-A cashmere — fine enough to wear under a jacket, dense enough to wear alone. The neck, cuffs and hem are linked by hand so there is no ridge.',
 'Grade-A cashmere means fibres longer than 34 millimetres and finer than 15.5 microns. Longer fibres pill less. It costs roughly three times what grade-C costs, and it is the entire difference between a sweater you keep and one you replace.',
 'BR-KNI-001', 'ACTIVE', 680.00, null, 245.00,
 true, false, false, false,
 '100% grade-A Mongolian cashmere', 'Hand wash cold, dry flat. Do not hang.', 'Knitted in Scotland.',
 '{"Gauge":"12","Neck":"Crew, hand-linked","Fit":"Regular","Weight":"340 g","Ply":"Two"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['cashmere','knitwear','scotland','bestseller'], 'Best Seller', 312, 6, now() - interval '150 days',
 'Cirrus Cashmere Crew — BRUNO', '12-gauge grade-A Mongolian cashmere crew-neck, hand-linked and knitted in Scotland.'),

('Ember Merino Rollneck', 'ember-merino-rollneck',
 'Extrafine merino, 7-gauge, full roll',
 'A heavier rollneck in 7-gauge extrafine merino with a deep, genuine roll rather than a folded mock. It holds its shape at the neck because the collar is knitted in one piece.',
 'Most rollnecks are a tube sewn to a body. Ours is knitted whole, which takes four times as long on the machine and is the only way the collar still stands after fifty wears.',
 'BR-KNI-002', 'ACTIVE', 590.00, null, 210.00,
 false, false, false, false,
 '100% extrafine merino wool, 17.5 micron', 'Hand wash cold, dry flat.', 'Knitted in Scotland.',
 '{"Gauge":"7","Neck":"Full roll, knitted whole","Fit":"Regular","Weight":"520 g","Micron":"17.5"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['merino','knitwear','rollneck','winter'], null, 178, 7, now() - interval '110 days',
 'Ember Merino Rollneck — BRUNO', 'Seven-gauge extrafine merino rollneck with a whole-knitted collar, made in Scotland.'),

('Vellum Silk Shirt', 'vellum-silk-shirt',
 '19-momme sand-washed silk',
 'A shirt in 19-momme sand-washed silk — heavy enough to hang properly, washed until the sheen is gone. Mother-of-pearl buttons, French seams throughout.',
 'Momme measures the weight of silk. Most silk shirts are 12 to 16. At 19 the cloth stops clinging and starts to drape, which is the entire point of wearing silk in the first place.',
 'BR-SHI-001', 'ACTIVE', 420.00, null, 148.00,
 true, false, false, false,
 '100% mulberry silk, 19 momme', 'Hand wash cold or specialist clean. Cool iron on reverse.', 'Made in Italy.',
 '{"Weight":"19 momme","Collar":"Soft point, unfused","Buttons":"Mother-of-pearl","Seams":"French","Cuff":"Single, rounded"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['silk','shirt','italy','bestseller'], 'Best Seller', 264, 8, now() - interval '130 days',
 'Vellum Silk Shirt — BRUNO', '19-momme sand-washed mulberry silk shirt with mother-of-pearl buttons, made in Italy.'),

('Alabaster Poplin Shirt', 'alabaster-poplin-shirt',
 'Two-fold 140s cotton, unfused collar',
 'The white shirt, made properly. Two-fold 140s poplin, an unfused collar that softens with washing, and a split yoke cut on the bias so the shoulders move.',
 'A fused collar is glued. It looks sharp for a year and then bubbles. An unfused collar is three layers of cloth stitched together — it starts softer, and it is still there in a decade.',
 'BR-SHI-002', 'ACTIVE', 340.00, null, 112.00,
 false, false, false, false,
 '100% two-fold 140s Egyptian cotton poplin', 'Machine wash 30°. Iron damp.', 'Woven in Italy. Made in Portugal.',
 '{"Yarn":"Two-fold 140s","Collar":"Unfused semi-spread","Yoke":"Split, bias-cut","Buttons":"Mother-of-pearl","Stitching":"18 per inch"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['cotton','shirt','essential'], null, 401, 9, now() - interval '180 days',
 'Alabaster Poplin Shirt — BRUNO', 'Two-fold 140s Egyptian cotton poplin shirt with an unfused collar and split yoke.'),

('Ivory Linen Overshirt', 'ivory-linen-overshirt',
 'Heavyweight washed linen, patch pockets',
 'A linen overshirt heavy enough to wear as a jacket. Garment-washed so it arrives already soft, with two large patch pockets and a straight hem.',
 'Linen is stiff until it is not. We wash every piece for ninety minutes with volcanic stone before it ships, so the first wear feels like the fiftieth.',
 'BR-SHI-003', 'ACTIVE', 460.00, null, 158.00,
 false, true, false, false,
 '100% European flax linen, 260 g/m²', 'Machine wash 30°. Line dry. Embrace the creases.', 'Woven in Belgium. Made in Portugal.',
 '{"Weight":"260 g/m²","Fit":"Relaxed overshirt","Pockets":"Two patch","Hem":"Straight","Finish":"Stone-washed"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['linen','overshirt','summer','new'], 'New', 88, 10, now() - interval '15 days',
 'Ivory Linen Overshirt — BRUNO', 'Heavyweight stone-washed Belgian flax overshirt, cut to wear as a light jacket.'),

('Solstice Suede Weekender', 'solstice-suede-weekender',
 'Calf suede, brass hardware, 42 litres',
 'A weekend bag in thick calf suede with solid brass hardware and a cotton-drill lining. Forty-two litres — three days, comfortably, or five if you pack like someone who has done this before.',
 'The hardware is solid brass, not plated. Plating chips and then the piece looks cheap forever. Solid brass just goes dark, which is what you want.',
 'BR-LEA-001', 'ACTIVE', 1680.00, null, 620.00,
 true, false, true, false,
 'Calf suede, solid brass hardware, cotton drill lining', 'Brush with a suede brush. Protect before first use.', 'Made in Florence, Italy.',
 '{"Capacity":"42 litres","Dimensions":"55 × 30 × 26 cm","Hardware":"Solid brass","Lining":"Cotton drill","Strap":"Detachable, adjustable"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['leather','suede','bag','florence','limited'], 'Limited', 53, 11, now() - interval '95 days',
 'Solstice Suede Weekender — BRUNO', 'A 42-litre calf suede weekend bag with solid brass hardware, made in Florence.'),

('Onyx Calfskin Belt', 'onyx-calfskin-belt',
 'Single-piece calfskin, brushed brass',
 'A belt cut from a single piece of vegetable-tanned calfskin — no bonding, no splitting. The buckle is solid brushed brass on a hand-set pin.',
 'Most belts are two thin strips glued back to back. Cut one from a single hide and it costs more, weighs more, and never delaminates.',
 'BR-LEA-002', 'ACTIVE', 320.00, null, 94.00,
 false, false, false, false,
 'Vegetable-tanned calfskin, solid brass buckle', 'Wipe with a dry cloth. Condition twice yearly.', 'Made in Italy.',
 '{"Width":"3.5 cm","Thickness":"4 mm","Buckle":"Solid brushed brass","Construction":"Single-piece","Edge":"Hand-burnished"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['leather','belt','accessories'], null, 233, 12, now() - interval '160 days',
 'Onyx Calfskin Belt — BRUNO', 'Single-piece vegetable-tanned calfskin belt with a solid brushed-brass buckle.'),

('Halo Silk Scarf', 'halo-silk-scarf',
 'Hand-rolled twill, 90 × 90 cm',
 'A ninety-centimetre silk twill square with hand-rolled edges. The pattern is a study in refracted light, printed in eleven screens.',
 'Hand-rolling an edge means a seamstress turns the hem twice with a needle, by eye, all the way around. It takes forty minutes per scarf and it is the only reason the edge sits plump instead of flat.',
 'BR-ACC-001', 'ACTIVE', 280.00, null, 88.00,
 false, false, false, false,
 '100% silk twill, 14 momme', 'Specialist clean only.', 'Printed and finished in Como, Italy.',
 '{"Size":"90 × 90 cm","Weight":"14 momme","Edge":"Hand-rolled","Screens":"11","Finish":"Twill"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['silk','scarf','accessories','como'], null, 147, 13, now() - interval '75 days',
 'Halo Silk Scarf — BRUNO', 'A 90cm hand-rolled silk twill scarf, printed in eleven screens in Como.'),

('Sable Cashmere Wrap', 'sable-cashmere-wrap',
 'Double-ply cashmere, 200 × 70 cm',
 'A generous double-ply cashmere wrap with a fringed edge. Two metres long, so it works as a scarf, a shawl, or the only reason a long flight is survivable.',
 'We tried it at 180 centimetres and it was not enough. At 200 it wraps twice with the ends still hanging where they should.',
 'BR-ACC-002', 'ACTIVE', 390.00, 490.00, 138.00,
 true, false, false, false,
 '100% grade-A cashmere, two-ply', 'Hand wash cold, dry flat.', 'Woven in Scotland.',
 '{"Size":"200 × 70 cm","Ply":"Two","Weight":"280 g","Edge":"Hand-knotted fringe","Grade":"A"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['cashmere','scarf','accessories','sale'], 'Archive', 195, 14, now() - interval '140 days',
 'Sable Cashmere Wrap — BRUNO', 'A 200cm two-ply grade-A cashmere wrap with a hand-knotted fringe, woven in Scotland.')

on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Product ↔ category
-- -----------------------------------------------------------------------------
insert into product_categories (product_id, category_id, is_primary)
select p.id, c.id, m.is_primary
from (values
  ('obsidian-cashmere-overcoat', 'outerwear',   true),
  ('nocturne-leather-jacket',    'outerwear',   true),
  ('nocturne-leather-jacket',    'leather',     false),
  ('monolith-wool-topcoat',      'outerwear',   true),
  ('atelier-wool-blazer',        'tailoring',   true),
  ('meridian-tailored-trouser',  'tailoring',   true),
  ('cirrus-cashmere-crew',       'knitwear',    true),
  ('ember-merino-rollneck',      'knitwear',    true),
  ('vellum-silk-shirt',          'shirting',    true),
  ('alabaster-poplin-shirt',     'shirting',    true),
  ('ivory-linen-overshirt',      'shirting',    true),
  ('solstice-suede-weekender',   'leather',     true),
  ('onyx-calfskin-belt',         'leather',     true),
  ('onyx-calfskin-belt',         'accessories', false),
  ('halo-silk-scarf',            'accessories', true),
  ('sable-cashmere-wrap',        'accessories', true)
) as m(product_slug, category_slug, is_primary)
join products p   on p.slug = m.product_slug
join categories c on c.slug = m.category_slug
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Images. Two plates per product: the garment, and the same garment closer.
-- Generated SVG (Memory.md D-010) — swap for photography without a code change.
-- -----------------------------------------------------------------------------
insert into product_images (product_id, url, alt, width, height, position, is_primary)
select p.id, '/images/products/' || p.slug || '-1.svg',
       p.name || ', photographed front-on against a dark ground', 1000, 1250, 0, true
from products p
on conflict do nothing;

insert into product_images (product_id, url, alt, width, height, position, is_primary)
select p.id, '/images/products/' || p.slug || '-2.svg',
       p.name || ' — close detail of the collar, fastening and stitching', 1000, 1250, 1, false
from products p
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Options and variants
-- -----------------------------------------------------------------------------
insert into product_options (product_id, name, position, values)
select p.id, 'Size', 0, o.sizes
from (values
  ('obsidian-cashmere-overcoat', array['46','48','50','52','54']),
  ('nocturne-leather-jacket',    array['46','48','50','52']),
  ('monolith-wool-topcoat',      array['46','48','50','52','54']),
  ('atelier-wool-blazer',        array['46','48','50','52','54']),
  ('meridian-tailored-trouser',  array['30','32','34','36','38']),
  ('cirrus-cashmere-crew',       array['S','M','L','XL']),
  ('ember-merino-rollneck',      array['S','M','L','XL']),
  ('vellum-silk-shirt',          array['S','M','L','XL']),
  ('alabaster-poplin-shirt',     array['S','M','L','XL']),
  ('ivory-linen-overshirt',      array['S','M','L','XL']),
  ('onyx-calfskin-belt',         array['85','90','95','100'])
) as o(slug, sizes)
join products p on p.slug = o.slug
on conflict do nothing;

insert into product_options (product_id, name, position, values)
select p.id, 'Colour', 1, o.colours
from (values
  ('obsidian-cashmere-overcoat', array['Obsidian','Camel']),
  ('nocturne-leather-jacket',    array['Black']),
  ('monolith-wool-topcoat',      array['Charcoal','Navy']),
  ('atelier-wool-blazer',        array['Ink','Stone']),
  ('meridian-tailored-trouser',  array['Charcoal','Sand']),
  ('cirrus-cashmere-crew',       array['Bone','Obsidian','Camel']),
  ('ember-merino-rollneck',      array['Ember','Obsidian']),
  ('vellum-silk-shirt',          array['Vellum','Ink']),
  ('alabaster-poplin-shirt',     array['White']),
  ('ivory-linen-overshirt',      array['Ivory','Olive']),
  ('solstice-suede-weekender',   array['Tobacco']),
  ('onyx-calfskin-belt',         array['Onyx','Chestnut']),
  ('halo-silk-scarf',            array['Champagne','Obsidian']),
  ('sable-cashmere-wrap',        array['Sable','Bone'])
) as o(slug, colours)
join products p on p.slug = o.slug
on conflict do nothing;

-- Build the cartesian product of the declared options into real variants.
insert into product_variants (product_id, title, sku, option_values, stock_quantity, low_stock_threshold, position)
select
  p.id,
  case when sz.v is null then col.v else col.v || ' / ' || sz.v end,
  p.sku || '-' || upper(left(regexp_replace(col.v, '[^A-Za-z0-9]', '', 'g'), 3))
        || coalesce('-' || upper(regexp_replace(sz.v, '[^A-Za-z0-9]', '', 'g')), ''),
  jsonb_strip_nulls(jsonb_build_object('Colour', col.v, 'Size', sz.v)),
  -- Deterministic pseudo-random stock so the demo has in-stock, low-stock and
  -- sold-out states without being obviously uniform.
  (abs(hashtext(p.slug || col.v || coalesce(sz.v, ''))) % 17),
  4,
  (col.ord * 100 + coalesce(sz.ord, 0))
from products p
join lateral (
  select value as v, ordinality as ord
  from product_options po, unnest(po.values) with ordinality as t(value, ordinality)
  where po.product_id = p.id and po.name = 'Colour'
) col on true
left join lateral (
  select value as v, ordinality as ord
  from product_options po, unnest(po.values) with ordinality as t(value, ordinality)
  where po.product_id = p.id and po.name = 'Size'
) sz on true
on conflict (sku) do nothing;

-- Seed the inventory ledger so every balance has a provenance.
insert into inventory_transactions (variant_id, delta, reason, balance_after, note)
select v.id, v.stock_quantity, 'INITIAL', v.stock_quantity, 'Opening balance from seed data'
from product_variants v
where v.stock_quantity > 0
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Collections
-- -----------------------------------------------------------------------------
insert into collections (name, slug, description, position, seo_title, seo_description) values
  ('The Winter Edit', 'winter-edit', 'Eight pieces for the cold months, chosen for weight and drape.', 1, 'The Winter Edit — BRUNO', 'A curated edit of outerwear and knitwear for the cold months.'),
  ('Members'' Reserve', 'members-reserve', 'Released first, and sometimes only, to members of the House.', 2, 'Members'' Reserve — BRUNO', 'Pieces released first to BRUNO members.'),
  ('The Foundation', 'foundation', 'The six pieces we would keep if we could keep only six.', 3, 'The Foundation — BRUNO', 'Six essential pieces that anchor a considered wardrobe.')
on conflict (slug) do nothing;

insert into collection_products (collection_id, product_id, position)
select c.id, p.id, row_number() over ()
from collections c
join products p on p.slug = any(array['obsidian-cashmere-overcoat','monolith-wool-topcoat','ember-merino-rollneck','sable-cashmere-wrap','cirrus-cashmere-crew'])
where c.slug = 'winter-edit'
on conflict do nothing;

insert into collection_products (collection_id, product_id, position)
select c.id, p.id, row_number() over ()
from collections c
join products p on p.slug = any(array['nocturne-leather-jacket','solstice-suede-weekender','obsidian-cashmere-overcoat'])
where c.slug = 'members-reserve'
on conflict do nothing;

insert into collection_products (collection_id, product_id, position)
select c.id, p.id, row_number() over ()
from collections c
join products p on p.slug = any(array['alabaster-poplin-shirt','cirrus-cashmere-crew','meridian-tailored-trouser','atelier-wool-blazer','onyx-calfskin-belt','monolith-wool-topcoat'])
where c.slug = 'foundation'
on conflict do nothing;

-- Manual cross-sells
insert into product_relations (product_id, related_id, kind, position)
select a.id, b.id, 'RELATED', r.pos
from (values
  ('atelier-wool-blazer',       'meridian-tailored-trouser', 1),
  ('atelier-wool-blazer',       'alabaster-poplin-shirt',    2),
  ('atelier-wool-blazer',       'onyx-calfskin-belt',        3),
  ('obsidian-cashmere-overcoat','sable-cashmere-wrap',       1),
  ('obsidian-cashmere-overcoat','cirrus-cashmere-crew',      2),
  ('vellum-silk-shirt',         'halo-silk-scarf',           1),
  ('cirrus-cashmere-crew',      'meridian-tailored-trouser', 1),
  ('nocturne-leather-jacket',   'solstice-suede-weekender',  1)
) as r(a_slug, b_slug, pos)
join products a on a.slug = r.a_slug
join products b on b.slug = r.b_slug
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Reviews
-- -----------------------------------------------------------------------------
insert into reviews (product_id, author_name, author_location, rating, title, body, status, is_verified_purchase, is_featured, created_at)
select p.id, r.author, r.loc, r.rating, r.title, r.body, 'APPROVED', true, r.featured, now() - (r.days || ' days')::interval
from (values
  ('obsidian-cashmere-overcoat','Marcus D.','London', 5, 'Worth the wait','I put off buying a coat at this price for two years. Three winters in and the hand-finished edges have not moved. The unlined construction means it is genuinely warmer than the padded coat it replaced, and it packs better.', true, 42),
  ('obsidian-cashmere-overcoat','Helena V.','Copenhagen', 5, 'The drape is the thing','It falls in one line from the shoulder in a way I have only seen on made-to-measure. I sized up one and the proportion is exactly right over a jacket.', false, 88),
  ('cirrus-cashmere-crew','James O.','New York', 5, 'No pilling after a year','I own four cashmere crews from other houses and all of them pilled under the arms within a season. This one has not. The grade-A claim is doing real work.', true, 31),
  ('cirrus-cashmere-crew','Priya S.','Singapore', 4, 'Perfect weight, runs slightly large','Twelve gauge is exactly right for a warm climate — I wear it under a blazer in air conditioning year round. I would size down.', false, 64),
  ('cirrus-cashmere-crew','Tomas R.','Zurich', 5, 'Hand-linked neck is noticeable','You can feel the absence of a seam ridge at the collar immediately. Small thing, but it is why this sits flat under a shirt.', false, 120),
  ('vellum-silk-shirt','Adrienne L.','Paris', 5, 'Nineteen momme changes everything','Every other silk shirt I own clings. This one hangs. The sand-wash finish means it reads matte rather than shiny, which is the difference between evening and every day.', true, 19),
  ('vellum-silk-shirt','Daniel K.','Melbourne', 5, 'Second one ordered','Bought the vellum, immediately ordered the ink. French seams throughout, which you notice when you roll the sleeves.', false, 55),
  ('nocturne-leather-jacket','Sofia M.','Milan', 5, 'It is already changing','Six months in and it has darkened at the elbows and the fold of the collar exactly as described. It looks like mine now, not like a product.', true, 27),
  ('monolith-wool-topcoat','Ewan B.','Edinburgh', 5, 'Actually sheds rain','I was sceptical about the melton claim. It rained for forty minutes on me in November and the water sat on the surface. Genuinely windproof too.', true, 73),
  ('monolith-wool-topcoat','Renata C.','Toronto', 4, 'Heavy, in the good way','820 grams is not a marketing number, you feel it on the shoulders. It is a coat for standing at a bus stop in January, not for a warm office.', false, 101),
  ('atelier-wool-blazer','Christopher N.','Boston', 5, 'The shoulder is the whole point','No padding at all, and yet it holds. This is the first off-the-rack jacket that has not made me look like I borrowed it.', true, 12),
  ('alabaster-poplin-shirt','Yuki T.','Tokyo', 5, 'The collar still stands','Two years, weekly wear, machine washed every time. The unfused collar has softened but has never bubbled. I have bought three more.', true, 96),
  ('alabaster-poplin-shirt','Nadia F.','Beirut', 4, 'Excellent, iron it damp','Exactly as described. The 140s poplin does crease — iron it damp as they say and it presses beautifully.', false, 48),
  ('solstice-suede-weekender','Oliver H.','Amsterdam', 5, 'Brass has gone dark, as promised','A year of monthly flights. The suede has scuffed in a way that looks deliberate and the brass has taken on a proper patina. Forty-two litres is genuinely three days.', true, 38),
  ('ember-merino-rollneck','Isabelle G.','Montreal', 5, 'The collar does not collapse','I have thrown out three rollnecks whose necks went limp by February. This one is knitted whole and it still stands.', true, 22),
  ('sable-cashmere-wrap','Clara W.','Lisbon', 5, 'Two hundred centimetres is correct','I have a 180 from elsewhere and it is always four inches short of wrapping properly. This one does. It lives in my carry-on.', true, 59),
  ('meridian-tailored-trouser','Felix A.','Berlin', 4, 'Unhemmed is the right call','Shipped unfinished so my tailor set the break. The single pleat means they still look clean after eight hours at a desk.', false, 16),
  ('onyx-calfskin-belt','Grace P.','Chicago', 5, 'Single-piece is worth it','My last belt delaminated in eighteen months. This one is cut from one hide and there is nothing to come apart.', true, 81),
  ('halo-silk-scarf','Marguerite D.','Lyon', 5, 'The rolled edge is beautiful','You can see the forty minutes in the hem. It sits plump around the neck rather than lying flat like a printed square.', false, 34),
  ('ivory-linen-overshirt','Sam K.','Sydney', 4, 'Soft from the first wear','The stone-wash means none of that cardboard stiffness new linen usually has. Wore it straight out of the box.', true, 9)
) as r(slug, author, loc, rating, title, body, featured, days)
join products p on p.slug = r.slug
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Membership
-- -----------------------------------------------------------------------------
insert into membership_tiers (name, slug, tagline, description, benefits, min_spend, discount_percent, early_access_hours, position) values
  ('Atelier', 'atelier', 'The invitation',
   'Where the relationship begins. Early sight of every release and a direct line to the people who make the clothes.',
   array['48-hour early access to every release','Complimentary insured shipping, always','Invitations to atelier previews','A direct line to our head of client care'],
   0, 0, 48, 1),
  ('Circle', 'circle', 'The relationship',
   'For clients who have made BRUNO part of how they dress. Adds private allocation and lifetime repairs.',
   array['Everything in Atelier','Private allocation on limited runs','Ten per cent on every order','Lifetime repairs and re-finishing','Two personal styling sessions each year'],
   5000, 10, 96, 2),
  ('Maison', 'maison', 'The house',
   'By invitation only. Made-to-measure, first refusal on archive pieces, and a permanent record of your measurements.',
   array['Everything in Circle','Made-to-measure at no surcharge','First refusal on archive and one-of-one pieces','Fifteen per cent on every order','Your measurements held permanently','An annual private appointment in Florence'],
   25000, 15, 168, 3)
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Brand values
-- -----------------------------------------------------------------------------
insert into brand_values (title, description, icon, detail, position) values
  ('Made in small numbers', 'Nothing we make exceeds four hundred pieces. Most run to sixty.', 'Gem',
   'Scarcity is not a marketing device here — it is a consequence of insisting on workshops that finish by hand.', 1),
  ('Materials you can name', 'Every fibre is traceable to a mill we have visited.', 'Layers',
   'Grade-A Mongolian cashmere. Two-fold 140s Egyptian cotton. Vegetable-tanned Tuscan calf. We publish the mill, the weight and the micron.', 2),
  ('Finished by hand', 'The last eleven hours of a coat are a person, not a machine.', 'Scissors',
   'Hand-closed edges, hand-linked collars, hand-rolled hems. These are the operations that decide whether a garment survives a decade.', 3),
  ('Repaired, not replaced', 'Lifetime repairs on everything we have ever sold.', 'RefreshCw',
   'Send it back. We re-finish edges, re-link collars, re-dye leather and replace hardware. A BRUNO piece should outlast the reason you bought it.', 4)
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Story sections
-- -----------------------------------------------------------------------------
insert into story_sections (key, eyebrow, title, body, quote, image_url, image_alt, stat_value, stat_label, cta_label, cta_href, position) values
  ('atelier', 'The Atelier', 'Eleven hours, one coat',
   E'Our overcoats are made in a workshop of nineteen people outside Porto. The cloth arrives from Biella as a double-faced length — two cashmeres bonded together. Before a single seam is sewn, a finisher separates those layers by hand at every edge, so that the seam can be closed inside the cloth and disappear.\n\nIt is slow, it cannot be mechanised, and it is the reason the coat has no lining, no facing, and no weight it does not need.',
   'You cannot rush an edge. The cloth decides how fast you go.',
   '/images/editorial/atelier.svg', 'Layered light composition evoking a workshop interior',
   '11', 'hours of hand-finishing per coat', 'Read the full process', '/journal/eleven-hours', 1),

  ('materials', 'The Materials', 'We will tell you the micron',
   E'Most houses say "the finest cashmere". We say 15.5 microns, 34-millimetre staple, grade-A, from a co-operative in Mongolia we buy from directly. We say 19 momme for the silk and 820 grams per square metre for the melton.\n\nThese are the numbers that decide whether something pills, sags, or lasts. Publishing them is the simplest way to be held to them.',
   'A specification you can check is worth more than an adjective you cannot.',
   '/images/editorial/materials.svg', 'Fine gradient study evoking layered natural fibres',
   '15.5', 'micron grade-A cashmere', 'See our material standards', '/materials', 2),

  ('provenance', 'The Provenance', 'Four mills, three workshops',
   E'Biella for cashmere. Huddersfield for worsted. Como for silk. Hawick for knitwear. Three workshops — Porto, Florence, Naples — that between them employ under two hundred people.\n\nWe have been to all of them. We go back twice a year. When something is wrong, we know whose hands it passed through, and so do they.',
   'A short supply chain is not an ethical position. It is just the only way to keep a standard.',
   '/images/editorial/provenance.svg', 'Cartographic light composition evoking European provenance',
   '7', 'partners, all visited twice a year', 'Meet the makers', '/provenance', 3)
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- Testimonials
-- -----------------------------------------------------------------------------
insert into testimonials (author_name, author_title, author_location, quote, rating, position, is_featured) values
  ('Helena Vestergaard', 'Architect', 'Copenhagen',
   'I have bought one BRUNO piece a year for four years. Not one of them has been replaced, which is the only review that matters.', 5, 1, true),
  ('Marcus Delacroix', 'Gallerist', 'London',
   'The overcoat is the single best thing in my wardrobe and I have owned some expensive mistakes. The difference is that this one is still improving.', 5, 2, true),
  ('Yuki Tanaka', 'Creative Director', 'Tokyo',
   'They publish the micron count. Nobody publishes the micron count. It tells you everything about how they think.', 5, 3, true),
  ('Sofia Marchetti', 'Photographer', 'Milan',
   'I live in a city full of leather and I still get asked about this jacket. It has aged into something none of the new ones look like.', 5, 4, false),
  ('Oliver Hendricks', 'Founder', 'Amsterdam',
   'Forty flights a year with the weekender. The brass has gone dark and the suede has scars. It looks better than the day it arrived.', 5, 5, false)
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- FAQs
-- -----------------------------------------------------------------------------
insert into faqs (question, answer, category, position) values
  ('How limited is "limited"?', 'Nothing we make exceeds four hundred pieces, and most limited releases run to sixty. When a size sells out we do not re-cut it — the run is the run. Members see every release forty-eight hours before it opens publicly.', 'Ordering', 1),
  ('Why is there no lining in the overcoat?', 'The cloth is double-faced: two lengths of cashmere bonded together. A lining would add weight and remove the drape that makes the coat worth making. Every edge is closed by hand instead.', 'Products', 2),
  ('What does membership cost?', 'Nothing. Atelier membership is free and begins the first time you buy. Circle opens at five thousand in lifetime spend, Maison at twenty-five thousand and by invitation. There is no subscription and there never will be.', 'Membership', 3),
  ('Do you really repair anything, forever?', 'Yes, on anything we have ever sold, for as long as we exist. We re-finish edges, re-link collars, re-dye leather, replace hardware and re-knit cuffs. You pay return shipping; we pay for the work.', 'Care', 4),
  ('How long does delivery take?', 'Orders are dispatched within 48 hours. Two to three working days within Europe and North America, three to five elsewhere. Shipping is insured and complimentary on every order, with no minimum.', 'Shipping', 5),
  ('Can I return something?', 'Thirty days, unworn, with tags attached. We pay return shipping. Made-to-measure and monogrammed pieces are the only exceptions, and we will say so clearly before you order.', 'Returns', 6),
  ('How should I choose a size?', 'Every product page carries the measurements of the actual garment, not a body chart. If you are between sizes, our client care team will tell you which way to go — they have handled the pieces.', 'Sizing', 7),
  ('Where are your clothes made?', 'Cloth from Biella, Huddersfield and Como. Garments from workshops in Porto, Florence and Naples. Knitwear from Hawick. We name every partner and we visit each of them twice a year.', 'Products', 8)
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Banners
-- -----------------------------------------------------------------------------
insert into banners (placement, eyebrow, title, subtitle, body, cta_label, cta_href, secondary_cta_label, secondary_cta_href, image_url, image_alt, position, is_active) values
  ('ANNOUNCEMENT_BAR', null, 'Complimentary insured delivery worldwide', null, null, 'The Winter Edit', '/collections/winter-edit', null, null, null, null, 1, true),
  ('HOME_HERO', 'Autumn / Winter — Sixty pieces',
   'Clothes that outlast the reason you bought them',
   'Grade-A cashmere, vegetable-tanned leather and half-canvas tailoring, made in numbers small enough to finish by hand.',
   null, 'Explore the collection', '/collection', 'The atelier', '/journal/eleven-hours',
   '/images/editorial/hero.svg', 'Liquid glass composition in obsidian and champagne', 1, true),
  ('HOME_PROMO', 'The Members'' Reserve',
   'Some pieces never reach the public floor',
   'Members see every release forty-eight hours early, and a small number of pieces are never released beyond the Circle at all.',
   null, 'Request an invitation', '/membership', null, null,
   '/images/editorial/membership.svg', 'Refracted champagne light through dark glass', 1, true)
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Navigation
-- -----------------------------------------------------------------------------
insert into navigation_items (menu, label, href, position) values
  ('header', 'Collection',  '/collection',  1),
  ('header', 'Outerwear',   '/category/outerwear', 2),
  ('header', 'Tailoring',   '/category/tailoring', 3),
  ('header', 'Knitwear',    '/category/knitwear',  4),
  ('header', 'The House',   '/house',       5),
  ('header', 'Membership',  '/membership',  6),
  ('footer-shop', 'All pieces',   '/collection', 1),
  ('footer-shop', 'Outerwear',    '/category/outerwear', 2),
  ('footer-shop', 'Tailoring',    '/category/tailoring', 3),
  ('footer-shop', 'Knitwear',     '/category/knitwear', 4),
  ('footer-shop', 'Shirting',     '/category/shirting', 5),
  ('footer-shop', 'Leather',      '/category/leather', 6),
  ('footer-shop', 'Accessories',  '/category/accessories', 7),
  ('footer-house', 'The House',   '/house', 1),
  ('footer-house', 'Materials',   '/materials', 2),
  ('footer-house', 'Provenance',  '/provenance', 3),
  ('footer-house', 'The Journal', '/journal', 4),
  ('footer-house', 'Membership',  '/membership', 5),
  ('footer-care', 'Shipping',     '/shipping', 1),
  ('footer-care', 'Returns',      '/returns', 2),
  ('footer-care', 'Repairs',      '/repairs', 3),
  ('footer-care', 'Size guide',   '/sizing', 4),
  ('footer-care', 'Contact',      '/contact', 5),
  ('footer-legal', 'Privacy',     '/privacy', 1),
  ('footer-legal', 'Terms',       '/terms', 2),
  ('footer-legal', 'Accessibility','/accessibility', 3)
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Shipping methods
-- -----------------------------------------------------------------------------
insert into shipping_methods (name, description, price, free_over, min_delivery_days, max_delivery_days, position) values
  ('Insured Standard', 'Tracked and insured. Signature required.', 0.00, 0.00, 2, 5, 1),
  ('Insured Express',  'Next working day where the network allows.', 35.00, 1500.00, 1, 2, 2),
  ('White Glove',      'Hand delivery by appointment. Selected cities.', 120.00, null, 1, 3, 3)
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Coupons
-- -----------------------------------------------------------------------------
insert into coupons (code, description, discount_type, scope, value, minimum_order, maximum_discount, usage_limit, usage_limit_per_customer, starts_at, ends_at, is_active, members_only) values
  ('WELCOME10', 'Ten per cent off a first order', 'PERCENTAGE', 'ORDER', 10, 200, 300, 1000, 1, now() - interval '30 days', now() + interval '365 days', true, false),
  ('ATELIER15', 'Fifteen per cent for members', 'PERCENTAGE', 'ORDER', 15, 0, null, null, null, now() - interval '10 days', now() + interval '180 days', true, true),
  ('FREESHIP',  'Complimentary express shipping', 'FREE_SHIPPING', 'ORDER', 0, 500, null, 500, 2, now() - interval '5 days', now() + interval '90 days', true, false),
  ('ARCHIVE100','One hundred off archive pieces', 'FIXED_AMOUNT', 'ORDER', 100, 800, null, 200, 1, now() - interval '2 days', now() + interval '45 days', true, false)
on conflict (code) do nothing;

-- -----------------------------------------------------------------------------
-- Journal
-- -----------------------------------------------------------------------------
insert into blog_categories (name, slug, description, position) values
  ('The Process',  'process',  'How things are made, and why it takes as long as it does.', 1),
  ('Materials',    'materials','Fibre, hide and cloth, in specifics.', 2),
  ('The Wardrobe', 'wardrobe', 'What to buy, in what order, and what to stop buying.', 3)
on conflict (slug) do nothing;

insert into blog_posts (slug, title, excerpt, content, featured_image_url, featured_image_alt, category_id, author_name, tags, status, reading_minutes, published_at, seo_title, seo_description)
select b.slug, b.title, b.excerpt, b.content, b.image, b.alt, c.id, b.author, b.tags, 'PUBLISHED', b.mins, now() - (b.days || ' days')::interval, b.title || ' — BRUNO Journal', b.excerpt
from (values
  ('eleven-hours', 'Eleven hours, one coat',
   'Why a double-faced cashmere overcoat cannot be finished by a machine, and what those eleven hours actually buy you.',
   E'There is a moment in making a double-faced coat where the machines stop.\n\nThe cloth arrives from Biella as two lengths of cashmere bonded into one. To close a seam invisibly, a finisher has to separate those two layers by hand along every edge — running a blade between them, opening a pocket of a few millimetres, and then stitching the seam inside the cloth so it disappears entirely.\n\nThere is no machine for this. There has never been a machine for this. It is nineteen people in a workshop outside Porto, a blade, and eleven hours.\n\n**What it buys you.** No lining, which is roughly four hundred grams you do not carry. No facing, which is the stiff panel that makes most coats break awkwardly at the lapel. And an edge that is cloth all the way through, so it will not fray, delaminate, or show a different colour when it wears.\n\n**What it costs.** Sixty coats a season. That is the whole run, and it is not a marketing decision — it is arithmetic. Nineteen people, eleven hours each, one season.',
   '/images/editorial/journal-atelier.svg', 'Light study of a workshop interior in obsidian and champagne', 'process', 'The Atelier', array['cashmere','process','outerwear'], 8, 24),

  ('micron-count', 'What a micron count actually tells you',
   'Grade-A, 15.5 micron, 34-millimetre staple. Three numbers that decide whether a cashmere sweater survives its second winter.',
   E'"The finest cashmere" means nothing. Here are the three numbers that mean something.\n\n**Micron** is fibre diameter. Cashmere runs from about 14 to 19 microns. Finer is softer, and finer is more expensive, but finer alone is not the whole story.\n\n**Staple length** is how long each fibre is. This is the number nobody quotes, and it is the one that decides pilling. Short fibres work loose from the yarn under friction, ball up, and become the pills you shave off a jumper in its second month. Grade-A cashmere is longer than 34 millimetres. Grade-C can be half that.\n\n**Ply** is how many yarns are twisted together. Two-ply is the minimum for a garment you intend to keep. Single-ply is lighter and cheaper and will go through at the elbow.\n\nWe knit at 15.5 micron, 34-millimetre staple, two-ply. A jumper made this way costs about three times what a grade-C equivalent costs and lasts something like eight times as long, which is a bargain expressed inconveniently.',
   '/images/editorial/journal-materials.svg', 'Fine fibre gradient study', 'materials', 'The Atelier', array['cashmere','materials','knitwear'], 6, 51),

  ('six-pieces', 'The six pieces',
   'If you could keep only six things, these would be the six — and the order in which to buy them.',
   E'Most wardrobes fail because they are wide rather than deep. Here is the depth version.\n\n**One. A white shirt with an unfused collar.** It goes under everything and it is the item people notice when it is bad. Two-fold 140s poplin, split yoke, mother-of-pearl.\n\n**Two. A cashmere crew in a neutral.** Twelve gauge — fine enough to layer, warm enough alone. Bone or obsidian, nothing else, not yet.\n\n**Three. A high-rise trouser in tropical wool.** Buy it unhemmed and have it finished. This single act does more for how clothes look on you than any other three hundred you could spend.\n\n**Four. A soft-shouldered blazer.** Half-canvas, unpadded, patch pockets. It should not look like it came from an office.\n\n**Five. A belt cut from one piece of hide.** Not two strips glued together. You will own it for fifteen years.\n\n**Six. A coat heavy enough to be the only one.** This is the expensive one, and it should be the last one you buy, because by the time you get here you will know what you actually wear.\n\nThat is the wardrobe. Everything after it is preference.',
   '/images/editorial/journal-wardrobe.svg', 'Composed grid of material tones', 'wardrobe', 'The Atelier', array['wardrobe','essentials'], 7, 12),

  ('vegetable-tanning', 'Forty days in oak bark',
   'Chrome tanning takes six hours. Vegetable tanning takes forty days. The difference shows up in year three.',
   E'Ninety per cent of the world''s leather is chrome-tanned. It takes about six hours, produces a hide of uniform colour that resists water and stains, and is, for most purposes, the correct choice.\n\nWe do not use it.\n\nVegetable tanning suspends the hide in pits of oak, chestnut and mimosa bark for forty days. The tannins bind to the collagen slowly and unevenly. What comes out is a hide that is still, in a meaningful sense, reactive: it darkens in sunlight, absorbs the oil from your hands, and holds a fold as a permanent crease.\n\nIn year one, chrome-tanned leather looks better. It is more even, more consistent, more like a product.\n\nIn year three, it looks exactly the same as it did, except for the places where the finish has cracked. The vegetable-tanned hide, by then, has gone several shades deeper at the elbows and the collar fold, and has stopped looking like a product at all.\n\nThat is the trade. We think it is an easy one.',
   '/images/editorial/journal-leather.svg', 'Deep grained surface study in warm tones', 'materials', 'The Atelier', array['leather','materials','process'], 5, 68)
) as b(slug, title, excerpt, content, image, alt, cat_slug, author, tags, mins, days)
join blog_categories c on c.slug = b.cat_slug
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Pages
-- -----------------------------------------------------------------------------
insert into pages (slug, title, subtitle, content, status, published_at, seo_title, seo_description) values
  ('house', 'The House', 'Nineteen people outside Porto, and a rule about numbers',
   E'BRUNO makes a small number of things and finishes them by hand.\n\nThat sentence is the entire strategy. Everything else — the mills we buy from, the workshops we use, the decision to publish micron counts and garment weights, the lifetime repair programme — follows from it.\n\nWe began in 2019 with six pieces and one workshop. We now make around forty pieces a year across six categories, from four mills and three workshops, none of which employs more than a hundred people. We visit all of them twice a year.\n\nWe are not trying to become large. Large would require the operations we have specifically refused: fused collars, chrome tanning, bonded belts, lined coats. Each of those makes a garment cheaper and faster and worse in its third year, which is the year we care about.',
   'PUBLISHED', now() - interval '300 days', 'The House — BRUNO', 'BRUNO makes a small number of things and finishes them by hand. Four mills, three workshops, forty pieces a year.'),
  ('materials', 'Materials', 'The numbers, published',
   E'We publish specifications because a specification can be checked and an adjective cannot.\n\n**Cashmere.** Grade-A Mongolian. 15.5 micron, 34mm staple, two-ply. Knitted in Hawick, Scotland.\n\n**Wool.** Super 120s and 130s worsted from Huddersfield; 90/10 wool-cashmere melton at 820 g/m² from Yorkshire; tropical wool from Biella.\n\n**Silk.** Mulberry silk at 19 momme for shirting, 14 momme twill for scarves. Woven, printed and finished in Como.\n\n**Cotton.** Two-fold 140s Egyptian poplin, woven in Italy.\n\n**Linen.** European flax at 260 g/m², woven in Belgium, stone-washed before shipping.\n\n**Leather.** Vegetable-tanned Tuscan calf and lambskin, forty days in oak, chestnut and mimosa bark. Aniline finish. Solid brass hardware, never plated.',
   'PUBLISHED', now() - interval '280 days', 'Materials — BRUNO', 'Grade-A cashmere at 15.5 micron, 19-momme silk, 820gsm melton, vegetable-tanned Tuscan calf. Every specification, published.'),
  ('shipping', 'Shipping', 'Insured, worldwide, complimentary',
   E'Every order ships insured and tracked at no cost, with no minimum.\n\nOrders are dispatched within 48 hours. Two to three working days in Europe and North America, three to five elsewhere. Signature is required on delivery.\n\nExpress delivery is 35, complimentary over 1,500. White-glove hand delivery by appointment is available in selected cities at 120.\n\nDuties and taxes are prepaid for the UK, EU, US, Canada, Australia, Japan and Singapore. Elsewhere they are collected on delivery.',
   'PUBLISHED', now() - interval '250 days', 'Shipping — BRUNO', 'Complimentary insured worldwide delivery, dispatched within 48 hours.'),
  ('returns', 'Returns & Repairs', 'Thirty days to change your mind. Forever to fix it.',
   E'**Returns.** Thirty days from delivery, unworn, with tags attached. We pay return shipping. Refunds are issued to the original payment method within five working days of the piece arriving back with us.\n\nMade-to-measure and monogrammed pieces cannot be returned, and we will tell you so clearly before you order.\n\n**Repairs.** Lifetime, on anything we have ever sold. We re-finish edges, re-link collars, re-knit cuffs, re-dye leather and replace hardware. You pay return shipping; the work itself is free, permanently, regardless of how you came to own the piece.',
   'PUBLISHED', now() - interval '250 days', 'Returns & Repairs — BRUNO', 'Thirty-day returns with shipping paid, and free lifetime repairs on everything we have ever made.')
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Site settings. is_public = true is readable by the storefront (see RLS 0008).
-- -----------------------------------------------------------------------------
insert into site_settings (key, value, group_name, label, is_public) values
  ('site.name',            '"BRUNO"'::jsonb,                                    'general',  'Site name', true),
  ('site.tagline',         '"Premium Apparel"'::jsonb,                          'general',  'Tagline', true),
  ('site.description',     '"Clothes made in small numbers and finished by hand. Grade-A cashmere, vegetable-tanned leather, half-canvas tailoring."'::jsonb, 'seo', 'Default meta description', true),
  ('site.url',             '"https://bruno.example.com"'::jsonb,                'general',  'Canonical site URL', true),
  ('site.currency',        '"USD"'::jsonb,                                      'commerce', 'Default currency', true),
  ('site.email',           '"clientcare@bruno.example.com"'::jsonb,             'contact',  'Client care email', true),
  ('site.phone',           '"+1 (212) 555-0180"'::jsonb,                        'contact',  'Client care telephone', true),
  ('site.address',         '"41 Rue Saint-Honoré, 75001 Paris"'::jsonb,         'contact',  'Registered address', true),
  ('site.hours',           '"Monday to Friday, 09:00–18:00 CET"'::jsonb,        'contact',  'Client care hours', true),
  ('social.instagram',     '"https://instagram.com/bruno"'::jsonb,              'social',   'Instagram', true),
  ('social.pinterest',     '"https://pinterest.com/bruno"'::jsonb,              'social',   'Pinterest', true),
  ('commerce.free_shipping_threshold', '0'::jsonb,                              'commerce', 'Free shipping threshold', true),
  ('commerce.tax_rate',    '0.0'::jsonb,                                        'commerce', 'Default tax rate', false),
  ('commerce.low_stock_threshold', '4'::jsonb,                                  'commerce', 'Default low-stock threshold', false),
  ('analytics.ga4_id',     'null'::jsonb,                                       'analytics','GA4 measurement ID', true),
  ('analytics.meta_pixel', 'null'::jsonb,                                       'analytics','Meta Pixel ID', true)
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- Permission matrix
-- -----------------------------------------------------------------------------
insert into permissions (key, resource, action, description) values
  ('products.read','products','read','View the catalogue'),
  ('products.write','products','write','Create and edit products'),
  ('products.delete','products','delete','Archive or delete products'),
  ('inventory.adjust','inventory','adjust','Change stock levels'),
  ('orders.read','orders','read','View orders'),
  ('orders.fulfil','orders','fulfil','Change fulfilment status and add tracking'),
  ('orders.refund','orders','refund','Issue refunds'),
  ('customers.read','customers','read','View customer records'),
  ('customers.write','customers','write','Edit customer records'),
  ('coupons.write','coupons','write','Create and edit promotions'),
  ('reviews.moderate','reviews','moderate','Approve, hide and feature reviews'),
  ('content.write','content','write','Edit pages, banners, FAQs and testimonials'),
  ('blog.write','blog','write','Write and publish journal articles'),
  ('seo.write','seo','write','Edit SEO metadata'),
  ('analytics.read','analytics','read','View the analytics dashboard'),
  ('settings.write','settings','write','Change site settings'),
  ('users.write','users','write','Manage staff accounts and roles')
on conflict (key) do nothing;

insert into role_permissions (role, permission_id)
select 'SUPER_ADMIN'::user_role, id from permissions
on conflict do nothing;

insert into role_permissions (role, permission_id)
select 'ADMIN'::user_role, id from permissions where key <> 'users.write'
on conflict do nothing;

insert into role_permissions (role, permission_id)
select 'MANAGER'::user_role, id from permissions
where key in ('products.read','products.write','inventory.adjust','orders.read',
              'orders.fulfil','customers.read','coupons.write','reviews.moderate',
              'content.write','blog.write','seo.write','analytics.read')
on conflict do nothing;

insert into role_permissions (role, permission_id)
select 'EDITOR'::user_role, id from permissions
where key in ('products.read','content.write','blog.write','seo.write','reviews.moderate')
on conflict do nothing;

commit;

-- -----------------------------------------------------------------------------
-- After seeding: promote yourself to SUPER_ADMIN.
-- Sign up through the app first, then run:
--
--   update profiles set role = 'SUPER_ADMIN' where email = 'you@example.com';
-- -----------------------------------------------------------------------------


commit;
