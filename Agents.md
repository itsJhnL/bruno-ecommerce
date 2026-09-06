# Agents.md — Working agreement for AI agents on this repo

Read this before writing code. It is the contract, not a suggestion.

---

## 1. Project identity

**BRUNO Premium Apparel** — luxury e-commerce. Next.js 15 App Router, TypeScript strict,
Tailwind v4, shadcn/Radix primitives, Supabase Postgres + Auth + Storage, Stripe,
Vercel. No jQuery, ever.

---

## 2. Prime directives

1. **Never fake functionality.** If a control is not wired to the backend, either do not
   render it, or render it visibly disabled with a "Coming in Phase N" affordance, and
   record it in `docs/status.md`. A button that looks like it works and does nothing is
   the single worst thing you can ship here.
2. **The database is the source of truth.** No product, price, testimonial, FAQ or
   banner literal in a component. If you need content, add a table or a row.
3. **The client never decides money.** Prices, discounts, tax and totals are computed
   server-side and re-verified before charge.
4. **Secrets stay on the server.** `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` and
   friends are read only in Server Components, Server Actions, Route Handlers, and
   never prefixed `NEXT_PUBLIC_`.
5. **RLS is not optional.** A new table without `ENABLE ROW LEVEL SECURITY` and an
   explicit policy set is an incomplete migration.
6. **Server Components by default.** Add `"use client"` only for state, effects, or
   browser APIs — and push it as far down the tree as it will go.

---

## 3. Directory contract

```
app/
  (storefront)/          public routes, shared storefront layout
  (auth)/                login, register, forgot-password
  account/               authenticated customer area
  admin/                 protected admin CMS, its own layout + guard
  api/                   route handlers (webhooks, AI, revalidation)
  sitemap.ts robots.ts   generated from live data
components/
  ui/                    primitives only — no business logic, no data fetching
  storefront/            storefront-specific composed components
  admin/                 admin-specific composed components
  seo/                   JSON-LD emitters
lib/
  supabase/              server.ts, client.ts, admin.ts, middleware.ts
  queries/               all read paths, one module per domain
  actions/               all write paths (Server Actions), Zod-validated
  validations/           Zod schemas, shared by client and server
  utils/                 pure helpers only
types/
  database.ts            generated from Supabase — never hand-edited
  index.ts               application types
supabase/
  migrations/            numbered, forward-only SQL
  seed.sql               demo data
```

**Hard rules.**
- No data fetching in `components/ui/**`.
- No business logic in any component. It goes in `lib/queries` or `lib/actions`.
- No inline SQL or `supabase.from(...)` calls inside a page or component — call a
  function from `lib/queries`.
- If a block of JSX appears twice, it becomes a component before it appears a third time.

---

## 4. Naming

| Thing | Convention | Example |
|---|---|---|
| Component files | PascalCase | `ProductVitrine.tsx` |
| Everything else | kebab-case | `format-currency.ts` |
| Components | PascalCase | `MembershipCta` |
| Functions / vars | camelCase | `getFeaturedProducts` |
| Constants | SCREAMING_SNAKE | `MAX_CART_QUANTITY` |
| Types / interfaces | PascalCase, no `I` prefix | `ProductWithVariants` |
| DB tables | plural snake_case | `product_variants` |
| DB columns | snake_case | `compare_at_price` |
| Booleans | `is_` / `has_` | `is_featured`, `has_variants` |
| Timestamps | `_at` | `published_at` |

---

## 5. Data access rules

- Reads: `lib/queries/<domain>.ts`, using the **server** Supabase client, typed against
  `types/database.ts`.
- Writes: `lib/actions/<domain>.ts`, a Server Action that (1) authenticates,
  (2) authorizes by role, (3) validates with Zod, (4) mutates, (5) `revalidatePath`.
- Never `select('*')` on a wide table in a list view. Name your columns.
- Every list query is paginated. There is no unbounded `select`.
- The `admin` Supabase client (service role) is used *only* in `lib/actions/admin/**`
  and webhook handlers, and every such call must be preceded by a role check.

---

## 6. Styling rules

- Tailwind utilities first. A custom class only when a pattern repeats 3+ times, and
  then it goes in `@layer components` in `globals.css`.
- Colour, spacing, radius, blur and motion come from tokens in `globals.css`. **No raw
  hex values in components.**
- Glass surfaces use the four documented grades (`glass-veil`, `glass-pane`,
  `glass-vitrine`, `glass-monolith`) — do not invent a fifth.
- Mobile-first. Write the small-screen rule, then add `md:` / `lg:`.
- Every `<img>` / `<Image>` carries explicit width and height or a fixed aspect ratio.
- Read `Design.md` before touching visuals. It is normative.

---

## 7. Definition of done for any change

- [ ] `npx tsc --noEmit` passes — strict, zero errors, zero `any`
- [ ] `npm run build` passes
- [ ] Loading, empty and error states exist for anything that fetches
- [ ] Keyboard-operable, visible focus ring, contrast checked
- [ ] Renders correctly at 375 / 768 / 1024 / 1440px
- [ ] `prefers-reduced-motion` respected
- [ ] New tables have RLS + policies; new mutations have Zod schemas
- [ ] No secret is reachable from the client bundle
- [ ] `Memory.md` updated with what changed and why
- [ ] `docs/status.md` updated if anything is still stubbed

---

## 8. Working style

- **Read before writing.** Check `Memory.md` for decisions already made, and grep the
  repo for an existing helper before adding one.
- **Migrations are forward-only.** Never edit a migration that has been applied. Add a
  new numbered file.
- **Small, complete units.** Prefer one finished feature over five half-features.
- **Say what is not done.** Ending a turn with an honest "X is stubbed because Y" is
  correct behaviour. Quietly leaving a dead button is not.
