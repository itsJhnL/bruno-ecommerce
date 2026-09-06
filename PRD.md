# BRUNO — Product Requirements Document

**Product:** BRUNO Premium Apparel — luxury e-commerce platform
**Owner:** John Leo Bruno
**Status:** v1.0 — Foundation & Storefront
**Last updated:** 2026-09-05

---

## 1. Summary

BRUNO is a production-grade e-commerce platform composed of two applications sharing one
Supabase Postgres database:

1. **Storefront** — a public, SEO-first, server-rendered luxury shopping experience.
2. **Admin CMS** — a protected dashboard where the business is run without touching code.

The visual language is *liquid glass*: layered translucency, refracted light, deep
near-black ground, warm metallic accent. The commercial positioning is exclusivity —
limited runs, membership, atelier storytelling.

## 2. Problem statement

The existing project (`bruno-ecommerce`) is a Vite + React single-page prototype with
hard-coded product data in `src/data/products.js`. It cannot be indexed well by search
engines, has no persistence, no authentication, no order capture, and no way for the
business owner to change anything without a developer and a redeploy.

## 3. Goals

| # | Goal | Success measure |
|---|------|-----------------|
| G1 | Replace hard-coded data with a normalized Postgres database | Zero product/content literals in application code |
| G2 | Ship an SEO-first storefront | Every product, category and article has server-rendered metadata + JSON-LD |
| G3 | Give the owner full CMS control | Products, content, orders, coupons, SEO all editable in `/admin` |
| G4 | Take real money safely | Stripe Checkout + webhook-confirmed orders; no PAN ever touches our DB |
| G5 | Feel expensive | Liquid-glass design system, Lighthouse ≥ 95 on the landing page |
| G6 | Be secure by default | RLS on every table; service-role key never reaches the browser |

## 4. Non-goals (v1)

- Multi-currency and multi-language storefronts
- Marketplace / multi-vendor
- Native mobile apps
- Subscription billing (membership is a tier, not a recurring charge, in v1)
- Warehouse / 3PL integration beyond a tracking-number field

## 5. Personas

**Amara — the customer.** Shops on a phone, at night, in bed. Judges the brand in the
first 800ms. Will abandon over a jarring layout shift or a cheap-looking photo. Wants to
feel she found something other people have not.

**Leo — the operator.** Not a developer. Adds a product between meetings. Needs to see
today's revenue, what is running out of stock, and which orders have not shipped, in one
screen, without reading a manual.

**Sam — the editor.** Writes journal articles and changes homepage copy. Must never be
able to see customer PII or issue a refund.

## 6. Scope by release

### Phase 1 — Foundation & Storefront *(this release)*
- Planning docs, database schema, RLS, seed data
- Next.js 15 App Router + TypeScript + Tailwind v4 scaffold
- Liquid-glass design system and generated brand imagery
- Landing page: hero, featured, categories, storytelling, values, testimonials,
  membership CTA, journal teaser, newsletter, FAQ
- Catalog: search, category / price / attribute filters, sort, pagination
- Product detail: gallery, variants, quantity, add-to-cart, reviews, related
- SEO: dynamic metadata, sitemap, robots, Product / Organization / Breadcrumb schema

### Phase 2 — Commerce
Cart persistence (guest + account), coupons, tax and shipping calculation, Stripe
Checkout, webhook order capture, order confirmation, transactional email.

### Phase 3 — Accounts
Register / login / reset, profile, addresses, order history and tracking, wishlist,
review submission with verified-purchase badges.

### Phase 4 — Admin CMS
Dashboard analytics, products, categories, inventory, orders, customers, coupons,
reviews, content, blog, SEO, settings, users and roles.

### Phase 5 — Intelligence
AI shopping assistant (catalog-grounded, tool-calling), AI admin assistant
(RBAC-scoped), analytics integrations, Meta Pixel, Google Ads conversions.

## 7. Functional requirements

### 7.1 Storefront
- **FR-S1** Homepage renders hero, featured products, categories, best sellers, new
  arrivals, promotional banners, testimonials, newsletter, FAQ and CTAs, all sourced
  from the database.
- **FR-S2** Catalog supports full-text search, category filter, price range, attribute
  (size / colour / material) filters, sort (featured, price asc/desc, newest, best
  selling) and pagination.
- **FR-S3** Product detail shows gallery, name, description, price, sale price, SKU,
  stock, variants, quantity selector, add-to-cart, buy-now, wishlist, reviews, related
  products, frequently bought together, shipping and returns info, and FAQ.
- **FR-S4** Product badges (New, Limited, Best Seller, Low Stock, Sold Out) derive from
  data, never from hand-authored strings.
- **FR-S5** Out-of-stock variants are selectable but not purchasable, and say why.

### 7.2 Cart & checkout
- **FR-C1** Cart persists for guests via an anonymous cart token cookie and merges into
  the customer's cart on login.
- **FR-C2** Totals are computed server-side. The client never decides a price.
- **FR-C3** Coupons validate against active window, usage limits, minimum order value
  and product/category scope.
- **FR-C4** Checkout collects contact, shipping address, shipping method, payment, and
  shows a review step before charge.
- **FR-C5** Stripe Checkout is the payment surface. Orders become `paid` only on a
  verified `checkout.session.completed` webhook, never on client redirect.

### 7.3 Accounts
- **FR-A1** Email/password auth via Supabase, with password reset.
- **FR-A2** Customers manage profile, addresses, wishlist, and view order history and
  tracking.
- **FR-A3** A customer can only ever read their own rows. Enforced in the database.

### 7.4 Admin
- **FR-D1** `/admin/*` is unreachable to any account whose role is `CUSTOMER`.
- **FR-D2** Dashboard shows revenue, orders, customers, AOV, conversion rate, units
  sold, low stock, pending orders, recent orders, top sellers, revenue over time and
  sales by category.
- **FR-D3** Full CRUD for products, variants, images, categories, inventory, orders,
  coupons, reviews, pages, banners, FAQs, testimonials, blog posts and settings.
- **FR-D4** Every product, category and article carries editable SEO title, meta
  description, slug, canonical URL, OG image and image alt text.
- **FR-D5** Inventory changes write an immutable `inventory_transactions` row.
- **FR-D6** Order status transitions are validated; refunds go through Stripe.

### 7.5 SEO
- **FR-E1** Server-rendered `<title>`, meta description, canonical, OG and Twitter tags
  per page, sourced from the CMS with sane fallbacks.
- **FR-E2** `sitemap.xml` and `robots.txt` generated from live data.
- **FR-E3** JSON-LD: Organization, Website, BreadcrumbList, Product (with Offer and
  AggregateRating), Article, FAQPage.
- **FR-E4** Clean slugs, no query-string-only pages in the index, breadcrumbs on all
  deep pages.

## 8. Non-functional requirements

| Area | Requirement |
|------|-------------|
| Performance | LCP < 2.0s on 4G mobile; CLS < 0.05; INP < 200ms; landing page ships < 120KB of first-party JS |
| Accessibility | WCAG 2.2 AA: 4.5:1 text contrast, visible focus, keyboard-operable, `prefers-reduced-motion` honoured |
| Responsive | Verified at 375 / 768 / 1024 / 1440px; no clipping under 200% zoom |
| Security | RLS on every table; service-role key server-only; Zod validation on every mutation; rate limiting on auth and checkout |
| Reliability | Stripe webhooks idempotent by event id; order writes transactional |
| Scale | Designed for 10k SKUs and 100k orders; every foreign key and filter column indexed |
| SEO | Server-rendered HTML for all indexable routes |

## 9. Technology

Next.js 15 (App Router, RSC) · TypeScript (strict) · Tailwind CSS v4 · shadcn-style
primitives on Radix · Supabase (Postgres, Auth, Storage, RLS) · Stripe · Resend ·
Vercel. No jQuery.

## 10. Risks

| Risk | Mitigation |
|------|-----------|
| Scope is very large | Phased releases; each phase independently shippable |
| Liquid glass hurts contrast and performance | Contrast tokens validated at AA; blur capped and disabled under `prefers-reduced-motion`; no blur on scroll-linked surfaces |
| Generated imagery reads as "placeholder" | Art-directed procedural compositions with consistent grain, gradient mesh and monogram system; an AI-image pipeline can replace them later without code changes |
| RLS misconfiguration leaks data | Policies written per table with explicit deny-by-default; a test checklist in `docs/security-checklist.md` |
| Stripe test/live key mixups | Keys read only from server env; separate Vercel environments |

## 11. Open questions

1. Legal entity, shipping origin and tax jurisdictions for tax calculation.
2. Real product photography timeline — does the generated set ship to production?
3. Membership: does it eventually become a paid recurring tier?
4. Fulfilment: manual, or a 3PL integration in Phase 2?
