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
