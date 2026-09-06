# Goals

The measurable definition of done for BRUNO. Anything not on this list is not a goal.

---

## North star

**A visitor who has never heard of BRUNO should believe, within one screen, that this is
an established luxury house — and the owner should be able to run the whole business
from `/admin` without ever opening an editor.**

---

## Phase 1 — Foundation & Storefront

### G1. The database is the single source of truth
- [ ] No product, category, price, testimonial, FAQ or banner literal exists in `.tsx`
- [ ] `src/data/products.js` is deleted, its content migrated to seed SQL
- [ ] Every storefront query goes through `lib/queries/*` — no inline SQL in components

### G2. The schema is production-shaped
- [ ] 30+ normalized tables with foreign keys, checks, unique constraints, timestamps
- [ ] Every table has RLS enabled and an explicit policy set
- [ ] Every filter and join column is indexed; full-text search uses a `tsvector` index
- [ ] Money is `numeric(12,2)`, never float; stored in minor-unit-safe form
- [ ] Seed data produces a storefront that looks like a real shop, not a test fixture

### G3. The design system is coherent and accessible
- [ ] One token file drives colour, type, spacing, radius, blur and motion
- [ ] Body text ≥ 4.5:1 against its actual glass backdrop, measured not assumed
- [ ] Focus rings visible on every interactive element
- [ ] `prefers-reduced-motion` disables parallax, reveal and blur transitions
- [ ] Layout verified at 375 / 768 / 1024 / 1440px with no clipping

### G4. The landing page sells
- [ ] Hero, featured collection, category rail, atelier story, brand values,
      testimonials, membership CTA, journal teaser, newsletter, FAQ
- [ ] Every section pulls from the database
- [ ] Zero cumulative layout shift from image loading (explicit dimensions everywhere)

### G5. Catalog and product detail work for real
- [ ] Search, category, price, size, colour filters and 5 sort modes, all server-side
- [ ] Filters are URL state — shareable, back-button-correct, crawlable
- [ ] Product page renders gallery, variants, stock, reviews, related, FBT
- [ ] Adding an unavailable variant to cart is impossible, and the UI says why

### G6. SEO is not an afterthought
- [ ] `generateMetadata` on every dynamic route, reading CMS SEO fields
- [ ] `sitemap.xml` and `robots.txt` generated from live data
- [ ] Organization, Website, Product, Breadcrumb, Article, FAQPage JSON-LD validates
- [ ] Breadcrumbs rendered and marked up on catalog, product and journal pages

### G7. Nothing is fake
- [ ] Any control not yet wired to the backend is visibly marked pending or absent
- [ ] No button that appears to work but does nothing
- [ ] `docs/status.md` lists exactly what is live and what is stubbed

---

## Phase 2 — Commerce
- [x] Server-computed totals; client never sends a price — `price_cart()` in Postgres
- [x] Guest cart persists — httpOnly cookie, 30 days
- [~] …and merges on login — `merge_guest_cart()` and `mergeGuestCartIntoProfile()` are
      written and tested, but nothing calls them yet because there is no sign-in flow.
      Wiring is a one-line call in the Phase 3 login action
- [x] Coupons honour window, usage limit, per-customer limit, minimum, members-only,
      and product/category scope
- [x] Stripe Checkout live; orders reach `paid` only via verified webhook
- [x] Webhook handler idempotent by Stripe event id
- [x] Order confirmation email sends — and is recorded in `email_log`, including when it
      is skipped for want of a provider

Additionally delivered, beyond the original list: stock reservation with release on
failure, an immutable inventory ledger entry per movement, staff notifications for new
orders / low stock / payment failure, an order/session total cross-check before charging,
newsletter and membership capture, and a 59-assertion SQL test suite (`npm run test:db`).

## Phase 3 — Accounts
- [x] Register, login, logout, password reset — Supabase Auth, with `/auth/callback`
      exchanging the emailed code server-side
- [x] Profile, addresses, order history, order detail, tracking, wishlist
- [x] A customer cannot read another customer's row — **proven by a failing-by-default
      test**: `supabase/tests/rls-isolation.mjs` runs as the `authenticated` role with a
      JWT claim and makes 25 assertions. Disabling RLS on `orders` and `addresses` makes
      9 of them fail, so the test cannot pass vacuously.

Additionally delivered: the guest bag merges on sign-in, reviews can be submitted (as
PENDING, never auto-published), the wishlist heart works from the product page, and the
open-redirect on `?next=` is closed.

## Phase 4 — Admin CMS
- [ ] `/admin` returns 404 for `CUSTOMER` role, verified in middleware and in RLS
- [ ] Dashboard renders 12 metrics and 3 charts from real aggregates
- [ ] CRUD for products, categories, inventory, orders, customers, coupons, reviews,
      content, blog, SEO, settings, users
- [ ] Role matrix enforced: SUPER_ADMIN / ADMIN / MANAGER / EDITOR / CUSTOMER
- [ ] Every inventory change writes a transaction row

## Phase 5 — Intelligence
- [ ] Shopping assistant answers only from catalog tool-call results; invents nothing
- [ ] Admin assistant scoped to the caller's permissions
- [ ] GA4, Search Console, Meta Pixel, Google Ads wired behind consent

---

## Quality bars (all phases)

| Metric | Target |
|---|---|
| Lighthouse Performance (landing, mobile) | ≥ 95 |
| Lighthouse Accessibility | 100 |
| Lighthouse SEO | 100 |
| `tsc --noEmit` | 0 errors, strict mode |
| Largest Contentful Paint | < 2.0s |
| Cumulative Layout Shift | < 0.05 |
| Tables without RLS | 0 |
| Secrets in client bundle | 0 |
