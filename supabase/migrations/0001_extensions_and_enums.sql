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
