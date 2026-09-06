/**
 * scripts/apply-photography.mjs
 *
 * Applies the same image URLs as `supabase/real-photography.sql`, but through
 * the REST API so it can run from a terminal:
 *
 *   node --env-file=.env.local scripts/apply-photography.mjs
 *   node --env-file=.env.local scripts/apply-photography.mjs --revert
 *
 * The SQL file is still the canonical version and does one thing this cannot:
 * add the `product_images.credit` column, because PostgREST does not run DDL.
 * Run the SQL file too if you want the provenance recorded.
 *
 * `--revert` puts the generated SVG plates back.
 */

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (try --env-file=.env.local).')
  process.exit(1)
}

const db = createClient(url, key, { auth: { persistSession: false } })
const revert = process.argv.includes('--revert')

const photo = (id, w = 1600, h = 2000) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`

/** [slug, primary id, primary alt, detail id, detail alt] */
const PRODUCTS = [
  ['obsidian-cashmere-overcoat', '1669575903350-9a349b411810', 'A long unstructured overcoat worn open, photographed in a dim doorway',
                                 '1647699926980-b7d360761521', 'Close detail of brushed wool, raking light across the nap'],
  ['monolith-wool-topcoat',      '1608635680046-aebf91c1a9c8', 'A buttoned wool topcoat photographed outdoors in daylight',
                                 '1647699926980-b7d360761521', 'Close detail of dense melton wool'],
  ['nocturne-leather-jacket',    '1592158249887-ac6ae7921691', 'A black leather biker jacket photographed against a dark ground',
                                 '1596832772762-78e213deff5f', 'Close detail of a metal zip running through grained leather'],
  ['atelier-wool-blazer',        '1593030942428-a5451dca4b42', 'A navy wool blazer photographed front-on against grey',
                                 '1598915850252-fb07ad1e6768', 'A checked wool jacket photographed flat, showing the lapel roll'],
  ['meridian-tailored-trouser',  '1611937669166-be4e0503b115', 'Pleated tailored trousers photographed against a pale ground',
                                 '1624809806634-3c9a20aca768', 'Close detail of a pressed trouser leg and waistband'],
  ['cirrus-cashmere-crew',       '1631541909061-71e349d1f203', 'A fine-gauge knitted crew-neck hanging against a white wall',
                                 '1615310748170-29d7088865ad', 'Knitted cloth and yarn photographed close on linen'],
  ['ember-merino-rollneck',      '1602706294170-1fed8eecd9f9', 'Folded merino knitwear in warm camel and amber tones',
                                 '1615310748170-29d7088865ad', 'Knitted cloth and yarn photographed close on linen'],
  ['vellum-silk-shirt',          '1602810316498-ab67cf68c8e1', 'A folded white shirt photographed flat on stone',
                                 '1606259458027-54d2a728b6ab', 'Close detail of silk catching light along a fold'],
  ['alabaster-poplin-shirt',     '1603252110481-7ba873bf42ab', 'White poplin shirts hanging on wooden hangers',
                                 '1621072156002-e2fccdc0b176', 'A white shirt worn open at the collar with the sleeves rolled'],
  ['ivory-linen-overshirt',      '1602810319250-a663f0af2f75', 'A folded shirt laid flat beside a watch and glasses',
                                 '1621072156002-e2fccdc0b176', 'A pale shirt worn loose, sleeves rolled to the forearm'],
  ['solstice-suede-weekender',   '1555494183-648c287e29bc',    'A tan leather weekend holdall with a shoulder strap',
                                 '1637868796504-32f45a96d5a0', 'Leather goods arranged flat: a bag, a wallet and a belt'],
  ['onyx-calfskin-belt',         '1664286074176-5206ee5dc878', 'A leather belt coiled on a dark surface, buckle uppermost',
                                 '1624222247344-550fb60583dc', 'Close detail of a leather belt, showing the grain and stitching'],
  ['halo-silk-scarf',            '1606259458027-54d2a728b6ab', 'Cream silk photographed close, catching the light along a fold',
                                 '1517472292914-9570a594783b', 'Silk scarves hanging in a row, showing the drape'],
  ['sable-cashmere-wrap',        '1610973310510-82f514ea1986', 'A stack of folded cashmere wraps in muted natural tones',
                                 '1615310748170-29d7088865ad', 'Knitted cashmere photographed close, showing the loft'],
]

const CATEGORIES = [
  ['outerwear',   '1608635680046-aebf91c1a9c8', 'A wool topcoat worn buttoned against the cold'],
  ['tailoring',   '1593030942428-a5451dca4b42', 'A navy blazer photographed front-on'],
  ['knitwear',    '1602706294170-1fed8eecd9f9', 'Folded knitwear in warm natural tones'],
  ['shirting',    '1603252110481-7ba873bf42ab', 'White shirts hanging on wooden hangers'],
  ['leather',     '1592158249887-ac6ae7921691', 'A black leather jacket against a dark ground'],
  ['accessories', '1606259458027-54d2a728b6ab', 'Cream silk catching the light along a fold'],
]

const POSTS = [
  ['eleven-hours',      '1647699926980-b7d360761521', 'Close detail of brushed wool under raking light'],
  ['micron-count',      '1615310748170-29d7088865ad', 'Knitted cloth and yarn photographed close on linen'],
  ['six-pieces',        '1603252110481-7ba873bf42ab', 'White shirts hanging in a row on wooden hangers'],
  ['vegetable-tanning', '1637868796504-32f45a96d5a0', 'Leather goods arranged flat on a dark surface'],
]

const STORIES = [
  ['atelier',    '1647699926980-b7d360761521', 'Close detail of brushed wool under raking light'],
  ['materials',  '1615310748170-29d7088865ad', 'Knitted cloth and yarn photographed close on linen'],
  ['provenance', '1637868796504-32f45a96d5a0', 'Leather goods arranged flat on a dark surface'],
]

let changed = 0
const fail = (label, error) => {
  console.error(`  FAILED ${label}: ${error.message}`)
  process.exitCode = 1
}

for (const [slug, mainId, mainAlt, detailId, detailAlt] of PRODUCTS) {
  const { data: product, error } = await db.from('products').select('id, name').eq('slug', slug).maybeSingle()
  if (error || !product) {
    fail(slug, error ?? new Error('product not found'))
    continue
  }

  for (const [isPrimary, id, alt] of [[true, mainId, mainAlt], [false, detailId, detailAlt]]) {
    const patch = revert
      ? {
          url: `/images/products/${slug}-${isPrimary ? 1 : 2}.svg`,
          alt: isPrimary
            ? `${product.name}, photographed front-on against a dark ground`
            : `${product.name} — close detail of the collar, fastening and stitching`,
          width: 1000,
          height: 1250,
        }
      : { url: photo(id), alt, width: 1600, height: 2000 }

    const query = db.from('product_images').update(patch).eq('product_id', product.id)
    const { error: e } = isPrimary
      ? await query.eq('is_primary', true)
      : await query.eq('is_primary', false).eq('position', 1)

    if (e) fail(`${slug} (${isPrimary ? 'primary' : 'detail'})`, e)
    else changed += 1
  }
}

for (const [slug, id, alt] of CATEGORIES) {
  const patch = revert
    ? { image_url: `/images/editorial/category-${slug}.svg` }
    : { image_url: photo(id, 1200, 1500), image_alt: alt }
  const { error } = await db.from('categories').update(patch).eq('slug', slug)
  if (error) fail(`category ${slug}`, error)
  else changed += 1
}

for (const [slug, id, alt] of POSTS) {
  const patch = revert
    ? { featured_image_url: `/images/editorial/journal-${slug}.svg` }
    : { featured_image_url: photo(id, 1600, 1000), featured_image_alt: alt }
  const { error } = await db.from('blog_posts').update(patch).eq('slug', slug)
  if (error) fail(`post ${slug}`, error)
  else changed += 1
}

for (const [key, id, alt] of STORIES) {
  const patch = revert
    ? { image_url: `/images/editorial/${key}.svg` }
    : { image_url: photo(id, 1200, 1500), image_alt: alt }
  const { error } = await db.from('story_sections').update(patch).eq('key', key)
  if (error) fail(`story ${key}`, error)
  else changed += 1
}

for (const [placement, id, alt, file] of [
  ['HOME_HERO', '1669575903350-9a349b411810', 'A long overcoat worn open, photographed in a dim doorway', 'hero'],
  ['HOME_PROMO', '1596832772762-78e213deff5f', 'Close detail of a zip running through grained leather', 'membership'],
]) {
  const patch = revert
    ? { image_url: `/images/editorial/${file}.svg` }
    : { image_url: photo(id, 2000, 1200), image_alt: alt }
  const { error } = await db.from('banners').update(patch).eq('placement', placement)
  if (error) fail(`banner ${placement}`, error)
  else changed += 1
}

console.log(
  revert
    ? `Reverted ${changed} image rows to the generated SVG plates.`
    : `Applied photographs to ${changed} image rows.`
)
