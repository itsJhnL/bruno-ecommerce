# Status — what is live, what is not

Updated 2026-09-06, end of Phase 3. Per Agents.md prime directive #1, nothing here
pretends to work.

> **Live at https://bruno-ecommerce.vercel.app — all 40 route checks pass against
> production.** Two settings had to be corrected to get there, both outside the
> repository: the Vercel **Root Directory** was still `legacy` (the old Vite SPA), and
> `.vercelignore` used unanchored patterns so `supabase/` also removed `lib/supabase/`.
> Memory.md D-041 and D-042.
>
> **Checkout cannot take payment yet.** Production has only five environment variables —
> `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
> `NEXT_PUBLIC_SITE_URL`, `EMAIL_FROM`. The Stripe keys are absent, so the pages render
> but the payment step will fail. See "Not connected in production" below.

> **Right now: the schema is applied, but the seed was run twice.** Several tables have
> duplicate rows — most visibly `navigation_items`, so the header lists every link twice.
> Fix it in one step: paste `supabase/fix-duplicates.sql` into the Supabase SQL editor
> and run it. It removes the duplicates and adds the unique constraints that stop it
> happening again (Memory.md D-034).

## Verified

These were checked by running them, not by reading them.

| Check | Result |
|---|---|
| All 10 migrations, in order, against empty PostgreSQL 16 | ✅ applied clean |
| `supabase/seed.sql` on top of them | ✅ 14 products · 97 variants · 3 shipping methods · 4 coupons |
| Tables in `public` without RLS enabled | ✅ 0 |
| `anon` can read products · cannot read orders, carts, `email_log` | ✅ 14 / 0 / 0 / 0 rows |
| **Phase 2 checkout flow, 59 assertions end to end** | ✅ all pass |
| `npx tsc --noEmit` (strict) | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors, 0 warnings |
| `npm run build` | ✅ 38 routes |
| Storefront still prerendered after the cart shipped | ✅ landing, category, product all static |
| Populated cart and checkout rendered at 1440px | ✅ line items, steppers, coupon chip, totals, delivery options |
| Unconfigured cart and checkout rendered at 1440px | ✅ both say what is missing, neither shows an empty bag |
| `next` upgraded 15.1.6 → 15.5.25 | ✅ CVE-2025-66478 patched; build, lint and types re-verified |
| All 14 products rendered as a contact sheet | ✅ each one identifiable by shape alone, at thumbnail size |
| Detail crops rendered | ✅ lapel, zip, neckline, placket, crease, buckle, handle, loop |
| Catalogue and product pages rendered with the new imagery | ✅ reads as a shop, not a swatch book |
| `supabase/apply-all.sql` applied to an empty PostgreSQL 16 | ✅ one transaction, 14 products, 0 tables without RLS, all 8 called functions present |
| Production build **with Supabase configured** | ✅ was failing before this was tested; see Memory.md D-027 |
| Static generation with Supabase configured | ✅ `/`, `/cart`, `/journal`, `/membership`, `/sitemap.xml` prerendered; only checkout and API routes dynamic |
| Live project probed with the service role | ✅ correctly reports schema missing rather than guessing |
| **RLS customer isolation, 25 assertions** | ✅ all pass — and **verified failing-by-default**: disabling RLS on `orders` and `addresses` made 9 of them fail, including the write |
| **Seed idempotency, 28 assertions** | ✅ the seed now runs twice with zero duplication — and **verified failing-by-default**: without migration 0010 it reports 10 failures matching the live database exactly |
| Header with a duplicated menu | ✅ nav scrolls; account and bag icons stay visible |
| **40 routes checked for HTTP status** (`npm run test:http`) | ✅ all correct — including that missing products/categories/articles/pages return **404, not a soft 404** |
| Horizontal overflow at 375 / 414 / 768 / 1024 px | ✅ `scrollWidth` equals the viewport on every storefront page, measured over the DevTools Protocol |
| Cart pricing against the **live** Supabase project | ✅ subtotal, shipping, coupons and totals all correct on real data |
| **Deployment rehearsal**: tracked files only, `.vercelignore` applied, fresh `npm ci`, no env vars | ✅ builds 42 routes and passes all 40 route checks — proves nothing the build needs is excluded from the upload |
| **Production build on Vercel**, after fixing Root Directory and `.vercelignore` | ✅ `Route (app)` table complete, `Removed 59 ignored files` (was 64), static params generated from the live database |
| **`npm run test:http -- https://bruno-ecommerce.vercel.app`** | ✅ ALL 40 ROUTES OK — including real 404s and signed-out `/account` redirects |
| Homepage served from production | ✅ 406 KB, 9 product links, 303 `images.unsplash.com` references — real catalogue data, not fallback |

## Not connected in production

| Capability | Blocker |
|---|---|
| Taking payment | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` are not set on Vercel. Add them, then point a Stripe webhook at `/api/webhooks/stripe`. |
| Transactional email | `RESEND_API_KEY` and `ADMIN_NOTIFICATION_EMAIL` are not set on Vercel. `email_log` is still written, so nothing is lost — it just does not send. |
| Photo credits | `product_images.credit` does not exist in the live database, because the photography was applied over REST, which cannot run DDL. Nothing reads the column. One line fixes it: `alter table product_images add column if not exists credit text;` |
| `/account` with no session | ✅ redirects to `/login?next=/account` |
| `app/favicon.ico` | ✅ real multi-image ICO (16/32/48), verified by file signature — previously a 200 serving Next's HTML 404 |
| Open Graph cards | ✅ 21 PNGs at 1200x630, verified as `PNG image data, 1200 x 630` |
| `og:image` on a product page | ✅ absolute URL, `.png`, with width/height/alt |
| Icon legibility at 16px | ✅ rendered and checked, not assumed |

### What the checkout flow test covers

Run it with `npm run test:db` (see "Testing the SQL" below).

- `ensure_cart` creates and is idempotent, for guests and customers
- Subtotal equals the sum of live variant prices; `item_count` counts units
- Coupons: unknown code rejected with a reason · members-only rejected for a guest ·
  percentage capped by `maximum_discount` · minimum-order enforced · `FREESHIP` zeroes
  shipping · product-scoped coupon discounts only qualifying lines · scoped coupon
  matching nothing is rejected
- Shipping: paid rate added · `free_over` threshold honoured · total is the sum of parts
- Order creation: totals written by the database · coupon, shipping method and line
  snapshots · billing defaults to shipping · **stock reserved, not decremented** ·
  reservation written to the ledger
- Settlement: order reaches PAID · stock decremented · reservation released · payment row
  holds Stripe references only and **no column could hold a card number** · coupon
  redemption recorded and `used_count` incremented · staff notified · the right cart
  cleared and **another shopper's cart untouched** · the pending payment row updated
  rather than duplicated
- Idempotency: a replayed webhook is a no-op and does not double-decrement
- Refusals: empty cart · overselling · `price_cart` flags the unavailable line
- Failure: a failed payment releases the reservation and cancels the order
- Guest merge: quantities add, the guest cart is removed

**Bundle:** 103 kB shared JS — *down* 2 kB from Phase 1 despite the cart, because the
Next upgrade rebalanced the chunks. Landing page 129 kB first load, cart 128 kB,
checkout 137 kB. The PRD target of <120 kB of first-party JS is still **not met**; the
gap is React plus Radix, and it needs either a decision to revise the target or a pass
at trimming client components.

## Live and wired

| Feature | Notes |
|---|---|
| Landing, catalogue, product, category, journal, CMS pages | Phase 1, unchanged |
| SEO | `generateMetadata`, canonical, OG/Twitter, sitemap, robots, JSON-LD |
| **Cart** | Guest (httpOnly cookie) and customer. Add, update, remove, drawer and full page. Priced by `price_cart()` in Postgres |
| **Coupons** | Applied and removed on the cart; window, usage limit, per-customer limit, minimum order, members-only, and product/category scope all enforced server-side |
| **Checkout** | One page, four labelled steps. Email, address, delivery, review. Country-aware postal and region labels |
| **Payment** | Stripe Checkout, hosted. Order created PENDING; only a signature-verified webhook can mark it PAID |
| **Inventory** | Reserved at checkout, decremented on payment, released on failure. Every movement writes a ledger row |
| **Email** | Order confirmation to the customer; new-order, payment-failed and low-stock notices to staff. Every send recorded in `email_log`, including SKIPPED |
| **Newsletter** | Writes to `newsletter_subscribers`; an address already present is thanked, not errored |
| **Membership applications** | Writes to `membership_applications` and raises a staff notification |
| **Accounts** | Register, sign in, sign out, password reset. Supabase Auth; `/auth/callback` exchanges the emailed code server-side so no page renders signed-out first |
| **Guest bag merge** | A guest's bag folds into their own on sign-in, quantities adding |
| **Order history** | List, detail, progress and tracking — read under the customer's own session |
| **Addresses** | Saved address book with one default per type, enforced by a partial unique index |
| **Wishlist** | Heart on the product page and a saved grid, sharing the one viewer request |
| **Reviews** | Submitted as PENDING and invisible until moderated. The verified-purchase badge is decided server-side from order history, never sent by the client |

## Rendered but deliberately inert

Nothing. Every control on the storefront now does what it appears to do —
`PendingAction` is no longer used anywhere, though the component is kept for the next
time something has to be honestly disabled.

`mergeGuestCartIntoProfile()` is now called from `afterSignIn()` in
`lib/actions/auth.ts`, which is what Phase 2 wrote it for.

## Degrades honestly

There are **three** states, not two, and the difference matters because the fixes are
different. `getStoreHealth()` resolves them with one cheap query:

| State | Meaning | What the UI says |
|---|---|---|
| `unconfigured` | No Supabase keys in `.env.local` | "No database is connected" — add the keys |
| `unreachable` | Keys work, but no tables exist | "The database has no schema yet" — run `supabase/apply-all.sql` |
| `ready` | Schema applied | Normal behaviour |

Before this distinction existed, a project with keys and no schema showed **"Your bag is
empty"** — a true-looking sentence covering a completely broken system, and exactly what
directive #1 forbids (Memory.md D-029).

| Surface | No Supabase | No schema | No Stripe |
|---|---|---|---|
| Add to bag | Error naming the missing configuration | "Run supabase/apply-all.sql" | — |
| Cart page / drawer | "No database is connected" | "The database has no schema yet" | — |
| Checkout | Form not rendered | Form not rendered | Form renders, pay button disabled, banner explains |

Server Actions map PostgREST's `PGRST205` and `PGRST202` to the schema message rather
than "please try again", because trying again could never have worked.

## Not built

Admin CMS · review moderation UI · refunds UI · AI assistants · analytics integrations.
See PRD.md §6.

Reviews can be *written* but not yet *approved*, so a new review stays invisible until
there is a moderation screen (Phase 4). That is the correct failure mode — the
alternative is publishing unmoderated text — but it does mean a submitted review will not
appear on the site yet, and the form says so.

## Imagery

> **The storefront is currently showing licensed stock photographs, not your products.**
> They are real photographs of real garments, but a cashmere overcoat here is *a*
> cashmere overcoat, not *the* one you are selling. Fine for a demo or a pitch;
> **not fine for a live shop** — showing one garment and shipping another is
> misrepresentation. Replace them with photographs of your actual stock before taking
> money. `supabase/images.sql` recipe A or C does it; `product_images.credit` marks which
> rows are still stock.

Applied by `node --env-file=.env.local scripts/apply-photography.mjs`, reversible with
`--revert`. The same mapping is in `supabase/real-photography.sql` for the SQL editor.
37 photographs: 14 products (main plus a material detail), 6 categories, 2 banners,
4 journal posts, 3 story blocks. Every URL was checked for HTTP 200 and every photograph
was rendered and looked at before being assigned.

`images.unsplash.com` had to be added to `remotePatterns` in `next.config.mjs`. **An
unlisted host is not a broken picture — `next/image` throws and the whole route 500s.**
Add a CDN there before pointing the database at it.

### The generated illustrations are still there

Behind the photographs, every image is also available as procedurally generated SVG
(`npm run images`), and `scripts/apply-photography.mjs --revert` puts them back.

The first version drew every product as the same arch of lit cloth. It was handsome and
useless: at thumbnail size a belt and an overcoat were the same picture. Products are now
drawn as garments — `scripts/garments.ts` holds thirteen silhouettes with lapels,
plackets, ribbing, creases, zips, buckles and handles — while `scripts/generate-images.ts`
supplies the material, the raking light and the ground.

| | |
|---|---|
| Product plates | 28 (14 garments × front + detail crop), SVG |
| Share cards | 21 PNG at 1200×630 — brand, 14 products, 6 categories |
| App icons | `app/icon.svg`, `app/favicon.ico` (16/32/48), `app/apple-icon.png` (180) |
| Total weight | ~424 KB product plates, ~13 KB each |
| Determinism | Seeded by slug — same input, same picture, every build |

**Raster assets exist for a reason.** Social platforms do not render SVG: an
`openGraph.images` entry pointing at `.svg` shows no picture at all on X, Facebook,
LinkedIn, Slack or WhatsApp, and fails silently until somebody shares the page. The cards
are therefore PNG, produced by `npm run images:raster`, which drives headless Chrome so
no native image library enters the project. **The PNGs are committed**, so an ordinary
build never needs a browser — re-run the rasteriser only when the artwork changes.

`lib/utils/og.ts` is the single place that decides a page's share image: an explicit CMS
`og_image_url` wins, then a generated card if one exists for that slug, then the brand
card. A product added through the admin after the last run falls back to the brand card
rather than linking a 404.

The second plate for each product is the *same* garment moved closer, not a different
picture, so the weave and stitch gauge scale with it the way a macro lens would.

**This is illustration, not photography, and it does not pretend otherwise.** Because
media lives in the `product_images` table, replacing it with real photography is a data
change: upload to Supabase Storage and update the `url` column. No code changes.

`supabase/images.sql` is the cookbook. Run it as-is for a read-only report on what every
product has; the recipes below the line — replace one image, add an angle, bulk-swap to a
bucket, restore the generated plates, repair a missing primary flag — are commented out,
and every one of them has been executed against PostgreSQL 16 to prove it runs.

## Known gaps and caveats

1. **`types/database.ts` is hand-written.** It now covers the commerce tables too. Run
   `npm run db:types` against your project to replace it. Keep the row shapes as `type`,
   not `interface`, or PostgREST inference silently resolves every query to `never`.
2. **First-load JS is 132 kB**, above the PRD's <120 kB target.
3. **Conversion rate on the admin dashboard** depends on `analytics_events` rows that
   nothing writes yet, so it will read 0 until Phase 5.
4. **Guest carts have no RLS policy by design** — they are addressed by an unguessable
   cookie token and reached only through `lib/cart/session.ts` using the service role
   (Memory.md D-019). Signed-in customers' carts are protected by RLS as well.
5. **Tax is a flat rate** from `site_settings['commerce.tax_rate']`, seeded at 0. Real
   jurisdiction-aware tax means Stripe Tax or an equivalent, and is not built.
6. **Stripe has not been exercised against a live account** in this environment — there
   are no keys here. The database side of checkout is fully tested; the Stripe calls are
   not. Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and place a
   test order before trusting it in production.
7. **The populated cart and checkout were rendered against a temporary fixture**, not a
   live database, because there is no Supabase project here. Layout, states and totals
   display are verified; the wiring between them and Postgres is verified separately by
   `npm run test:db`. The fixture was removed and is not in the repository.
8. **Abandoned orders are released by the webhook** on `checkout.session.expired`, one
   hour after the session is created. There is no sweeper for orders whose webhook never
   arrives; that belongs with the admin CMS in Phase 4.
9. **Lighthouse has not been run.** The performance targets in Goals.md are unverified.
10. **Refunds** are recorded when Stripe reports `charge.refunded`, but nothing in the
   application can *initiate* one yet. That is Phase 4.
11. **Product imagery is illustration.** The garments are drawn, not photographed, and
   two shirts that differ only in cloth share a silhouette. It reads as a real shop at
   thumbnail size, which is what it is for — it is not a substitute for a photographer.

## Before anything talks to a database

1. Create a Supabase project
2. **Supabase dashboard -> SQL Editor -> New query -> paste `supabase/apply-all.sql` -> Run.**
   That is all nine migrations and the seed, in order, in one transaction. It is
   regenerated by `npm run db:bundle` and tested by `npm run test:db`.
3. `cp .env.example .env.local` and fill it in
4. Regenerate the types: `npx supabase gen types typescript --project-id <id> --schema public > types/database.ts`
5. `npm install && npm run dev`

For payment, add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`, and point a webhook at
`/api/webhooks/stripe` for `checkout.session.completed`, `checkout.session.expired`,
`checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` and
`charge.refunded`.

Until then the storefront runs on the curated fallback catalogue (Memory.md D-011), and
every write path says so instead of pretending.

## Testing the SQL

The migrations and the whole checkout flow are verified against a real PostgreSQL 16
engine using [PGlite](https://pglite.dev), which needs no server, no Docker and no
Supabase project:

```
npm run test:db
```

- `supabase/tests/apply.mjs` — applies every migration in order, then the seed, and
  reports the resulting shape
- `supabase/tests/checkout-flow.mjs` — 59 assertions across cart, coupons, order
  creation, settlement, idempotency and refusals

The only shim is that PGlite ships no `pgcrypto` bundle, so the harness strips that one
`create extension` line — `gen_random_uuid()` is core in PostgreSQL 13+ and nothing else
in the schema uses the extension. `citext`, `pg_trgm` and `unaccent` all load for real.

Run this after any migration. It is the difference between SQL that compiles and SQL
that is correct: both settlement bugs in Memory.md D-023 passed `tsc`, `lint` and
`build`, and were caught here.
