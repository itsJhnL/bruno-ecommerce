# BRUNO — Premium Apparel

A production-shaped luxury e-commerce platform: a server-rendered storefront, a working
cart and Stripe checkout, and (from Phase 4) a protected admin CMS, sharing one Supabase
Postgres database.

**Phases 1 and 2 are complete and building** — storefront, cart, coupons, checkout,
Stripe settlement and transactional email. Read `docs/status.md` for exactly what is
live and what is deliberately inert; nothing in this repo pretends to work.

---

## Read these first

| File | What it is |
|---|---|
| `PRD.md` | Requirements, scope, phase plan, non-functional targets |
| `Goals.md` | The measurable definition of done |
| `Design.md` | The liquid-glass design system — normative, read before touching visuals |
| `Agents.md` | The working agreement: directory contract, naming, data-access rules |
| `Memory.md` | Decision log. Read first, update last |
| `docs/status.md` | Live vs. stubbed, and what you must do before anything talks to a database |

---

## Getting it running

### 1. Install

```bash
npm install
```

### 2. Create a Supabase project

At [supabase.com](https://supabase.com). Then, in the **SQL Editor**, paste
`supabase/apply-all.sql` and run it. That is all nine migrations plus the seed, in order,
inside one transaction.

```
supabase/apply-all.sql      <- paste this
```

It is a generated file: `npm run db:bundle` rebuilds it from `supabase/migrations/*.sql`
and `supabase/seed.sql`, and `npm run test:db` proves it applies cleanly to an empty
PostgreSQL 16 and produces the expected counts and functions. The seed gives you 14
products, 97 variants, 6 categories, 20 reviews, 4 journal articles, 3 shipping methods,
4 coupons and the full CMS content set.

If you prefer to run the files individually, they are in `supabase/migrations/`, numbered,
and must go in numeric order with `supabase/seed.sql` last.

### 3. Environment

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY` from Project Settings → API.

For payment, add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`, and forward events
while developing:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Without Stripe keys the checkout form still renders, but the pay button is disabled and
says why. It never simulates a payment.

> The service-role key bypasses Row Level Security. It must never be prefixed
> `NEXT_PUBLIC_`, and `lib/supabase/admin.ts` imports `server-only` so that importing it
> from a Client Component is a build error rather than a leak.

### 4. Run

```bash
npm run dev
```

### 5. Make yourself an admin

Register through the app, then in the SQL Editor:

```sql
update profiles set role = 'SUPER_ADMIN' where email = 'you@example.com';
```

### It works before you do any of this

Every read in `lib/queries` falls back to a curated static catalogue when Supabase is
unconfigured (Memory.md D-011), so `npm run dev` gives you the full storefront
immediately. Writes never fall back — they fail loudly.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit`, strict |
| `npm run lint` | ESLint, `next/core-web-vitals` + `next/typescript` |
| `npm run test:db` | 59 checkout assertions plus a proof that `apply-all.sql` applies |
| `npm run db:bundle` | Rebuild `supabase/apply-all.sql` from the migrations and seed |
| `npm run images` | Regenerate the SVG image set |
| `npm run db:types` | Regenerate `types/database.ts` from Supabase |

Run `npm run db:types` after **every** migration. `types/database.ts` is generated;
the hand-written version in the repo is a Phase-1 stand-in.

---

## Architecture in one screen

```
app/(storefront)/      public routes — landing, catalogue, product, journal, CMS pages
app/sitemap.ts         generated from live data
components/ui/         primitives only — no data fetching, no business logic
components/storefront/ composed sections
components/seo/        JSON-LD emitters
lib/queries/           every read path
lib/actions/           every write path — Server Actions, Zod-validated
lib/cart/              cart ownership: the cookie, and the one service-role exception
lib/stripe/            server-only Stripe client
lib/email/             transactional templates and the single send path
lib/validations/       Zod schemas shared by client forms and server guards
lib/supabase/          server / browser / admin clients + middleware
lib/fallback-catalog.ts generated from seed.sql — do not hand-edit
supabase/migrations/   forward-only SQL
supabase/tests/        PGlite harness — migrations + end-to-end commerce assertions
scripts/               image generation
legacy/                the original Vite prototype, kept for reference
```

`Agents.md` §3 is the enforceable version of this. Business logic never lives in a
component.

### Where money is decided

In Postgres. `price_cart()` computes lines, subtotal, discount, shipping, tax and total;
the cart page, the checkout summary and the order are all rendered from its output, and
`create_order_from_cart()` re-prices from scratch under a row lock before writing. The
browser sends variant ids and quantities — never a price. Before redirecting to Stripe,
the session total is compared with the order total; a mismatch charges nothing.

Stock is *reserved* at checkout and only decremented once a signature-verified webhook
confirms payment, so an abandoned checkout returns the piece to sale and a replayed
webhook is a no-op. Every movement writes an `inventory_transactions` row.

---

## Theming and type

Three themes — **Light**, **Dark**, **System** — with dark as the default. The choice
lives in `localStorage` and is applied by a synchronous inline script in `<head>` before
first paint, so there is no flash. `System` attaches a live `matchMedia` listener, so
changing your OS appearance updates an open tab.

Everything keys off `data-theme` on `<html>`. Components never reference a raw colour:
they use semantic tokens (`canvas`, `ink-*`, `accent-*`, `hairline-*`, `tint-*`) defined
once in `app/globals.css`. Adding a third theme would be a block of token overrides, not
a refactor. `Design.md` §2 and §10 are normative.

Type is **Jost** (display) and **Inter Tight** (body), self-hosted at build time by
`next/font` — no request to Google on first paint.

## Imagery

There was no image-generation model available, and stock photography would not be
exclusive to the brand — so every image is procedurally generated SVG in the house
palette. They are deterministic, resolution-independent, and total ~620KB for the set.

Products are drawn as **garments**, not as fabric swatches. `scripts/garments.ts` holds
thirteen silhouettes — coat, topcoat, blazer, biker, crew, rollneck, shirt, overshirt,
trouser, scarf, wrap, belt, bag — with the construction that makes each one recognisable
at thumbnail size: notch lapels, plackets, ribbed hems, pressed creases, zips, buckles,
handles. `scripts/generate-images.ts` supplies the material, the raking light and the
obsidian ground. The second plate for each product is the same garment moved closer, so
the weave and stitch gauge scale the way a macro lens would.

This is illustration and does not pretend to be photography — see Memory.md D-026 for
what rendering it taught, including why a lapel drawn as one outline reads as a leaf.

**To swap in real photography**, see `supabase/images.sql`. Images live in the
`product_images` table, so it is a data change, not a code change.

Because media lives in the `product_images` table, replacing them with real photography
later is a data change, not a code change: upload to Supabase Storage and update the
`url` column. `scripts/generate-images.ts` is where the pipeline lives if you want to
point it at an AI image model instead.

---

## Notes on this repo's history

This folder previously held a Vite + React SPA, and then a partial Next.js scaffold
configured for **Tailwind v3 + shadcn CLI**. This build uses **Tailwind v4**, which is
configured in CSS (`@theme` at the top of `app/globals.css`) rather than in a config file
— see Memory.md D-002.

Two leftovers from that scaffold are now stubs and **safe to delete**:

- `tailwind.config.ts` — replaced with a comment explaining that v4 does not read it
- `.eslintrc.json` — superseded by `eslint.config.mjs` (flat config)

`legacy/` holds the original Vite prototype. Delete it whenever you no longer want the
reference.
