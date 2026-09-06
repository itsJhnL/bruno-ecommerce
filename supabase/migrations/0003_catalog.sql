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
