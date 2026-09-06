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
