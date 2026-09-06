/**
 * Proves the seed can be run twice without duplicating anything.
 *
 * It could not, until 0010. `seed.sql` ends every insert with
 * `on conflict do nothing`, and the apply-all header claimed that made it safe
 * to re-run — but that clause catches a *unique violation*, and tables like
 * `navigation_items` had no unique constraint to violate. A second run silently
 * doubled them, which reached the storefront as a header listing every link
 * twice and overflowing its own bar.
 *
 * This is the test that would have caught it, so it now runs on every change.
 *
 *   node supabase/tests/seed-idempotency.mjs
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { db, q } from './apply.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SEED = path.join(HERE, '..', 'seed.sql')

let failures = 0
const check = (label, cond, detail = '') => {
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? ' — ' + detail : ''}`)
  if (!cond) failures++
}

console.log('\n=== Seed idempotency ===\n')

/** Every table the seed writes to, and what one run should produce. */
const TABLES = [
  'categories', 'products', 'product_categories', 'product_images',
  'product_options', 'product_variants', 'inventory_transactions',
  'collections', 'collection_products', 'product_relations', 'reviews',
  'membership_tiers', 'brand_values', 'story_sections', 'testimonials',
  'faqs', 'banners', 'navigation_items', 'shipping_methods', 'coupons',
  'blog_categories', 'blog_posts', 'pages', 'site_settings',
  'permissions', 'role_permissions',
]

async function snapshot() {
  const counts = {}
  for (const table of TABLES) {
    counts[table] = (await q(`select count(*)::int n from ${table}`))[0].n
  }
  return counts
}

// apply.mjs has already run the seed once.
const first = await snapshot()

// Run it a second time, exactly as somebody re-pasting apply-all.sql would.
try {
  await db.exec(readFileSync(SEED, 'utf8'))
  console.log('  ok    seed applied a second time without error\n')
} catch (e) {
  console.error(`  FAIL  second seed run raised: ${e.message}\n`)
  process.exit(1)
}

const second = await snapshot()

for (const table of TABLES) {
  const before = first[table]
  const after = second[table]
  check(
    `${table} unchanged`,
    before === after,
    before === after ? '' : `${before} -> ${after} (${after - before} duplicated)`
  )
}

// The specific symptom that started this: the header menu.
const header = await q(
  `select label, href, count(*)::int n from navigation_items
    where menu = 'header' group by label, href having count(*) > 1`
)
check('no duplicate header links', header.length === 0,
  header.map((r) => `${r.n}x ${r.label}`).join(', '))

// Ratings must survive a re-seed too — they are derived from a trigger.
const ratings = await q(
  `select p.slug, p.rating_count,
          (select count(*) from reviews r where r.product_id = p.id and r.status = 'APPROVED') as actual
     from products p where p.rating_count > 0`
)
const wrong = ratings.filter((r) => Number(r.rating_count) !== Number(r.actual))
check('rating counts match the reviews that exist', wrong.length === 0,
  wrong.map((r) => `${r.slug}: ${r.rating_count} vs ${r.actual}`).join(', '))

console.log(`\n${failures === 0 ? 'IDEMPOTENT' : failures + ' FAILURE(S)'}\n`)
process.exit(failures === 0 ? 0 : 1)
