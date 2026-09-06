# Memory.md — Decision log and working state

Append-only. Newest entries at the top. Every agent reads this first and updates it last.

---

## Current state — 2026-09-05

**Phase:** 3 of 5 — Accounts complete (Supabase project created; **schema not yet applied**)
**Branch:** rebuild on `main`, original Vite app archived under `legacy/`

| Area | State |
|---|---|
| Planning docs | ✅ PRD, Goals, Design, Agents, Memory |
| Database schema | ✅ 10 migrations + seed, verified against PostgreSQL 16 (PGlite). **Applied to your Supabase project; run `supabase/fix-duplicates.sql` once to clear the double-seed.** |
| Next.js scaffold | ✅ App Router, TS strict, Tailwind v4 |
| Design system | ✅ Semantic tokens, four glass grades, primitives, **light + dark + system** |
| Type system | ✅ Jost (display) + Inter Tight (body), self-hosted |
| Generated imagery | ✅ Procedural SVG asset set |
| Landing page | ✅ Complete, reads from Supabase with static fallback |
| Catalog / product | ✅ Complete |
| Cart | ✅ Guest + customer, server-priced, drawer and full page |
| Coupons | ✅ Window, limits, minimum, per-customer, members-only, product/category scope |
| Checkout | ✅ Stripe Checkout, order created PENDING, webhook settles |
| Email | ✅ Resend, order confirmation + staff notices, logged to `email_log` |
| Newsletter / membership | ✅ Wired to their tables |
| Accounts | ✅ Register, sign in, reset, profile, addresses, orders, wishlist, reviews |
| Admin CMS | ⛔ Phase 4 |
| AI assistants | ⛔ Phase 5 |

**Immediate next actions:** create the Supabase project, apply
`supabase/migrations/*.sql` then `supabase/seed.sql`, fill `.env.local`, run
`npm install && npm run dev`. Then Phase 3 — accounts, so orders have a home.

---

## Decisions

### D-040 · Vercel kept building the app this repo used to be — 2026-09-06
The deploy failed with `sh: line 1: vite: command not found` / `Command "vite build"
exited with 127`. Nothing in the repository asks for Vite: the root `package.json` builds
with `next build`, has no Vite dependency, and the only Vite file left is
`legacy/vite.config.js`, which `.vercelignore` excludes anyway.

**Cause:** the Vercel project was created when this repo *was* the Vite SPA (commit
`e88a5e3`). Framework Preset and Build Command were saved against the project then, and a
saved project setting beats auto-detection — so a year-old dashboard field was still
driving the build.

`vercel.json` now pins `framework: nextjs` and `buildCommand: next build`, which override
the dashboard. **`outputDirectory` is deliberately omitted**: setting it on a Next.js
project makes Vercel serve a static directory and breaks every server route. That means a
stale `dist` output-directory override is *not* fixed by this file and still has to be
cleared by hand — recorded in README so the next person does not assume the JSON covers
everything.

**Worth remembering:** when a build fails with a command nobody in the repo wrote, look
outside the repo. Grepping the source for "vite" would have found only an archived file
and proved nothing.

### D-038 · A `loading.tsx` at the root turned every 404 into a soft 404 — 2026-09-06
In production, `/product/anything-missing` returned **HTTP 200** with a page that said
"404". Same for missing categories, journal entries and CMS pages. A path matching no
route at all correctly returned 404, which is what made it confusing — `notFound()` was
being called, and ignored.

**Cause:** `app/(storefront)/loading.tsx`. A loading boundary makes Next stream the
response, so the shell and its `200 OK` are flushed before the page body runs. A
`notFound()` after that cannot change a status already on the wire.

**Fix:** the boundary now lives on `/collection` alone — the one storefront route that is
genuinely slow (server-side filtering) and can never call `notFound()`. Verified: those
four paths went from 200 to 404, and every real page still returns 200.

**Why it matters more than it looks.** A soft 404 is indexed as a real page. Every
mistyped or retired product URL would have entered the index as a live page saying
"this piece is not in the archive". Status codes are invisible in a browser, which is
exactly why they need a test rather than a look — hence `npm run test:http`
(`scripts/smoke.mjs`), 40 routes with expected statuses, which also runs against a
deployed URL.

### D-039 · Measure the browser, do not read the screenshot — 2026-09-06
A 375px screenshot appeared to show heavy horizontal clipping: announcement bar, search
field and product images all cut off. I changed the header gaps to fix it. **The
screenshot was lying** — `--window-size` in headless Chrome without device emulation does
not set the layout viewport the way a phone does.

Driving Chrome over the DevTools Protocol with `Emulation.setDeviceMetricsOverride` and
asking the page for `document.documentElement.scrollWidth` gave the real answer, and then
the exact culprit: `scrollWidth` 377 against a 375 viewport, from **one element** — the
header icon cluster, overflowing by 2px because the `shrink-0` added in D-034 stopped it
compressing. A `gap-0.5 sm:gap-1` reclaims it. Every storefront page now measures exactly
375.

**Two lessons.** The first guess (tighten every gap) would have "worked" while hiding that
the cause was a change I had made. And a rendering bug needs a measurement, not a look —
`scratchpad/overflow.mjs` asks the browser which elements cross the viewport edge, which
took one run to answer what two rebuilds of guessing did not.

### D-037 · An unset site URL sent paying customers to a domain we do not own — 2026-09-06
`siteUrl()` fell through to the seeded `site.url` when `NEXT_PUBLIC_SITE_URL` was unset —
`https://bruno.example.com`. That value feeds canonicals, OG image URLs, the sitemap,
JSON-LD, password-reset links and **the URL Stripe returns the customer to after paying**.
A Vercel deploy without that one variable would have taken money and then redirected the
buyer to somebody else's domain.

Two faults, not one. The `??` also let a *blank* variable through, which Vercel sets
readily — that produced bare paths instead of absolute URLs. Both are fixed: blank is
treated as absent, and the fallback chain is now explicit site URL, then Vercel's
production domain, then the per-deployment preview URL, then localhost. **The seeded
`site.url` is deliberately no longer a fallback: a plausible wrong answer is worse than an
obviously wrong one.** Seven cases covered by a table test.

**Also verified:** the production build succeeds both with and without Supabase
configured. That matters because the fallback path is the one nobody exercises, and it is
exactly what a fresh Vercel project runs before anyone adds the variables.

### D-035 · Real photography, and the limit of what it can honestly claim — 2026-09-06
The owner asked for photographs rather than drawings. There is still no image model here,
so the honest move was to source **real, commercially-licensed photographs** and wire them
up: 37 Unsplash images across 14 products, 6 categories, 2 banners, 4 journal posts and 3
story blocks, applied by `scripts/apply-photography.mjs` and mirrored in
`supabase/real-photography.sql`.

**Method, because it decides whether the result is any good.** 67 candidates were pulled
from Unsplash search pages, every URL checked for HTTP 200, and then **rendered as a
contact sheet and looked at** before anything was assigned. Assigning stock photos by
filename would have put a Supreme-branded holdall on a house that makes its own — that
image was in the candidate set and was rejected on sight.

**What this is not.** These are photographs of *a* cashmere overcoat, not *the* one being
sold. That is fine for a demo and unacceptable for a live shop — showing one garment and
shipping another is misrepresentation, and in most jurisdictions illegal. The warning sits
at the top of `real-photography.sql`, where somebody about to launch will read it, not
only in a doc. `product_images.credit` records provenance so stock imagery can be found
and replaced.

### D-036 · I asserted a config was correct without opening it — 2026-09-06
Twice I told the owner that `images.unsplash.com` was already allowed in
`next.config.mjs`. **It was not.** The config I was remembering was the one written in the
first session, which D-014 replaced; the surviving version allows only the Supabase
Storage host. Applying the photographs took every page down with
`Invalid src prop … hostname is not configured`.

Worth keeping for two reasons. First, `next/image` does **not** degrade when a host is
unlisted — it throws and the route 500s, so an image mistake becomes an outage. Second,
the failure was entirely avoidable: the file was one `Read` away, and I had already been
told in D-014 that the configs had been swapped. **Memory of a file is not the file.**

### D-034 · "on conflict do nothing" is not idempotency — 2026-09-06
Every insert in `seed.sql` ended with `on conflict do nothing`, and the header of
`apply-all.sql` said the seed was therefore safe to re-run. **That was false.** The
clause catches a *unique violation*; several of these tables had no unique constraint to
violate, so a second run silently doubled them. The owner ran the seed twice and the
header listed every link twice.

Measured on the live project, and reproduced exactly in the test: navigation_items
26 → 52, product_images 28 → 42, reviews 20 → 40, faqs 8 → 16, testimonials 5 → 10,
banners 3 → 6, brand_values 4 → 8, shipping_methods 3 → 6, inventory_transactions
85 → 170. Tables with a natural key — products, categories, coupons, pages, blog posts,
variants — were untouched, which is exactly why the bug was easy to miss.

**Two fixes, because one was not enough.**
1. **Data.** Migration 0010 deletes the duplicates by `ctid` and then adds the unique
   indexes that should have existed, so the original claim finally becomes true.
   `supabase/fix-duplicates.sql` is the same thing, standalone, for a database that
   already has 0001–0009.
2. **Layout.** The doubled menu overflowed and pushed the account and bag buttons off
   the end of the bar — a data mistake became a missing control. The nav is now
   `min-w-0 overflow-x-auto` and the icon cluster `shrink-0`, so too many links scroll
   instead of hiding the things a shopper needs. **Verified against the still-duplicated
   live database**: all four icons present.

**And a test, verified by removing the fix.** `supabase/tests/seed-idempotency.mjs` runs
the seed twice and compares 26 table counts. Without 0010 it reports 10 failures with the
exact numbers above. A claim in a comment is not a guarantee; a test that has been shown
to fail is.

### D-031 · A security test that cannot fail is decoration — 2026-09-06
Goals.md asked for customer isolation "proven by a failing-by-default test". The phrase
is the whole point, so `supabase/tests/rls-isolation.mjs` runs as the **`authenticated`
role with a JWT claim**, which is how PostgREST actually executes a customer's query —
running as `postgres` would bypass RLS and pass whatever the policies said.

Every assertion looks for a *specific absence*: Ada must see exactly one order and
exactly zero of Blaise's, not merely "no error". **Then the test was verified by breaking
the thing it tests**: disabling RLS on `orders` and `addresses` turned 9 of the 25
assertions red, including `Ada's write to Blaise's order changed nothing — hacked`. A
passing security test that has never been shown to fail is worth nothing.

**One trap worth recording:** an `UPDATE` that matches no rows raises no error under RLS.
Asserting "the statement threw" would have passed for the wrong reason; the proof has to
be the value read back afterwards, from outside the customer's role.

### D-032 · One request answers the whole viewer — 2026-09-06
The header needs to know about the bag, the wishlist heart needs to know what is saved,
and both need to know whether anyone is signed in. Three fetches would have been three
round trips on every page, and reading any of it server-side would have made the whole
storefront dynamic (D-020). `/api/cart` became **`/api/viewer`** and returns cart, health
and viewer in one response; `CartProvider` holds all three.

The account icon in the header is a **plain link to `/account`**, with no session check at
all. Middleware redirects a signed-out visitor to `/login?next=/account` and back again
afterwards. The simplest correct thing beat the clever one: no session state, no
hydration mismatch, and the layout stays static.

### D-033 · Where the security decisions actually live — 2026-09-06
Three deliberate choices, each one the boring option:

1. **`lib/actions/account.ts` never touches the service-role client.** Every customer
   write runs under the customer's own session, so RLS decides what is allowed and a
   mistake in a `.eq()` filter cannot become somebody else's data. The `eq(profile_id)`
   clauses are there for correctness, not for security.
2. **`?next=` is validated before every redirect.** Without it, `/login?next=https://evil.example`
   turns the sign-in page into an open redirect — a phishing primitive that arrives
   wearing your domain. `safeNext()` accepts only same-site paths, and rejects `//host`.
3. **Sign-in failures say one thing.** "That email and password do not match an account"
   covers both "no such account" and "wrong password", and the password-reset form
   confirms identically whether or not the address is registered. Distinguishing them
   turns either form into an oracle for which emails have accounts here.

Reviews land as `PENDING` and the verified-purchase flag is computed server-side from
paid orders — the client cannot claim it. Nothing a customer types is published without a
moderator, which is also why review moderation being absent until Phase 4 is a safe gap
rather than a dangerous one.

### D-030 · The images that were actually missing were the raster ones — 2026-09-06
Asked again for imagery, the honest first move was to check rather than regenerate: the
28 product plates existed, resolved, and rendered. Two image assets did **not** exist,
and both fail silently.

1. **No favicon at all.** `/favicon.ico` returned HTTP 200 — serving Next's 105 KB HTML
   404 page. A 200 is not evidence a file exists; the content type is. There is now
   `app/icon.svg`, `app/favicon.ico` (16/32/48) and `app/apple-icon.png` (180).
2. **Every Open Graph image was an SVG.** No major platform renders SVG — X, Facebook,
   LinkedIn, Slack and WhatsApp all drop the image and show a bare link. The site had
   `openGraph.images` pointing at `.svg` on the root layout and on every product,
   category and journal page. There are now 21 PNG cards at 1200x630, and
   `lib/utils/og.ts` is the only place that decides which one a page uses.

**Mechanics worth keeping.** The rasteriser drives headless Chrome, so no native image
dependency enters the project, and it writes a real multi-image `.ico` by hand — the
format is just a small header wrapping whole PNG files, so no encoder is needed. The
wordmark on those cards is **outlines, not text**: they are rasterised on a machine whose
fonts you do not control, and the old `seal.svg` still asked for Cormorant Garamond, a
face dropped at D-017. The PNGs are committed, so an ordinary `npm run build` never needs
a browser; `npm run images:raster` is only for when the art changes.

**Also found:** `app/layout.tsx` declared `icons: { icon: "/images/brand/seal.svg" }`,
which raced Next's own file conventions and emitted a second, stale icon link. Removed —
the convention files are enough.

### D-027 · Configuring Supabase broke the build, and then the landing page — 2026-09-06
Adding real credentials to `.env.local` exposed two faults that were invisible while
Supabase was unconfigured, because `createClient()` returned `null` before touching
anything.

1. **The production build failed.** `generateStaticParams` and `sitemap.ts` run outside a
   request, where `cookies()` throws. With Supabase configured the client reached that
   call and the build died collecting page data for `/category/[slug]`. `createClient()`
   now catches it and falls back to a sessionless anon client.
2. **The landing page silently stopped being static.** Merely *touching* `cookies()`
   during render opts a route into dynamic rendering, so `/`, `/journal`, `/membership`,
   `/cart` and `/sitemap.xml` all flipped from `○` to `ƒ` — against a Goals.md target of
   LCP < 2.0s on a page that had been prerendered all along. Public reads
   (`lib/queries/catalog.ts`, `content.ts`, and the public half of `cart.ts`) now use
   `createAnonClient()`, which has no cookies to touch. Session-bound reads — a
   customer's own orders, the checkout prefill — keep the request client.

**The lesson worth keeping:** the fallback path was hiding a broken real path. Anything
that behaves differently when unconfigured needs testing in *both* states, and "it built
yesterday" means nothing if yesterday's build never reached the code.

### D-028 · One SQL file, and a test that it applies — 2026-09-06
Applying nine migrations plus a seed by hand, in order, through a dashboard is a step
that gets done wrong once and then debugged for an hour. `npm run db:bundle` concatenates
them into `supabase/apply-all.sql`, wrapped in a single transaction, and
`supabase/tests/bundle.mjs` proves that file applies to an empty PostgreSQL 16 and yields
the expected counts and functions. The bundle is what a human actually pastes, so the
bundle is what gets tested — not just the migrations it was built from.

### D-029 · "Configured" and "working" are different states — 2026-09-06
With keys present but no schema applied, the cart said **"Your bag is empty."** That is
the precise failure Agents.md directive #1 exists to prevent: a true-looking sentence
covering a broken system. There are now three states — unconfigured, unreachable, ready —
resolved by `getStoreHealth()` with one cheap query, and `StoreUnavailable` renders the
right explanation for each. Server Actions map PostgREST's `PGRST205` / `PGRST202` to
"run supabase/apply-all.sql" instead of "please try again", because trying again could
never have worked.

### D-026 · Product imagery draws the garment, not just the cloth — 2026-09-05
D-010 generated every product as the same lit arch of fabric. Rendered as a contact
sheet, the failure was obvious and total: **a belt, a scarf, a bag and an overcoat were
the same picture**, distinguishable only by hue. That is precisely the size and context a
shopper meets first, so the catalogue read as fourteen swatches rather than a shop.

`scripts/garments.ts` now supplies the missing half — thirteen silhouettes (coat,
topcoat, blazer, biker, crew, rollneck, shirt, overshirt, trouser, scarf, wrap, belt,
bag) with real construction: notch lapels, plackets, ribbed hems and cuffs, pressed
creases, zips, buckles, handles. `generate-images.ts` keeps what was already good — the
material vocabulary, the raking light, the obsidian ground.

**Three things were only learnable by rendering:**
1. A lapel drawn as one mirrored outline reads as *a pale leaf*. It needs three shapes —
   a collar band, a **dark V** for the front opening, and a lapel either side. Contrast,
   not outline, is what makes cloth fold.
2. A jumper without a visible neck opening reads as a tunic. The hole has to be an actual
   dark shape, not a dip in the top edge.
3. The second photograph should be the *same* garment moved closer, not a different
   picture. Scaling the whole group into a `detailBox` takes the weave and the stitch
   gauge with it, which is what a macro lens does anyway.

**Still generated, still swappable.** Every image is deterministic SVG, ~13 kB each,
424 kB for all 28 product plates. Because media lives in `product_images`, replacing
these with photography stays a data change.

### D-025 · Next.js upgraded off a vulnerable release — 2026-09-05
The project was pinned to `next@15.1.6`, which npm flags for **CVE-2025-66478**. Moved to
`15.5.25`, the patched 15.x backport line, rather than to 16.x — a major upgrade in the
middle of a feature phase would have mixed two kinds of risk. **Verified after:** types,
lint, `npm run test:db`, and a full build, all clean; 38 routes still prerender as
before. Shared JS actually fell from 105 kB to 103 kB. One deprecation surfaced:
`next lint` warns it is removed in Next 16, so `npm run lint` needs migrating to the
ESLint CLI before that upgrade.

### D-024 · Pricing lives in Postgres, not TypeScript — 2026-09-05
`price_cart()` computes lines, subtotal, discount, shipping, tax and total. The cart
page, the checkout summary and the order are all rendered from its output, so there is
no second implementation to drift. TypeScript's only job is `toCartPricing`, which
coerces the jsonb rather than casting it — a wrong assumption there would put a `NaN` on
a price tag. **Consequence:** changing how money is calculated is a migration, and is
covered by the SQL flow test.

### D-023 · Two settlement bugs found by testing, not by reading — 2026-09-05
Both were in code that typechecked, linted and built cleanly.
(1) **`mark_order_paid` inserted a second payment row.** Checkout writes a PENDING
`payments` row carrying the Stripe session id before redirecting; settlement then
inserted another with the same session id. `stripe_checkout_session_id` is UNIQUE, and
the `on conflict` clause named the *payment intent* constraint, so every real payment
would have raised a unique violation inside the webhook. It now updates the pending row
and inserts only if there is none.
(2) **Settlement could clear a stranger's bag.** It located the cart to delete by
matching order line variant ids against `cart_items`, filtered by
`profile_id is not distinct from o.profile_id` — which for two *guests* is `null = null`,
i.e. true. Any other guest holding the same piece lost their cart. `orders.cart_id` now
records exactly which cart became the order. **Lesson:** the flow test is the only
reason either was found; a review pass had already read both.

### D-022 · Checkout is Stripe-hosted, and cannot be faked — 2026-09-05
Payment happens on Stripe's own page, reached by a full navigation. No card field is
ever rendered by this application, so there is nothing to intercept and nothing to
store. **Consequence for reviewers:** without `STRIPE_SECRET_KEY` the pay button is
disabled and the form says why, rather than simulating success. Before redirecting,
`session.amount_total` is compared with the order's `grand_total`; a mismatch expires
the session, fails the order, and charges nothing. Confirmation is authorised by
possession of the checkout session id, which yields the order id and email — both must
agree before the order is shown.

### D-021 · Reservations, not decrements, while payment is in flight — 2026-09-05
`create_order_from_cart` locks every variant (`for update`, ordered by id, so two
checkouts racing for the last piece serialise), re-checks availability, then increments
`reserved_quantity`. Stock itself moves only in `mark_order_paid`. A failed or abandoned
payment calls `release_order_reservations`. **Reason:** decrementing at order creation
loses stock whenever someone abandons Stripe; decrementing only at payment oversells the
last piece to everyone who reaches checkout. The ledger records both the RESERVATION and
the SALE, so the history explains itself.

### D-020 · The cart lives on the client so the storefront stays static — 2026-09-05
Reading the cart cookie in the storefront layout would make **every** page under it
dynamic and cost the prerendering the catalogue depends on. Instead `CartProvider` holds
the count and lines, hydrating from `/api/cart` and updating from each Server Action's
return value. **Verified:** the landing page, category and product pages are still
prerendered after the cart shipped, and shared JS is unchanged at 105 kB.

### D-019 · Guest carts use the service role, in exactly one file — 2026-09-05
RLS cannot express "the holder of this cookie" — there is no authenticated principal to
compare against. Guest carts are therefore reached with the service-role client, which
Agents.md §5 otherwise confines to `lib/actions/admin/**` and webhooks. The exception is
contained in `lib/cart/session.ts`: every cart read and write resolves its cart id there,
from the caller's own cookie or session, and no other module may widen it. Signed-in
customers' carts are still protected by RLS as well.

### D-018 · Reveal needs a scroll fallback, not just IntersectionObserver — 2026-09-05
IO reports *threshold crossings*. An element that goes from below the viewport to above
it in one frame — pressing End, a hash jump, or a restored scroll position on
back-navigation — never crosses anything and is never reported. Measured: jumping to the
end of the homepage left **39 of 40 sections permanently invisible**, and this bug was
present in the Phase 1 build. `Reveal` now (a) reveals synchronously on mount if the
element is already at or above the viewport, and (b) registers with one shared,
rAF-throttled `scroll`/`resize` listener that reveals anything scrolled past. Elements
unregister on reveal, so the cost falls to zero once the page has been read.
**Verified:** steady scroll 0/40 hidden, jump-to-end 0/40, jump-to-middle 14/40 (correct
— those are still below the fold).

### D-017 · Jost replaces Cormorant Garamond — 2026-09-05
Owner's choice of an all-sans pairing. Jost is a geometric sans in the Futura lineage;
Inter Tight stays as the body face. **Consequence:** the whole type scale was retuned,
not just the family swapped — geometric sans needs negative tracking as it grows and
positive tracking as it shrinks, the opposite of a serif, and lighter weights at display
sizes. Two new classes: `.wordmark` (0.36em tracking plus a matching `text-indent`, or
the mark sits off-centre) and `.figure` (prices in the display face, tabular).

### D-016 · Three themes, dark by default, `data-theme` on `<html>` — 2026-09-05
Light / Dark / System. Dark is what a first-time visitor sees — glass only reads as glass
against something dark, and it is the brand's ground. **Mechanism:** `data-theme` on the
root, set by a synchronous inline script in `<head>` before first paint (a React effect
runs too late and flashes black), persisted in `localStorage`, with a live `matchMedia`
listener attached only while the choice is `system`. The control is a menu rather than a
switch because a two-state toggle cannot express "follow my device"; the trigger shows
what is *rendered*, the menu shows what is *chosen*.

### D-015 · Semantic tokens, and the things that must not flip — 2026-09-05
Components referenced `obsidian-*`, `champagne-*` and 24 hardcoded `white/NN` values
directly, so a light theme would have been a rewrite. All of it now resolves to semantic
tokens (`canvas`, `ink`, `accent`, `hairline`, `tint`). Two findings worth keeping:
(1) on light, **fills lighten toward porcelain while borders darken toward ink** — using
one alpha ramp for both is what makes light themes look washed out; (2) product imagery
is dark in *both* themes, so scrims, captions and badges over it use fixed `*-on-scrim`
tokens. A theme-following badge over a dark plate is invisible in light mode — found by
looking at a screenshot, not by reasoning.

### D-014 · Reconciled with a parallel scaffold found in the folder — 2026-09-05
Partway through this build the project folder was found to have been re-scaffolded by
another tool: the Vite app moved to `legacy/`, plus `next.config.mjs`,
`tailwind.config.ts` (v3), `components.json` (shadcn CLI), `.eslintrc.json` and a heavier
`package.json` (Stripe, Resend, recharts, react-hook-form, Gemini). No application code
had been written. On the owner's instruction this build was written over it.
**Consequences:** `legacy/` is kept as the archive; `tailwind.config.ts` and
`.eslintrc.json` are replaced with stubs (v4 does not read the former, flat config
supersedes the latter) and are safe to delete; the deferred dependencies come back in
the phase that needs them rather than sitting unused. `next.config.ts` was renamed to
`next.config.mjs` so two Next configs cannot coexist.

### D-013 · Fonts self-hosted with next/font — 2026-09-05
Cormorant Garamond and Inter Tight load through `next/font/google`, which downloads and
self-hosts them at build time and exposes CSS variables consumed by `--font-display` and
`--font-sans`. **Reason:** removes a render-blocking request to fonts.googleapis.com and
a third-party connection on first paint, and eliminates FOUT. Also silences
`@next/next/no-page-custom-font`, which was the honest complaint about the previous
`<link>` approach.

### D-012 · Database row types must be `type`, not `interface` — 2026-09-05
PostgREST constrains a table's `Row` to `Record<string, unknown>`. TypeScript interfaces
have no implicit index signature, so they fail that constraint — and the failure is
silent: every query resolves to `never` rather than erroring at the definition.
`@supabase/ssr` was also upgraded from 0.5.2 to 0.12.x, whose client generics match
supabase-js 2.115. Both were found by `tsc`, not by reading.

### D-011 · Static fallback data behind every storefront query — 2026-09-05
Each `lib/queries` function returns curated fallback content when Supabase is
unconfigured or unreachable. **Reason:** the site must be viewable and reviewable before
the database exists, and a production outage should degrade to a beautiful page rather
than a stack trace. **Constraint:** fallbacks live in `lib/fallback-catalog.ts` only,
are clearly labelled, and never mask a write failure — writes fail loudly.

### D-010 · Imagery is generated, abstract, and data-swappable — 2026-09-05
**Superseded in part by D-026** — the imagery is still generated and still swappable,
but it is no longer abstract. The paragraph below explains why it was abstract first.
No image-generation model is available in this environment, and stock photography
would not be exclusive to the brand. Product and editorial imagery is procedurally
generated SVG in the house palette: material plates, gradient-mesh editorials, monogram
marks. **Reason:** it is owned, consistent, tiny, and resolution-independent. Because
media lives in `product_images`, replacing it with real photography later is a data
change. `scripts/generate-images.ts` is scaffolded for an AI pipeline.

### D-009 · Money as `numeric(12,2)`, never float — 2026-09-05
All monetary columns are `numeric(12,2)` with a non-negative check. Formatting happens
once, in `lib/utils/format.ts`, using `Intl.NumberFormat`.

### D-008 · Order totals are snapshotted onto the order — 2026-09-05
`order_items` copies product name, SKU, variant title and unit price at purchase time.
**Reason:** an order is a historical record. Editing a product must never alter what a
past invoice says.

### D-007 · Stripe is the only payment surface; webhooks are the source of truth — 2026-09-05
Orders are created `pending` and only reach `paid` on a signature-verified
`checkout.session.completed` webhook, deduplicated by Stripe event id in
`webhook_events`. No card data is ever stored.

### D-006 · Roles live in `profiles.role`, mirrored into the JWT — 2026-09-05
`SUPER_ADMIN` / `ADMIN` / `MANAGER` / `EDITOR` / `CUSTOMER`. A SQL helper `auth_role()`
reads it, and RLS policies call that helper. Middleware guards `/admin` as a second
layer, never as the only layer. **Reason:** defence in depth — a middleware bug must not
become a data breach.

### D-005 · Full-text search via a generated `tsvector` column — 2026-09-05
`products.search_vector` is a stored generated column (name A, description B, tags C)
with a GIN index. **Reason:** no extra service, ranks properly, stays in sync
automatically. Revisit only if typo tolerance becomes a requirement.

### D-004 · Variant-level inventory, with an immutable transaction ledger — 2026-09-05
Stock lives on `product_variants`. Every change writes an `inventory_transactions` row
with reason, delta, and actor. **Reason:** "why is stock wrong" must always be
answerable.

### D-003 · SEO fields are first-class columns, not a JSON blob — 2026-09-05
`seo_title`, `seo_description`, `canonical_url`, `og_image_url` on products, categories,
pages and blog posts. **Reason:** they are queried, validated and indexed; a blob makes
all three awkward.

### D-002 · Tailwind v4 CSS-first configuration — 2026-09-05
Design tokens are declared in `@theme` inside `globals.css`; there is no
`tailwind.config.ts`. **Reason:** one place for tokens, and the tokens are real CSS
custom properties usable outside Tailwind.

### D-001 · Migrate Vite → Next.js 15 App Router — 2026-09-05
The existing Vite SPA cannot deliver server-rendered SEO, server actions, secure Stripe
webhooks, or a protected admin area. The BRUNO brand — Cormorant Garamond display, warm
palette, panel/glass motif — is carried over and deepened into the liquid-glass system;
the old source is archived under `legacy-vite/` rather than deleted.

---

## Carried over from the original project

- Brand name **BRUNO**, positioned as "Premium Apparel"
- Cormorant Garamond as the display face
- The warm brown/sand palette, re-grounded on obsidian and refined to champagne
- The translucent "panel" motif — the seed of the liquid-glass system
- Six original products, migrated into `supabase/seed.sql` with variants and imagery

## Gotchas

- Two Next.js config files (`next.config.ts` and `next.config.mjs`) cannot coexist.
- A `tailwind.config.*` in the root is not read by Tailwind v4 unless a stylesheet opts
  in with `@config`. A leftover v3 config is inert but misleading — hence the stub.
- `data-theme` must be on `<html>` server-side too, or the first paint has no theme.
  `suppressHydrationWarning` is required there because the inline script mutates it
  before React hydrates.
- Anything rendered over a product image needs an `*-on-scrim` token, not a theme token.
- `product_cards` is a `security_invoker` view, so RLS on `products` still applies to it.
  Dropping that option would leak draft products.

- Supabase generated types must be regenerated after every migration:
  `npx supabase gen types typescript --project-id <id> > types/database.ts`
- `backdrop-filter` needs a non-transparent ancestor background or it composites against
  white on iOS Safari.
- Next.js `generateMetadata` runs on the server only — never read `window` in it.
- Server Actions must be `async` and exported from a `"use server"` module.
