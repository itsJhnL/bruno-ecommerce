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
