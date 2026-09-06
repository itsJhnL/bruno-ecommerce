-- =============================================================================
-- RUN THIS ONCE, NOW, IF YOUR SITE SHOWS EVERY NAVIGATION LINK TWICE.
--
-- Supabase dashboard -> SQL Editor -> New query -> paste this -> Run.
--
-- It is a copy of supabase/migrations/0010_seed_idempotency.sql, kept separate
-- so you can run just this against a database that already has 0001-0009.
-- Running it twice is harmless.
--
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
