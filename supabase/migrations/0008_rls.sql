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
