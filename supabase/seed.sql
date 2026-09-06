-- =============================================================================
-- seed.sql · Demo data for BRUNO
--
-- Produces a storefront that looks like a real house: 14 products across 6
-- categories, with variants, imagery, reviews, editorial content and settings.
-- Safe to re-run: every insert is idempotent on its natural key.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Categories
-- -----------------------------------------------------------------------------
insert into categories (name, slug, description, image_url, image_alt, position, is_active, is_featured, seo_title, seo_description) values
  ('Outerwear',   'outerwear',   'Coats and jackets cut for weight, drape and a long life.', '/images/editorial/category-outerwear.svg',  'Layered obsidian and champagne composition representing outerwear', 1, true, true,  'Luxury Outerwear — BRUNO', 'Cashmere overcoats, wool topcoats and leather jackets, cut in limited runs and finished by hand.'),
  ('Tailoring',   'tailoring',   'Soft-shouldered construction with a deliberately quiet line.', '/images/editorial/category-tailoring.svg', 'Vertical light study representing tailoring',                       2, true, true,  'Tailoring — BRUNO', 'Blazers and trousers with half-canvas construction, cut for movement rather than formality.'),
  ('Knitwear',    'knitwear',    'Grade-A cashmere and extrafine merino, knitted in small batches.', '/images/editorial/category-knitwear.svg', 'Soft woven gradient representing knitwear',                     3, true, true,  'Cashmere & Merino Knitwear — BRUNO', 'Rollnecks and crews in grade-A cashmere and extrafine merino, knitted in small batches.'),
  ('Shirting',    'shirting',    'Silk, poplin and linen, in a cut that reads well untucked.', '/images/editorial/category-shirting.svg',  'Fine vertical weave representing shirting',                        4, true, false, 'Shirting — BRUNO', 'Silk, two-fold poplin and washed linen shirts with mother-of-pearl fastenings.'),
  ('Leather',     'leather',     'Vegetable-tanned hides that record where you have been.', '/images/editorial/category-leather.svg',   'Deep grained surface representing leather',                        5, true, false, 'Leather Goods — BRUNO', 'Vegetable-tanned leather bags, belts and jackets, finished in a Florentine workshop.'),
  ('Accessories', 'accessories', 'The last five per cent, which is most of the effect.', '/images/editorial/category-accessories.svg', 'Fine linear composition representing accessories',                6, true, true,  'Accessories — BRUNO', 'Silk scarves, calfskin belts and cashmere wraps to finish a considered wardrobe.')
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Products
-- -----------------------------------------------------------------------------
insert into products (
  name, slug, subtitle, description, story, sku, status, price, compare_at_price, cost_price,
  is_featured, is_new, is_limited, is_members_only, materials, care_instructions, origin,
  specifications, shipping_info, returns_info, tags, badge, units_sold, position, published_at,
  seo_title, seo_description
) values

('Obsidian Cashmere Overcoat', 'obsidian-cashmere-overcoat',
 'Double-faced cashmere, unlined, hand-finished',
 'A full-length overcoat in double-faced Italian cashmere. Because the cloth is bonded rather than lined, the coat carries its own structure and falls in one clean column from the shoulder. Every edge is closed by hand — there is no facing, no lining, and nowhere to hide a shortcut.',
 'The mill in Biella has been weaving double-faced cloth for four generations. It takes two lengths of cashmere, bonds them, and then a finisher separates the layers by hand at every edge so the seam can be closed invisibly. One coat takes eleven hours of hand-finishing. We make sixty a season.',
 'BR-OUT-001', 'ACTIVE', 1890.00, null, 720.00,
 true, false, true, false,
 '100% Italian double-faced cashmere', 'Specialist dry clean only. Brush after wear. Store on a broad wooden hanger.', 'Woven in Biella, Italy. Made in Portugal.',
 '{"Fit":"Straight, mid-calf","Closure":"Concealed four-button placket","Pockets":"Two welt, one interior","Weight":"780 g/m²","Finishing":"Hand-closed edges"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['cashmere','overcoat','winter','hand-finished','limited'], 'Limited', 84, 1, now() - interval '120 days',
 'Obsidian Cashmere Overcoat — BRUNO', 'A double-faced Italian cashmere overcoat, unlined and hand-finished. Sixty made this season.'),

('Nocturne Leather Jacket', 'nocturne-leather-jacket',
 'Vegetable-tanned lambskin, cut close',
 'A short jacket in vegetable-tanned lambskin, cut close through the body with a standing collar. The hide is aniline-finished, so it takes light unevenly and will darken where you fold it. It is meant to look better in five years than it does today.',
 'Vegetable tanning takes forty days and a pit of oak bark. Chrome tanning takes six hours. We use the slow one because it leaves the hide alive — it keeps reacting to light, oil and wear long after it has left the workshop.',
 'BR-OUT-002', 'ACTIVE', 2400.00, null, 940.00,
 true, false, true, true,
 'Vegetable-tanned lambskin, cupro lining', 'Wipe with a dry cloth. Condition annually. Never machine wash.', 'Tanned in Tuscany. Made in Italy.',
 '{"Fit":"Close, hip length","Closure":"Two-way YKK Excella","Pockets":"Two side, one chest, two interior","Lining":"Bemberg cupro","Hardware":"Antiqued brass"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['leather','jacket','members','italy'], 'Members Only', 41, 2, now() - interval '90 days',
 'Nocturne Leather Jacket — BRUNO', 'Vegetable-tanned lambskin jacket, aniline-finished and made in Italy. Reserved for members.'),

('Monolith Wool Topcoat', 'monolith-wool-topcoat',
 'Melton wool, half-canvassed, storm collar',
 'A heavy melton topcoat with a half-canvas chest and a collar that stands when you need it to. The cloth is milled to 820 g/m² and pressed until it sheds rain. It is a coat for standing outside in.',
 'Melton is wool that has been felted until the weave disappears. The finisher raises the nap, shears it, and presses it — three times. What is left is a cloth so dense that water beads on it and the raw edge does not fray.',
 'BR-OUT-003', 'ACTIVE', 1650.00, 1950.00, 610.00,
 true, false, false, false,
 '90% virgin wool, 10% cashmere melton', 'Dry clean sparingly. Brush with a stiff brush after wear.', 'Woven in Yorkshire. Made in Portugal.',
 '{"Fit":"Relaxed, knee length","Closure":"Six-button double-breasted","Pockets":"Two flap, two interior","Weight":"820 g/m²","Construction":"Half-canvas"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['wool','coat','winter','sale'], 'Archive', 156, 3, now() - interval '200 days',
 'Monolith Wool Topcoat — BRUNO', 'A half-canvassed melton wool topcoat at 820 g/m², milled in Yorkshire. Now in the archive.'),

('Atelier Wool Blazer', 'atelier-wool-blazer',
 'Half-canvas, soft shoulder, patch pockets',
 'An unstructured blazer with a soft Neapolitan shoulder and a half-canvas chest. There is no padding, so the jacket takes the shape of whoever is wearing it rather than imposing one.',
 'A soft shoulder is harder to make than a padded one. There is nothing inside to correct a bad cut, so the pattern has to be right the first time. Our cutter spent nine years in Naples learning to make a jacket that does not fight the body.',
 'BR-TAI-001', 'ACTIVE', 1250.00, null, 470.00,
 true, true, false, false,
 'Super 130s virgin wool', 'Dry clean only. Rest 24 hours between wears.', 'Woven in Huddersfield. Made in Italy.',
 '{"Fit":"Soft, two-button","Shoulder":"Unpadded Neapolitan","Pockets":"Three patch","Vents":"Double side","Construction":"Half-canvas"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['tailoring','blazer','wool','new'], 'New', 62, 4, now() - interval '20 days',
 'Atelier Wool Blazer — BRUNO', 'Half-canvassed Super 130s blazer with an unpadded Neapolitan shoulder, made in Italy.'),

('Meridian Tailored Trouser', 'meridian-tailored-trouser',
 'High rise, single pleat, unfinished hem',
 'A high-rise trouser with a single forward pleat and a wide, tapering leg. Shipped with an unfinished hem so your tailor can set the break where you want it.',
 'A pleat is not decoration. It gives the fabric somewhere to go when you sit down, which is why a pleated trouser stays clean through a long day and a flat front does not.',
 'BR-TAI-002', 'ACTIVE', 540.00, null, 195.00,
 false, true, false, false,
 'Super 120s virgin wool tropical', 'Dry clean. Press with a cloth.', 'Woven in Biella. Made in Portugal.',
 '{"Rise":"High","Pleat":"Single forward","Leg":"Wide, tapered","Waistband":"Extended tab, side adjusters","Hem":"Unfinished"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['tailoring','trouser','wool','new'], 'New', 97, 5, now() - interval '30 days',
 'Meridian Tailored Trouser — BRUNO', 'High-rise single-pleat trouser in Super 120s tropical wool, shipped unhemmed.'),

('Cirrus Cashmere Crew', 'cirrus-cashmere-crew',
 'Grade-A Mongolian cashmere, 12-gauge',
 'A crew-neck in 12-gauge grade-A cashmere — fine enough to wear under a jacket, dense enough to wear alone. The neck, cuffs and hem are linked by hand so there is no ridge.',
 'Grade-A cashmere means fibres longer than 34 millimetres and finer than 15.5 microns. Longer fibres pill less. It costs roughly three times what grade-C costs, and it is the entire difference between a sweater you keep and one you replace.',
 'BR-KNI-001', 'ACTIVE', 680.00, null, 245.00,
 true, false, false, false,
 '100% grade-A Mongolian cashmere', 'Hand wash cold, dry flat. Do not hang.', 'Knitted in Scotland.',
 '{"Gauge":"12","Neck":"Crew, hand-linked","Fit":"Regular","Weight":"340 g","Ply":"Two"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['cashmere','knitwear','scotland','bestseller'], 'Best Seller', 312, 6, now() - interval '150 days',
 'Cirrus Cashmere Crew — BRUNO', '12-gauge grade-A Mongolian cashmere crew-neck, hand-linked and knitted in Scotland.'),

('Ember Merino Rollneck', 'ember-merino-rollneck',
 'Extrafine merino, 7-gauge, full roll',
 'A heavier rollneck in 7-gauge extrafine merino with a deep, genuine roll rather than a folded mock. It holds its shape at the neck because the collar is knitted in one piece.',
 'Most rollnecks are a tube sewn to a body. Ours is knitted whole, which takes four times as long on the machine and is the only way the collar still stands after fifty wears.',
 'BR-KNI-002', 'ACTIVE', 590.00, null, 210.00,
 false, false, false, false,
 '100% extrafine merino wool, 17.5 micron', 'Hand wash cold, dry flat.', 'Knitted in Scotland.',
 '{"Gauge":"7","Neck":"Full roll, knitted whole","Fit":"Regular","Weight":"520 g","Micron":"17.5"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['merino','knitwear','rollneck','winter'], null, 178, 7, now() - interval '110 days',
 'Ember Merino Rollneck — BRUNO', 'Seven-gauge extrafine merino rollneck with a whole-knitted collar, made in Scotland.'),

('Vellum Silk Shirt', 'vellum-silk-shirt',
 '19-momme sand-washed silk',
 'A shirt in 19-momme sand-washed silk — heavy enough to hang properly, washed until the sheen is gone. Mother-of-pearl buttons, French seams throughout.',
 'Momme measures the weight of silk. Most silk shirts are 12 to 16. At 19 the cloth stops clinging and starts to drape, which is the entire point of wearing silk in the first place.',
 'BR-SHI-001', 'ACTIVE', 420.00, null, 148.00,
 true, false, false, false,
 '100% mulberry silk, 19 momme', 'Hand wash cold or specialist clean. Cool iron on reverse.', 'Made in Italy.',
 '{"Weight":"19 momme","Collar":"Soft point, unfused","Buttons":"Mother-of-pearl","Seams":"French","Cuff":"Single, rounded"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['silk','shirt','italy','bestseller'], 'Best Seller', 264, 8, now() - interval '130 days',
 'Vellum Silk Shirt — BRUNO', '19-momme sand-washed mulberry silk shirt with mother-of-pearl buttons, made in Italy.'),

('Alabaster Poplin Shirt', 'alabaster-poplin-shirt',
 'Two-fold 140s cotton, unfused collar',
 'The white shirt, made properly. Two-fold 140s poplin, an unfused collar that softens with washing, and a split yoke cut on the bias so the shoulders move.',
 'A fused collar is glued. It looks sharp for a year and then bubbles. An unfused collar is three layers of cloth stitched together — it starts softer, and it is still there in a decade.',
 'BR-SHI-002', 'ACTIVE', 340.00, null, 112.00,
 false, false, false, false,
 '100% two-fold 140s Egyptian cotton poplin', 'Machine wash 30°. Iron damp.', 'Woven in Italy. Made in Portugal.',
 '{"Yarn":"Two-fold 140s","Collar":"Unfused semi-spread","Yoke":"Split, bias-cut","Buttons":"Mother-of-pearl","Stitching":"18 per inch"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['cotton','shirt','essential'], null, 401, 9, now() - interval '180 days',
 'Alabaster Poplin Shirt — BRUNO', 'Two-fold 140s Egyptian cotton poplin shirt with an unfused collar and split yoke.'),

('Ivory Linen Overshirt', 'ivory-linen-overshirt',
 'Heavyweight washed linen, patch pockets',
 'A linen overshirt heavy enough to wear as a jacket. Garment-washed so it arrives already soft, with two large patch pockets and a straight hem.',
 'Linen is stiff until it is not. We wash every piece for ninety minutes with volcanic stone before it ships, so the first wear feels like the fiftieth.',
 'BR-SHI-003', 'ACTIVE', 460.00, null, 158.00,
 false, true, false, false,
 '100% European flax linen, 260 g/m²', 'Machine wash 30°. Line dry. Embrace the creases.', 'Woven in Belgium. Made in Portugal.',
 '{"Weight":"260 g/m²","Fit":"Relaxed overshirt","Pockets":"Two patch","Hem":"Straight","Finish":"Stone-washed"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['linen','overshirt','summer','new'], 'New', 88, 10, now() - interval '15 days',
 'Ivory Linen Overshirt — BRUNO', 'Heavyweight stone-washed Belgian flax overshirt, cut to wear as a light jacket.'),

('Solstice Suede Weekender', 'solstice-suede-weekender',
 'Calf suede, brass hardware, 42 litres',
 'A weekend bag in thick calf suede with solid brass hardware and a cotton-drill lining. Forty-two litres — three days, comfortably, or five if you pack like someone who has done this before.',
 'The hardware is solid brass, not plated. Plating chips and then the piece looks cheap forever. Solid brass just goes dark, which is what you want.',
 'BR-LEA-001', 'ACTIVE', 1680.00, null, 620.00,
 true, false, true, false,
 'Calf suede, solid brass hardware, cotton drill lining', 'Brush with a suede brush. Protect before first use.', 'Made in Florence, Italy.',
 '{"Capacity":"42 litres","Dimensions":"55 × 30 × 26 cm","Hardware":"Solid brass","Lining":"Cotton drill","Strap":"Detachable, adjustable"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['leather','suede','bag','florence','limited'], 'Limited', 53, 11, now() - interval '95 days',
 'Solstice Suede Weekender — BRUNO', 'A 42-litre calf suede weekend bag with solid brass hardware, made in Florence.'),

('Onyx Calfskin Belt', 'onyx-calfskin-belt',
 'Single-piece calfskin, brushed brass',
 'A belt cut from a single piece of vegetable-tanned calfskin — no bonding, no splitting. The buckle is solid brushed brass on a hand-set pin.',
 'Most belts are two thin strips glued back to back. Cut one from a single hide and it costs more, weighs more, and never delaminates.',
 'BR-LEA-002', 'ACTIVE', 320.00, null, 94.00,
 false, false, false, false,
 'Vegetable-tanned calfskin, solid brass buckle', 'Wipe with a dry cloth. Condition twice yearly.', 'Made in Italy.',
 '{"Width":"3.5 cm","Thickness":"4 mm","Buckle":"Solid brushed brass","Construction":"Single-piece","Edge":"Hand-burnished"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['leather','belt','accessories'], null, 233, 12, now() - interval '160 days',
 'Onyx Calfskin Belt — BRUNO', 'Single-piece vegetable-tanned calfskin belt with a solid brushed-brass buckle.'),

('Halo Silk Scarf', 'halo-silk-scarf',
 'Hand-rolled twill, 90 × 90 cm',
 'A ninety-centimetre silk twill square with hand-rolled edges. The pattern is a study in refracted light, printed in eleven screens.',
 'Hand-rolling an edge means a seamstress turns the hem twice with a needle, by eye, all the way around. It takes forty minutes per scarf and it is the only reason the edge sits plump instead of flat.',
 'BR-ACC-001', 'ACTIVE', 280.00, null, 88.00,
 false, false, false, false,
 '100% silk twill, 14 momme', 'Specialist clean only.', 'Printed and finished in Como, Italy.',
 '{"Size":"90 × 90 cm","Weight":"14 momme","Edge":"Hand-rolled","Screens":"11","Finish":"Twill"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['silk','scarf','accessories','como'], null, 147, 13, now() - interval '75 days',
 'Halo Silk Scarf — BRUNO', 'A 90cm hand-rolled silk twill scarf, printed in eleven screens in Como.'),

('Sable Cashmere Wrap', 'sable-cashmere-wrap',
 'Double-ply cashmere, 200 × 70 cm',
 'A generous double-ply cashmere wrap with a fringed edge. Two metres long, so it works as a scarf, a shawl, or the only reason a long flight is survivable.',
 'We tried it at 180 centimetres and it was not enough. At 200 it wraps twice with the ends still hanging where they should.',
 'BR-ACC-002', 'ACTIVE', 390.00, 490.00, 138.00,
 true, false, false, false,
 '100% grade-A cashmere, two-ply', 'Hand wash cold, dry flat.', 'Woven in Scotland.',
 '{"Size":"200 × 70 cm","Ply":"Two","Weight":"280 g","Edge":"Hand-knotted fringe","Grade":"A"}'::jsonb,
 'Complimentary insured delivery worldwide. Dispatched within 48 hours.',
 'Thirty days, unworn, with tags. Return shipping is on us.',
 array['cashmere','scarf','accessories','sale'], 'Archive', 195, 14, now() - interval '140 days',
 'Sable Cashmere Wrap — BRUNO', 'A 200cm two-ply grade-A cashmere wrap with a hand-knotted fringe, woven in Scotland.')

on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Product ↔ category
-- -----------------------------------------------------------------------------
insert into product_categories (product_id, category_id, is_primary)
select p.id, c.id, m.is_primary
from (values
  ('obsidian-cashmere-overcoat', 'outerwear',   true),
  ('nocturne-leather-jacket',    'outerwear',   true),
  ('nocturne-leather-jacket',    'leather',     false),
  ('monolith-wool-topcoat',      'outerwear',   true),
  ('atelier-wool-blazer',        'tailoring',   true),
  ('meridian-tailored-trouser',  'tailoring',   true),
  ('cirrus-cashmere-crew',       'knitwear',    true),
  ('ember-merino-rollneck',      'knitwear',    true),
  ('vellum-silk-shirt',          'shirting',    true),
  ('alabaster-poplin-shirt',     'shirting',    true),
  ('ivory-linen-overshirt',      'shirting',    true),
  ('solstice-suede-weekender',   'leather',     true),
  ('onyx-calfskin-belt',         'leather',     true),
  ('onyx-calfskin-belt',         'accessories', false),
  ('halo-silk-scarf',            'accessories', true),
  ('sable-cashmere-wrap',        'accessories', true)
) as m(product_slug, category_slug, is_primary)
join products p   on p.slug = m.product_slug
join categories c on c.slug = m.category_slug
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Images. Two plates per product: the garment, and the same garment closer.
-- Generated SVG (Memory.md D-010) — swap for photography without a code change.
-- -----------------------------------------------------------------------------
insert into product_images (product_id, url, alt, width, height, position, is_primary)
select p.id, '/images/products/' || p.slug || '-1.svg',
       p.name || ', photographed front-on against a dark ground', 1000, 1250, 0, true
from products p
on conflict do nothing;

insert into product_images (product_id, url, alt, width, height, position, is_primary)
select p.id, '/images/products/' || p.slug || '-2.svg',
       p.name || ' — close detail of the collar, fastening and stitching', 1000, 1250, 1, false
from products p
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Options and variants
-- -----------------------------------------------------------------------------
insert into product_options (product_id, name, position, values)
select p.id, 'Size', 0, o.sizes
from (values
  ('obsidian-cashmere-overcoat', array['46','48','50','52','54']),
  ('nocturne-leather-jacket',    array['46','48','50','52']),
  ('monolith-wool-topcoat',      array['46','48','50','52','54']),
  ('atelier-wool-blazer',        array['46','48','50','52','54']),
  ('meridian-tailored-trouser',  array['30','32','34','36','38']),
  ('cirrus-cashmere-crew',       array['S','M','L','XL']),
  ('ember-merino-rollneck',      array['S','M','L','XL']),
  ('vellum-silk-shirt',          array['S','M','L','XL']),
  ('alabaster-poplin-shirt',     array['S','M','L','XL']),
  ('ivory-linen-overshirt',      array['S','M','L','XL']),
  ('onyx-calfskin-belt',         array['85','90','95','100'])
) as o(slug, sizes)
join products p on p.slug = o.slug
on conflict do nothing;

insert into product_options (product_id, name, position, values)
select p.id, 'Colour', 1, o.colours
from (values
  ('obsidian-cashmere-overcoat', array['Obsidian','Camel']),
  ('nocturne-leather-jacket',    array['Black']),
  ('monolith-wool-topcoat',      array['Charcoal','Navy']),
  ('atelier-wool-blazer',        array['Ink','Stone']),
  ('meridian-tailored-trouser',  array['Charcoal','Sand']),
  ('cirrus-cashmere-crew',       array['Bone','Obsidian','Camel']),
  ('ember-merino-rollneck',      array['Ember','Obsidian']),
  ('vellum-silk-shirt',          array['Vellum','Ink']),
  ('alabaster-poplin-shirt',     array['White']),
  ('ivory-linen-overshirt',      array['Ivory','Olive']),
  ('solstice-suede-weekender',   array['Tobacco']),
  ('onyx-calfskin-belt',         array['Onyx','Chestnut']),
  ('halo-silk-scarf',            array['Champagne','Obsidian']),
  ('sable-cashmere-wrap',        array['Sable','Bone'])
) as o(slug, colours)
join products p on p.slug = o.slug
on conflict do nothing;

-- Build the cartesian product of the declared options into real variants.
insert into product_variants (product_id, title, sku, option_values, stock_quantity, low_stock_threshold, position)
select
  p.id,
  case when sz.v is null then col.v else col.v || ' / ' || sz.v end,
  p.sku || '-' || upper(left(regexp_replace(col.v, '[^A-Za-z0-9]', '', 'g'), 3))
        || coalesce('-' || upper(regexp_replace(sz.v, '[^A-Za-z0-9]', '', 'g')), ''),
  jsonb_strip_nulls(jsonb_build_object('Colour', col.v, 'Size', sz.v)),
  -- Deterministic pseudo-random stock so the demo has in-stock, low-stock and
  -- sold-out states without being obviously uniform.
  (abs(hashtext(p.slug || col.v || coalesce(sz.v, ''))) % 17),
  4,
  (col.ord * 100 + coalesce(sz.ord, 0))
from products p
join lateral (
  select value as v, ordinality as ord
  from product_options po, unnest(po.values) with ordinality as t(value, ordinality)
  where po.product_id = p.id and po.name = 'Colour'
) col on true
left join lateral (
  select value as v, ordinality as ord
  from product_options po, unnest(po.values) with ordinality as t(value, ordinality)
  where po.product_id = p.id and po.name = 'Size'
) sz on true
on conflict (sku) do nothing;

-- Seed the inventory ledger so every balance has a provenance.
insert into inventory_transactions (variant_id, delta, reason, balance_after, note)
select v.id, v.stock_quantity, 'INITIAL', v.stock_quantity, 'Opening balance from seed data'
from product_variants v
where v.stock_quantity > 0
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Collections
-- -----------------------------------------------------------------------------
insert into collections (name, slug, description, position, seo_title, seo_description) values
  ('The Winter Edit', 'winter-edit', 'Eight pieces for the cold months, chosen for weight and drape.', 1, 'The Winter Edit — BRUNO', 'A curated edit of outerwear and knitwear for the cold months.'),
  ('Members'' Reserve', 'members-reserve', 'Released first, and sometimes only, to members of the House.', 2, 'Members'' Reserve — BRUNO', 'Pieces released first to BRUNO members.'),
  ('The Foundation', 'foundation', 'The six pieces we would keep if we could keep only six.', 3, 'The Foundation — BRUNO', 'Six essential pieces that anchor a considered wardrobe.')
on conflict (slug) do nothing;

insert into collection_products (collection_id, product_id, position)
select c.id, p.id, row_number() over ()
from collections c
join products p on p.slug = any(array['obsidian-cashmere-overcoat','monolith-wool-topcoat','ember-merino-rollneck','sable-cashmere-wrap','cirrus-cashmere-crew'])
where c.slug = 'winter-edit'
on conflict do nothing;

insert into collection_products (collection_id, product_id, position)
select c.id, p.id, row_number() over ()
from collections c
join products p on p.slug = any(array['nocturne-leather-jacket','solstice-suede-weekender','obsidian-cashmere-overcoat'])
where c.slug = 'members-reserve'
on conflict do nothing;

insert into collection_products (collection_id, product_id, position)
select c.id, p.id, row_number() over ()
from collections c
join products p on p.slug = any(array['alabaster-poplin-shirt','cirrus-cashmere-crew','meridian-tailored-trouser','atelier-wool-blazer','onyx-calfskin-belt','monolith-wool-topcoat'])
where c.slug = 'foundation'
on conflict do nothing;

-- Manual cross-sells
insert into product_relations (product_id, related_id, kind, position)
select a.id, b.id, 'RELATED', r.pos
from (values
  ('atelier-wool-blazer',       'meridian-tailored-trouser', 1),
  ('atelier-wool-blazer',       'alabaster-poplin-shirt',    2),
  ('atelier-wool-blazer',       'onyx-calfskin-belt',        3),
  ('obsidian-cashmere-overcoat','sable-cashmere-wrap',       1),
  ('obsidian-cashmere-overcoat','cirrus-cashmere-crew',      2),
  ('vellum-silk-shirt',         'halo-silk-scarf',           1),
  ('cirrus-cashmere-crew',      'meridian-tailored-trouser', 1),
  ('nocturne-leather-jacket',   'solstice-suede-weekender',  1)
) as r(a_slug, b_slug, pos)
join products a on a.slug = r.a_slug
join products b on b.slug = r.b_slug
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Reviews
-- -----------------------------------------------------------------------------
insert into reviews (product_id, author_name, author_location, rating, title, body, status, is_verified_purchase, is_featured, created_at)
select p.id, r.author, r.loc, r.rating, r.title, r.body, 'APPROVED', true, r.featured, now() - (r.days || ' days')::interval
from (values
  ('obsidian-cashmere-overcoat','Marcus D.','London', 5, 'Worth the wait','I put off buying a coat at this price for two years. Three winters in and the hand-finished edges have not moved. The unlined construction means it is genuinely warmer than the padded coat it replaced, and it packs better.', true, 42),
  ('obsidian-cashmere-overcoat','Helena V.','Copenhagen', 5, 'The drape is the thing','It falls in one line from the shoulder in a way I have only seen on made-to-measure. I sized up one and the proportion is exactly right over a jacket.', false, 88),
  ('cirrus-cashmere-crew','James O.','New York', 5, 'No pilling after a year','I own four cashmere crews from other houses and all of them pilled under the arms within a season. This one has not. The grade-A claim is doing real work.', true, 31),
  ('cirrus-cashmere-crew','Priya S.','Singapore', 4, 'Perfect weight, runs slightly large','Twelve gauge is exactly right for a warm climate — I wear it under a blazer in air conditioning year round. I would size down.', false, 64),
  ('cirrus-cashmere-crew','Tomas R.','Zurich', 5, 'Hand-linked neck is noticeable','You can feel the absence of a seam ridge at the collar immediately. Small thing, but it is why this sits flat under a shirt.', false, 120),
  ('vellum-silk-shirt','Adrienne L.','Paris', 5, 'Nineteen momme changes everything','Every other silk shirt I own clings. This one hangs. The sand-wash finish means it reads matte rather than shiny, which is the difference between evening and every day.', true, 19),
  ('vellum-silk-shirt','Daniel K.','Melbourne', 5, 'Second one ordered','Bought the vellum, immediately ordered the ink. French seams throughout, which you notice when you roll the sleeves.', false, 55),
  ('nocturne-leather-jacket','Sofia M.','Milan', 5, 'It is already changing','Six months in and it has darkened at the elbows and the fold of the collar exactly as described. It looks like mine now, not like a product.', true, 27),
  ('monolith-wool-topcoat','Ewan B.','Edinburgh', 5, 'Actually sheds rain','I was sceptical about the melton claim. It rained for forty minutes on me in November and the water sat on the surface. Genuinely windproof too.', true, 73),
  ('monolith-wool-topcoat','Renata C.','Toronto', 4, 'Heavy, in the good way','820 grams is not a marketing number, you feel it on the shoulders. It is a coat for standing at a bus stop in January, not for a warm office.', false, 101),
  ('atelier-wool-blazer','Christopher N.','Boston', 5, 'The shoulder is the whole point','No padding at all, and yet it holds. This is the first off-the-rack jacket that has not made me look like I borrowed it.', true, 12),
  ('alabaster-poplin-shirt','Yuki T.','Tokyo', 5, 'The collar still stands','Two years, weekly wear, machine washed every time. The unfused collar has softened but has never bubbled. I have bought three more.', true, 96),
  ('alabaster-poplin-shirt','Nadia F.','Beirut', 4, 'Excellent, iron it damp','Exactly as described. The 140s poplin does crease — iron it damp as they say and it presses beautifully.', false, 48),
  ('solstice-suede-weekender','Oliver H.','Amsterdam', 5, 'Brass has gone dark, as promised','A year of monthly flights. The suede has scuffed in a way that looks deliberate and the brass has taken on a proper patina. Forty-two litres is genuinely three days.', true, 38),
  ('ember-merino-rollneck','Isabelle G.','Montreal', 5, 'The collar does not collapse','I have thrown out three rollnecks whose necks went limp by February. This one is knitted whole and it still stands.', true, 22),
  ('sable-cashmere-wrap','Clara W.','Lisbon', 5, 'Two hundred centimetres is correct','I have a 180 from elsewhere and it is always four inches short of wrapping properly. This one does. It lives in my carry-on.', true, 59),
  ('meridian-tailored-trouser','Felix A.','Berlin', 4, 'Unhemmed is the right call','Shipped unfinished so my tailor set the break. The single pleat means they still look clean after eight hours at a desk.', false, 16),
  ('onyx-calfskin-belt','Grace P.','Chicago', 5, 'Single-piece is worth it','My last belt delaminated in eighteen months. This one is cut from one hide and there is nothing to come apart.', true, 81),
  ('halo-silk-scarf','Marguerite D.','Lyon', 5, 'The rolled edge is beautiful','You can see the forty minutes in the hem. It sits plump around the neck rather than lying flat like a printed square.', false, 34),
  ('ivory-linen-overshirt','Sam K.','Sydney', 4, 'Soft from the first wear','The stone-wash means none of that cardboard stiffness new linen usually has. Wore it straight out of the box.', true, 9)
) as r(slug, author, loc, rating, title, body, featured, days)
join products p on p.slug = r.slug
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Membership
-- -----------------------------------------------------------------------------
insert into membership_tiers (name, slug, tagline, description, benefits, min_spend, discount_percent, early_access_hours, position) values
  ('Atelier', 'atelier', 'The invitation',
   'Where the relationship begins. Early sight of every release and a direct line to the people who make the clothes.',
   array['48-hour early access to every release','Complimentary insured shipping, always','Invitations to atelier previews','A direct line to our head of client care'],
   0, 0, 48, 1),
  ('Circle', 'circle', 'The relationship',
   'For clients who have made BRUNO part of how they dress. Adds private allocation and lifetime repairs.',
   array['Everything in Atelier','Private allocation on limited runs','Ten per cent on every order','Lifetime repairs and re-finishing','Two personal styling sessions each year'],
   5000, 10, 96, 2),
  ('Maison', 'maison', 'The house',
   'By invitation only. Made-to-measure, first refusal on archive pieces, and a permanent record of your measurements.',
   array['Everything in Circle','Made-to-measure at no surcharge','First refusal on archive and one-of-one pieces','Fifteen per cent on every order','Your measurements held permanently','An annual private appointment in Florence'],
   25000, 15, 168, 3)
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Brand values
-- -----------------------------------------------------------------------------
insert into brand_values (title, description, icon, detail, position) values
  ('Made in small numbers', 'Nothing we make exceeds four hundred pieces. Most run to sixty.', 'Gem',
   'Scarcity is not a marketing device here — it is a consequence of insisting on workshops that finish by hand.', 1),
  ('Materials you can name', 'Every fibre is traceable to a mill we have visited.', 'Layers',
   'Grade-A Mongolian cashmere. Two-fold 140s Egyptian cotton. Vegetable-tanned Tuscan calf. We publish the mill, the weight and the micron.', 2),
  ('Finished by hand', 'The last eleven hours of a coat are a person, not a machine.', 'Scissors',
   'Hand-closed edges, hand-linked collars, hand-rolled hems. These are the operations that decide whether a garment survives a decade.', 3),
  ('Repaired, not replaced', 'Lifetime repairs on everything we have ever sold.', 'RefreshCw',
   'Send it back. We re-finish edges, re-link collars, re-dye leather and replace hardware. A BRUNO piece should outlast the reason you bought it.', 4)
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Story sections
-- -----------------------------------------------------------------------------
insert into story_sections (key, eyebrow, title, body, quote, image_url, image_alt, stat_value, stat_label, cta_label, cta_href, position) values
  ('atelier', 'The Atelier', 'Eleven hours, one coat',
   E'Our overcoats are made in a workshop of nineteen people outside Porto. The cloth arrives from Biella as a double-faced length — two cashmeres bonded together. Before a single seam is sewn, a finisher separates those layers by hand at every edge, so that the seam can be closed inside the cloth and disappear.\n\nIt is slow, it cannot be mechanised, and it is the reason the coat has no lining, no facing, and no weight it does not need.',
   'You cannot rush an edge. The cloth decides how fast you go.',
   '/images/editorial/atelier.svg', 'Layered light composition evoking a workshop interior',
   '11', 'hours of hand-finishing per coat', 'Read the full process', '/journal/eleven-hours', 1),

  ('materials', 'The Materials', 'We will tell you the micron',
   E'Most houses say "the finest cashmere". We say 15.5 microns, 34-millimetre staple, grade-A, from a co-operative in Mongolia we buy from directly. We say 19 momme for the silk and 820 grams per square metre for the melton.\n\nThese are the numbers that decide whether something pills, sags, or lasts. Publishing them is the simplest way to be held to them.',
   'A specification you can check is worth more than an adjective you cannot.',
   '/images/editorial/materials.svg', 'Fine gradient study evoking layered natural fibres',
   '15.5', 'micron grade-A cashmere', 'See our material standards', '/materials', 2),

  ('provenance', 'The Provenance', 'Four mills, three workshops',
   E'Biella for cashmere. Huddersfield for worsted. Como for silk. Hawick for knitwear. Three workshops — Porto, Florence, Naples — that between them employ under two hundred people.\n\nWe have been to all of them. We go back twice a year. When something is wrong, we know whose hands it passed through, and so do they.',
   'A short supply chain is not an ethical position. It is just the only way to keep a standard.',
   '/images/editorial/provenance.svg', 'Cartographic light composition evoking European provenance',
   '7', 'partners, all visited twice a year', 'Meet the makers', '/provenance', 3)
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- Testimonials
-- -----------------------------------------------------------------------------
insert into testimonials (author_name, author_title, author_location, quote, rating, position, is_featured) values
  ('Helena Vestergaard', 'Architect', 'Copenhagen',
   'I have bought one BRUNO piece a year for four years. Not one of them has been replaced, which is the only review that matters.', 5, 1, true),
  ('Marcus Delacroix', 'Gallerist', 'London',
   'The overcoat is the single best thing in my wardrobe and I have owned some expensive mistakes. The difference is that this one is still improving.', 5, 2, true),
  ('Yuki Tanaka', 'Creative Director', 'Tokyo',
   'They publish the micron count. Nobody publishes the micron count. It tells you everything about how they think.', 5, 3, true),
  ('Sofia Marchetti', 'Photographer', 'Milan',
   'I live in a city full of leather and I still get asked about this jacket. It has aged into something none of the new ones look like.', 5, 4, false),
  ('Oliver Hendricks', 'Founder', 'Amsterdam',
   'Forty flights a year with the weekender. The brass has gone dark and the suede has scars. It looks better than the day it arrived.', 5, 5, false)
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- FAQs
-- -----------------------------------------------------------------------------
insert into faqs (question, answer, category, position) values
  ('How limited is "limited"?', 'Nothing we make exceeds four hundred pieces, and most limited releases run to sixty. When a size sells out we do not re-cut it — the run is the run. Members see every release forty-eight hours before it opens publicly.', 'Ordering', 1),
  ('Why is there no lining in the overcoat?', 'The cloth is double-faced: two lengths of cashmere bonded together. A lining would add weight and remove the drape that makes the coat worth making. Every edge is closed by hand instead.', 'Products', 2),
  ('What does membership cost?', 'Nothing. Atelier membership is free and begins the first time you buy. Circle opens at five thousand in lifetime spend, Maison at twenty-five thousand and by invitation. There is no subscription and there never will be.', 'Membership', 3),
  ('Do you really repair anything, forever?', 'Yes, on anything we have ever sold, for as long as we exist. We re-finish edges, re-link collars, re-dye leather, replace hardware and re-knit cuffs. You pay return shipping; we pay for the work.', 'Care', 4),
  ('How long does delivery take?', 'Orders are dispatched within 48 hours. Two to three working days within Europe and North America, three to five elsewhere. Shipping is insured and complimentary on every order, with no minimum.', 'Shipping', 5),
  ('Can I return something?', 'Thirty days, unworn, with tags attached. We pay return shipping. Made-to-measure and monogrammed pieces are the only exceptions, and we will say so clearly before you order.', 'Returns', 6),
  ('How should I choose a size?', 'Every product page carries the measurements of the actual garment, not a body chart. If you are between sizes, our client care team will tell you which way to go — they have handled the pieces.', 'Sizing', 7),
  ('Where are your clothes made?', 'Cloth from Biella, Huddersfield and Como. Garments from workshops in Porto, Florence and Naples. Knitwear from Hawick. We name every partner and we visit each of them twice a year.', 'Products', 8)
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Banners
-- -----------------------------------------------------------------------------
insert into banners (placement, eyebrow, title, subtitle, body, cta_label, cta_href, secondary_cta_label, secondary_cta_href, image_url, image_alt, position, is_active) values
  ('ANNOUNCEMENT_BAR', null, 'Complimentary insured delivery worldwide', null, null, 'The Winter Edit', '/collections/winter-edit', null, null, null, null, 1, true),
  ('HOME_HERO', 'Autumn / Winter — Sixty pieces',
   'Clothes that outlast the reason you bought them',
   'Grade-A cashmere, vegetable-tanned leather and half-canvas tailoring, made in numbers small enough to finish by hand.',
   null, 'Explore the collection', '/collection', 'The atelier', '/journal/eleven-hours',
   '/images/editorial/hero.svg', 'Liquid glass composition in obsidian and champagne', 1, true),
  ('HOME_PROMO', 'The Members'' Reserve',
   'Some pieces never reach the public floor',
   'Members see every release forty-eight hours early, and a small number of pieces are never released beyond the Circle at all.',
   null, 'Request an invitation', '/membership', null, null,
   '/images/editorial/membership.svg', 'Refracted champagne light through dark glass', 1, true)
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Navigation
-- -----------------------------------------------------------------------------
insert into navigation_items (menu, label, href, position) values
  ('header', 'Collection',  '/collection',  1),
  ('header', 'Outerwear',   '/category/outerwear', 2),
  ('header', 'Tailoring',   '/category/tailoring', 3),
  ('header', 'Knitwear',    '/category/knitwear',  4),
  ('header', 'The House',   '/house',       5),
  ('header', 'Membership',  '/membership',  6),
  ('footer-shop', 'All pieces',   '/collection', 1),
  ('footer-shop', 'Outerwear',    '/category/outerwear', 2),
  ('footer-shop', 'Tailoring',    '/category/tailoring', 3),
  ('footer-shop', 'Knitwear',     '/category/knitwear', 4),
  ('footer-shop', 'Shirting',     '/category/shirting', 5),
  ('footer-shop', 'Leather',      '/category/leather', 6),
  ('footer-shop', 'Accessories',  '/category/accessories', 7),
  ('footer-house', 'The House',   '/house', 1),
  ('footer-house', 'Materials',   '/materials', 2),
  ('footer-house', 'Provenance',  '/provenance', 3),
  ('footer-house', 'The Journal', '/journal', 4),
  ('footer-house', 'Membership',  '/membership', 5),
  ('footer-care', 'Shipping',     '/shipping', 1),
  ('footer-care', 'Returns',      '/returns', 2),
  ('footer-care', 'Repairs',      '/repairs', 3),
  ('footer-care', 'Size guide',   '/sizing', 4),
  ('footer-care', 'Contact',      '/contact', 5),
  ('footer-legal', 'Privacy',     '/privacy', 1),
  ('footer-legal', 'Terms',       '/terms', 2),
  ('footer-legal', 'Accessibility','/accessibility', 3)
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Shipping methods
-- -----------------------------------------------------------------------------
insert into shipping_methods (name, description, price, free_over, min_delivery_days, max_delivery_days, position) values
  ('Insured Standard', 'Tracked and insured. Signature required.', 0.00, 0.00, 2, 5, 1),
  ('Insured Express',  'Next working day where the network allows.', 35.00, 1500.00, 1, 2, 2),
  ('White Glove',      'Hand delivery by appointment. Selected cities.', 120.00, null, 1, 3, 3)
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Coupons
-- -----------------------------------------------------------------------------
insert into coupons (code, description, discount_type, scope, value, minimum_order, maximum_discount, usage_limit, usage_limit_per_customer, starts_at, ends_at, is_active, members_only) values
  ('WELCOME10', 'Ten per cent off a first order', 'PERCENTAGE', 'ORDER', 10, 200, 300, 1000, 1, now() - interval '30 days', now() + interval '365 days', true, false),
  ('ATELIER15', 'Fifteen per cent for members', 'PERCENTAGE', 'ORDER', 15, 0, null, null, null, now() - interval '10 days', now() + interval '180 days', true, true),
  ('FREESHIP',  'Complimentary express shipping', 'FREE_SHIPPING', 'ORDER', 0, 500, null, 500, 2, now() - interval '5 days', now() + interval '90 days', true, false),
  ('ARCHIVE100','One hundred off archive pieces', 'FIXED_AMOUNT', 'ORDER', 100, 800, null, 200, 1, now() - interval '2 days', now() + interval '45 days', true, false)
on conflict (code) do nothing;

-- -----------------------------------------------------------------------------
-- Journal
-- -----------------------------------------------------------------------------
insert into blog_categories (name, slug, description, position) values
  ('The Process',  'process',  'How things are made, and why it takes as long as it does.', 1),
  ('Materials',    'materials','Fibre, hide and cloth, in specifics.', 2),
  ('The Wardrobe', 'wardrobe', 'What to buy, in what order, and what to stop buying.', 3)
on conflict (slug) do nothing;

insert into blog_posts (slug, title, excerpt, content, featured_image_url, featured_image_alt, category_id, author_name, tags, status, reading_minutes, published_at, seo_title, seo_description)
select b.slug, b.title, b.excerpt, b.content, b.image, b.alt, c.id, b.author, b.tags, 'PUBLISHED', b.mins, now() - (b.days || ' days')::interval, b.title || ' — BRUNO Journal', b.excerpt
from (values
  ('eleven-hours', 'Eleven hours, one coat',
   'Why a double-faced cashmere overcoat cannot be finished by a machine, and what those eleven hours actually buy you.',
   E'There is a moment in making a double-faced coat where the machines stop.\n\nThe cloth arrives from Biella as two lengths of cashmere bonded into one. To close a seam invisibly, a finisher has to separate those two layers by hand along every edge — running a blade between them, opening a pocket of a few millimetres, and then stitching the seam inside the cloth so it disappears entirely.\n\nThere is no machine for this. There has never been a machine for this. It is nineteen people in a workshop outside Porto, a blade, and eleven hours.\n\n**What it buys you.** No lining, which is roughly four hundred grams you do not carry. No facing, which is the stiff panel that makes most coats break awkwardly at the lapel. And an edge that is cloth all the way through, so it will not fray, delaminate, or show a different colour when it wears.\n\n**What it costs.** Sixty coats a season. That is the whole run, and it is not a marketing decision — it is arithmetic. Nineteen people, eleven hours each, one season.',
   '/images/editorial/journal-atelier.svg', 'Light study of a workshop interior in obsidian and champagne', 'process', 'The Atelier', array['cashmere','process','outerwear'], 8, 24),

  ('micron-count', 'What a micron count actually tells you',
   'Grade-A, 15.5 micron, 34-millimetre staple. Three numbers that decide whether a cashmere sweater survives its second winter.',
   E'"The finest cashmere" means nothing. Here are the three numbers that mean something.\n\n**Micron** is fibre diameter. Cashmere runs from about 14 to 19 microns. Finer is softer, and finer is more expensive, but finer alone is not the whole story.\n\n**Staple length** is how long each fibre is. This is the number nobody quotes, and it is the one that decides pilling. Short fibres work loose from the yarn under friction, ball up, and become the pills you shave off a jumper in its second month. Grade-A cashmere is longer than 34 millimetres. Grade-C can be half that.\n\n**Ply** is how many yarns are twisted together. Two-ply is the minimum for a garment you intend to keep. Single-ply is lighter and cheaper and will go through at the elbow.\n\nWe knit at 15.5 micron, 34-millimetre staple, two-ply. A jumper made this way costs about three times what a grade-C equivalent costs and lasts something like eight times as long, which is a bargain expressed inconveniently.',
   '/images/editorial/journal-materials.svg', 'Fine fibre gradient study', 'materials', 'The Atelier', array['cashmere','materials','knitwear'], 6, 51),

  ('six-pieces', 'The six pieces',
   'If you could keep only six things, these would be the six — and the order in which to buy them.',
   E'Most wardrobes fail because they are wide rather than deep. Here is the depth version.\n\n**One. A white shirt with an unfused collar.** It goes under everything and it is the item people notice when it is bad. Two-fold 140s poplin, split yoke, mother-of-pearl.\n\n**Two. A cashmere crew in a neutral.** Twelve gauge — fine enough to layer, warm enough alone. Bone or obsidian, nothing else, not yet.\n\n**Three. A high-rise trouser in tropical wool.** Buy it unhemmed and have it finished. This single act does more for how clothes look on you than any other three hundred you could spend.\n\n**Four. A soft-shouldered blazer.** Half-canvas, unpadded, patch pockets. It should not look like it came from an office.\n\n**Five. A belt cut from one piece of hide.** Not two strips glued together. You will own it for fifteen years.\n\n**Six. A coat heavy enough to be the only one.** This is the expensive one, and it should be the last one you buy, because by the time you get here you will know what you actually wear.\n\nThat is the wardrobe. Everything after it is preference.',
   '/images/editorial/journal-wardrobe.svg', 'Composed grid of material tones', 'wardrobe', 'The Atelier', array['wardrobe','essentials'], 7, 12),

  ('vegetable-tanning', 'Forty days in oak bark',
   'Chrome tanning takes six hours. Vegetable tanning takes forty days. The difference shows up in year three.',
   E'Ninety per cent of the world''s leather is chrome-tanned. It takes about six hours, produces a hide of uniform colour that resists water and stains, and is, for most purposes, the correct choice.\n\nWe do not use it.\n\nVegetable tanning suspends the hide in pits of oak, chestnut and mimosa bark for forty days. The tannins bind to the collagen slowly and unevenly. What comes out is a hide that is still, in a meaningful sense, reactive: it darkens in sunlight, absorbs the oil from your hands, and holds a fold as a permanent crease.\n\nIn year one, chrome-tanned leather looks better. It is more even, more consistent, more like a product.\n\nIn year three, it looks exactly the same as it did, except for the places where the finish has cracked. The vegetable-tanned hide, by then, has gone several shades deeper at the elbows and the collar fold, and has stopped looking like a product at all.\n\nThat is the trade. We think it is an easy one.',
   '/images/editorial/journal-leather.svg', 'Deep grained surface study in warm tones', 'materials', 'The Atelier', array['leather','materials','process'], 5, 68)
) as b(slug, title, excerpt, content, image, alt, cat_slug, author, tags, mins, days)
join blog_categories c on c.slug = b.cat_slug
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Pages
-- -----------------------------------------------------------------------------
insert into pages (slug, title, subtitle, content, status, published_at, seo_title, seo_description) values
  ('house', 'The House', 'Nineteen people outside Porto, and a rule about numbers',
   E'BRUNO makes a small number of things and finishes them by hand.\n\nThat sentence is the entire strategy. Everything else — the mills we buy from, the workshops we use, the decision to publish micron counts and garment weights, the lifetime repair programme — follows from it.\n\nWe began in 2019 with six pieces and one workshop. We now make around forty pieces a year across six categories, from four mills and three workshops, none of which employs more than a hundred people. We visit all of them twice a year.\n\nWe are not trying to become large. Large would require the operations we have specifically refused: fused collars, chrome tanning, bonded belts, lined coats. Each of those makes a garment cheaper and faster and worse in its third year, which is the year we care about.',
   'PUBLISHED', now() - interval '300 days', 'The House — BRUNO', 'BRUNO makes a small number of things and finishes them by hand. Four mills, three workshops, forty pieces a year.'),
  ('materials', 'Materials', 'The numbers, published',
   E'We publish specifications because a specification can be checked and an adjective cannot.\n\n**Cashmere.** Grade-A Mongolian. 15.5 micron, 34mm staple, two-ply. Knitted in Hawick, Scotland.\n\n**Wool.** Super 120s and 130s worsted from Huddersfield; 90/10 wool-cashmere melton at 820 g/m² from Yorkshire; tropical wool from Biella.\n\n**Silk.** Mulberry silk at 19 momme for shirting, 14 momme twill for scarves. Woven, printed and finished in Como.\n\n**Cotton.** Two-fold 140s Egyptian poplin, woven in Italy.\n\n**Linen.** European flax at 260 g/m², woven in Belgium, stone-washed before shipping.\n\n**Leather.** Vegetable-tanned Tuscan calf and lambskin, forty days in oak, chestnut and mimosa bark. Aniline finish. Solid brass hardware, never plated.',
   'PUBLISHED', now() - interval '280 days', 'Materials — BRUNO', 'Grade-A cashmere at 15.5 micron, 19-momme silk, 820gsm melton, vegetable-tanned Tuscan calf. Every specification, published.'),
  ('shipping', 'Shipping', 'Insured, worldwide, complimentary',
   E'Every order ships insured and tracked at no cost, with no minimum.\n\nOrders are dispatched within 48 hours. Two to three working days in Europe and North America, three to five elsewhere. Signature is required on delivery.\n\nExpress delivery is 35, complimentary over 1,500. White-glove hand delivery by appointment is available in selected cities at 120.\n\nDuties and taxes are prepaid for the UK, EU, US, Canada, Australia, Japan and Singapore. Elsewhere they are collected on delivery.',
   'PUBLISHED', now() - interval '250 days', 'Shipping — BRUNO', 'Complimentary insured worldwide delivery, dispatched within 48 hours.'),
  ('returns', 'Returns & Repairs', 'Thirty days to change your mind. Forever to fix it.',
   E'**Returns.** Thirty days from delivery, unworn, with tags attached. We pay return shipping. Refunds are issued to the original payment method within five working days of the piece arriving back with us.\n\nMade-to-measure and monogrammed pieces cannot be returned, and we will tell you so clearly before you order.\n\n**Repairs.** Lifetime, on anything we have ever sold. We re-finish edges, re-link collars, re-knit cuffs, re-dye leather and replace hardware. You pay return shipping; the work itself is free, permanently, regardless of how you came to own the piece.',
   'PUBLISHED', now() - interval '250 days', 'Returns & Repairs — BRUNO', 'Thirty-day returns with shipping paid, and free lifetime repairs on everything we have ever made.')
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Site settings. is_public = true is readable by the storefront (see RLS 0008).
-- -----------------------------------------------------------------------------
insert into site_settings (key, value, group_name, label, is_public) values
  ('site.name',            '"BRUNO"'::jsonb,                                    'general',  'Site name', true),
  ('site.tagline',         '"Premium Apparel"'::jsonb,                          'general',  'Tagline', true),
  ('site.description',     '"Clothes made in small numbers and finished by hand. Grade-A cashmere, vegetable-tanned leather, half-canvas tailoring."'::jsonb, 'seo', 'Default meta description', true),
  ('site.url',             '"https://bruno.example.com"'::jsonb,                'general',  'Canonical site URL', true),
  ('site.currency',        '"USD"'::jsonb,                                      'commerce', 'Default currency', true),
  ('site.email',           '"clientcare@bruno.example.com"'::jsonb,             'contact',  'Client care email', true),
  ('site.phone',           '"+1 (212) 555-0180"'::jsonb,                        'contact',  'Client care telephone', true),
  ('site.address',         '"41 Rue Saint-Honoré, 75001 Paris"'::jsonb,         'contact',  'Registered address', true),
  ('site.hours',           '"Monday to Friday, 09:00–18:00 CET"'::jsonb,        'contact',  'Client care hours', true),
  ('social.instagram',     '"https://instagram.com/bruno"'::jsonb,              'social',   'Instagram', true),
  ('social.pinterest',     '"https://pinterest.com/bruno"'::jsonb,              'social',   'Pinterest', true),
  ('commerce.free_shipping_threshold', '0'::jsonb,                              'commerce', 'Free shipping threshold', true),
  ('commerce.tax_rate',    '0.0'::jsonb,                                        'commerce', 'Default tax rate', false),
  ('commerce.low_stock_threshold', '4'::jsonb,                                  'commerce', 'Default low-stock threshold', false),
  ('analytics.ga4_id',     'null'::jsonb,                                       'analytics','GA4 measurement ID', true),
  ('analytics.meta_pixel', 'null'::jsonb,                                       'analytics','Meta Pixel ID', true)
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- Permission matrix
-- -----------------------------------------------------------------------------
insert into permissions (key, resource, action, description) values
  ('products.read','products','read','View the catalogue'),
  ('products.write','products','write','Create and edit products'),
  ('products.delete','products','delete','Archive or delete products'),
  ('inventory.adjust','inventory','adjust','Change stock levels'),
  ('orders.read','orders','read','View orders'),
  ('orders.fulfil','orders','fulfil','Change fulfilment status and add tracking'),
  ('orders.refund','orders','refund','Issue refunds'),
  ('customers.read','customers','read','View customer records'),
  ('customers.write','customers','write','Edit customer records'),
  ('coupons.write','coupons','write','Create and edit promotions'),
  ('reviews.moderate','reviews','moderate','Approve, hide and feature reviews'),
  ('content.write','content','write','Edit pages, banners, FAQs and testimonials'),
  ('blog.write','blog','write','Write and publish journal articles'),
  ('seo.write','seo','write','Edit SEO metadata'),
  ('analytics.read','analytics','read','View the analytics dashboard'),
  ('settings.write','settings','write','Change site settings'),
  ('users.write','users','write','Manage staff accounts and roles')
on conflict (key) do nothing;

insert into role_permissions (role, permission_id)
select 'SUPER_ADMIN'::user_role, id from permissions
on conflict do nothing;

insert into role_permissions (role, permission_id)
select 'ADMIN'::user_role, id from permissions where key <> 'users.write'
on conflict do nothing;

insert into role_permissions (role, permission_id)
select 'MANAGER'::user_role, id from permissions
where key in ('products.read','products.write','inventory.adjust','orders.read',
              'orders.fulfil','customers.read','coupons.write','reviews.moderate',
              'content.write','blog.write','seo.write','analytics.read')
on conflict do nothing;

insert into role_permissions (role, permission_id)
select 'EDITOR'::user_role, id from permissions
where key in ('products.read','content.write','blog.write','seo.write','reviews.moderate')
on conflict do nothing;

commit;

-- -----------------------------------------------------------------------------
-- After seeding: promote yourself to SUPER_ADMIN.
-- Sign up through the app first, then run:
--
--   update profiles set role = 'SUPER_ADMIN' where email = 'you@example.com';
-- -----------------------------------------------------------------------------
