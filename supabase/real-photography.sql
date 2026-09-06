-- =============================================================================
-- REAL PHOTOGRAPHY — replaces the generated SVG plates with photographs.
--
-- Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Reversible: recipe D in supabase/images.sql puts the SVGs back.
--
-- -----------------------------------------------------------------------------
-- READ THIS BEFORE YOU LAUNCH
--
-- These are STOCK PHOTOGRAPHS FROM UNSPLASH. They are real photographs of real
-- garments, but they are NOT photographs of your products. A cashmere overcoat
-- here is *a* cashmere overcoat, not *the* one you are selling.
--
-- That is fine for a demo, a pitch, or a design review. It is NOT fine for a
-- live shop: selling one coat and showing a photograph of a different coat is
-- a misrepresentation, and in most jurisdictions it is also illegal. Replace
-- these with photographs of your actual stock before you take money.
--
-- LICENCE. The Unsplash License grants free commercial use with no attribution
-- required (https://unsplash.com/license). Attribution is still good manners,
-- so `product_images.credit` carries the photo id; the storefront does not
-- render it yet. What the licence does NOT do is make a garment yours to
-- advertise — see above.
--
-- Every URL below returned HTTP 200 when this file was written, and every
-- photograph was looked at before it was assigned.
--
-- `images.unsplash.com` had to be ADDED to `remotePatterns` in next.config.mjs
-- for these to render. next/image throws on an unlisted host and takes the
-- whole page down, so if you point the database at another CDN, add it there
-- first.
-- =============================================================================

begin;

-- A place to record where a photograph came from. Harmless if it already runs.
alter table product_images add column if not exists credit text;

comment on column product_images.credit is
  'Where the photograph came from. Stock imagery must be replaced with photographs of actual stock before selling.';

-- -----------------------------------------------------------------------------
-- 1. The main photograph of each product.
--    Cropped to 1600x2000 (4:5) so width/height match the file and nothing
--    shifts as it loads.
-- -----------------------------------------------------------------------------
with photo(slug, id, alt) as (values
  ('obsidian-cashmere-overcoat', '1669575903350-9a349b411810', 'A long unstructured overcoat worn open, photographed in a dim doorway'),
  ('monolith-wool-topcoat',      '1608635680046-aebf91c1a9c8', 'A buttoned wool topcoat photographed outdoors in daylight'),
  ('nocturne-leather-jacket',    '1592158249887-ac6ae7921691', 'A black leather biker jacket photographed against a dark ground'),
  ('atelier-wool-blazer',        '1593030942428-a5451dca4b42', 'A navy wool blazer photographed front-on against grey'),
  ('meridian-tailored-trouser',  '1611937669166-be4e0503b115', 'Pleated tailored trousers photographed against a pale ground'),
  ('cirrus-cashmere-crew',       '1631541909061-71e349d1f203', 'A fine-gauge knitted crew-neck hanging against a white wall'),
  ('ember-merino-rollneck',      '1602706294170-1fed8eecd9f9', 'Folded merino knitwear in warm camel and amber tones'),
  ('vellum-silk-shirt',          '1602810316498-ab67cf68c8e1', 'A folded white shirt photographed flat on stone'),
  ('alabaster-poplin-shirt',     '1603252110481-7ba873bf42ab', 'White poplin shirts hanging on wooden hangers'),
  ('ivory-linen-overshirt',      '1602810319250-a663f0af2f75', 'A folded shirt laid flat beside a watch and glasses'),
  ('solstice-suede-weekender',   '1555494183-648c287e29bc',    'A tan leather weekend holdall with a shoulder strap'),
  ('onyx-calfskin-belt',         '1664286074176-5206ee5dc878', 'A leather belt coiled on a dark surface, buckle uppermost'),
  ('halo-silk-scarf',            '1606259458027-54d2a728b6ab', 'Cream silk photographed close, catching the light along a fold'),
  ('sable-cashmere-wrap',        '1610973310510-82f514ea1986', 'A stack of folded cashmere wraps in muted natural tones')
)
update product_images pi
   set url    = 'https://images.unsplash.com/photo-' || photo.id || '?auto=format&fit=crop&w=1600&h=2000&q=80',
       alt    = photo.alt,
       width  = 1600,
       height = 2000,
       credit = 'Unsplash photo-' || photo.id
  from photo
  join products p on p.slug = photo.slug
 where pi.product_id = p.id and pi.is_primary;

-- -----------------------------------------------------------------------------
-- 2. The second photograph — a material detail, chosen to match the cloth.
--    Several products share one, because a macro of cashmere is a macro of
--    cashmere. Position 1 only, so any image you added yourself is untouched.
-- -----------------------------------------------------------------------------
with photo(slug, id, alt) as (values
  ('obsidian-cashmere-overcoat', '1647699926980-b7d360761521', 'Close detail of brushed wool, raking light across the nap'),
  ('monolith-wool-topcoat',      '1647699926980-b7d360761521', 'Close detail of dense melton wool'),
  ('nocturne-leather-jacket',    '1596832772762-78e213deff5f', 'Close detail of a metal zip running through grained leather'),
  ('atelier-wool-blazer',        '1598915850252-fb07ad1e6768', 'A checked wool jacket photographed flat, showing the lapel roll'),
  ('meridian-tailored-trouser',  '1624809806634-3c9a20aca768', 'Close detail of a pressed trouser leg and waistband'),
  ('cirrus-cashmere-crew',       '1615310748170-29d7088865ad', 'Knitted cloth and yarn photographed close on linen'),
  ('ember-merino-rollneck',      '1615310748170-29d7088865ad', 'Knitted cloth and yarn photographed close on linen'),
  ('vellum-silk-shirt',          '1606259458027-54d2a728b6ab', 'Close detail of silk catching light along a fold'),
  ('alabaster-poplin-shirt',     '1621072156002-e2fccdc0b176', 'A white shirt worn open at the collar with the sleeves rolled'),
  ('ivory-linen-overshirt',      '1621072156002-e2fccdc0b176', 'A pale shirt worn loose, sleeves rolled to the forearm'),
  ('solstice-suede-weekender',   '1637868796504-32f45a96d5a0', 'Leather goods arranged flat: a bag, a wallet and a belt'),
  ('onyx-calfskin-belt',         '1624222247344-550fb60583dc', 'Close detail of a leather belt, showing the grain and stitching'),
  ('halo-silk-scarf',            '1517472292914-9570a594783b', 'Silk scarves hanging in a row, showing the drape'),
  ('sable-cashmere-wrap',        '1615310748170-29d7088865ad', 'Knitted cashmere photographed close, showing the loft')
)
update product_images pi
   set url    = 'https://images.unsplash.com/photo-' || photo.id || '?auto=format&fit=crop&w=1600&h=2000&q=80',
       alt    = photo.alt,
       width  = 1600,
       height = 2000,
       credit = 'Unsplash photo-' || photo.id
  from photo
  join products p on p.slug = photo.slug
 where pi.product_id = p.id and not pi.is_primary and pi.position = 1;

-- -----------------------------------------------------------------------------
-- 3. Category imagery. Portrait, to match the category rail.
-- -----------------------------------------------------------------------------
with photo(slug, id, alt) as (values
  ('outerwear',   '1608635680046-aebf91c1a9c8', 'A wool topcoat worn buttoned against the cold'),
  ('tailoring',   '1593030942428-a5451dca4b42', 'A navy blazer photographed front-on'),
  ('knitwear',    '1602706294170-1fed8eecd9f9', 'Folded knitwear in warm natural tones'),
  ('shirting',    '1603252110481-7ba873bf42ab', 'White shirts hanging on wooden hangers'),
  ('leather',     '1592158249887-ac6ae7921691', 'A black leather jacket against a dark ground'),
  ('accessories', '1606259458027-54d2a728b6ab', 'Cream silk catching the light along a fold')
)
update categories c
   set image_url = 'https://images.unsplash.com/photo-' || photo.id || '?auto=format&fit=crop&w=1200&h=1500&q=80',
       image_alt = photo.alt
  from photo
 where c.slug = photo.slug;

-- -----------------------------------------------------------------------------
-- 4. Banners. Landscape, because the hero is a wide plate.
-- -----------------------------------------------------------------------------
update banners
   set image_url = 'https://images.unsplash.com/photo-1669575903350-9a349b411810?auto=format&fit=crop&w=2000&h=1200&q=80',
       image_alt = 'A long overcoat worn open, photographed in a dim doorway'
 where placement = 'HOME_HERO';

update banners
   set image_url = 'https://images.unsplash.com/photo-1596832772762-78e213deff5f?auto=format&fit=crop&w=1600&h=1000&q=80',
       image_alt = 'Close detail of a zip running through grained leather'
 where placement = 'HOME_PROMO';

-- -----------------------------------------------------------------------------
-- 5. Journal and story imagery.
-- -----------------------------------------------------------------------------
with photo(slug, id, alt) as (values
  ('eleven-hours',      '1647699926980-b7d360761521', 'Close detail of brushed wool under raking light'),
  ('micron-count',      '1615310748170-29d7088865ad', 'Knitted cloth and yarn photographed close on linen'),
  ('six-pieces',        '1603252110481-7ba873bf42ab', 'White shirts hanging in a row on wooden hangers'),
  ('vegetable-tanning', '1637868796504-32f45a96d5a0', 'Leather goods arranged flat on a dark surface')
)
update blog_posts b
   set featured_image_url = 'https://images.unsplash.com/photo-' || photo.id || '?auto=format&fit=crop&w=1600&h=1000&q=80',
       featured_image_alt = photo.alt
  from photo
 where b.slug = photo.slug;

with photo(key, id, alt) as (values
  ('atelier',    '1647699926980-b7d360761521', 'Close detail of brushed wool under raking light'),
  ('materials',  '1615310748170-29d7088865ad', 'Knitted cloth and yarn photographed close on linen'),
  ('provenance', '1637868796504-32f45a96d5a0', 'Leather goods arranged flat on a dark surface')
)
update story_sections s
   set image_url = 'https://images.unsplash.com/photo-' || photo.id || '?auto=format&fit=crop&w=1200&h=1500&q=80',
       image_alt = photo.alt
  from photo
 where s.key = photo.key;

commit;

-- -----------------------------------------------------------------------------
-- Check it worked. Every row should be an images.unsplash.com URL.
-- -----------------------------------------------------------------------------
select p.slug, pi.is_primary, left(pi.url, 62) as url, pi.credit
  from product_images pi join products p on p.id = pi.product_id
 order by p.slug, pi.is_primary desc;
