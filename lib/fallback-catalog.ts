/**
 * lib/fallback-catalog.ts
 *
 * The curated static catalogue that every query in `lib/queries` falls back to
 * when Supabase is unconfigured or unreachable (Memory.md D-011).
 *
 * GENERATED from `supabase/seed.sql` — the two cannot drift, because this file
 * was exported from a database with that seed applied. Regenerate rather than
 * hand-edit.
 *
 * Reads fall back. Writes never do: a failed write fails loudly.
 */

export const fallbackData = {
  "products": [
    {
      "slug": "obsidian-cashmere-overcoat",
      "name": "Obsidian Cashmere Overcoat",
      "subtitle": "Double-faced cashmere, unlined, hand-finished",
      "description": "A full-length overcoat in double-faced Italian cashmere. Because the cloth is bonded rather than lined, the coat carries its own structure and falls in one clean column from the shoulder. Every edge is closed by hand — there is no facing, no lining, and nowhere to hide a shortcut.",
      "story": "The mill in Biella has been weaving double-faced cloth for four generations. It takes two lengths of cashmere, bonds them, and then a finisher separates the layers by hand at every edge so the seam can be closed invisibly. One coat takes eleven hours of hand-finishing. We make sixty a season.",
      "sku": "BR-OUT-001",
      "price": 1890.0,
      "compare_at_price": null,
      "currency": "USD",
      "badge": "Limited",
      "is_featured": true,
      "is_new": false,
      "is_limited": true,
      "is_members_only": false,
      "materials": "100% Italian double-faced cashmere",
      "care_instructions": "Specialist dry clean only. Brush after wear. Store on a broad wooden hanger.",
      "origin": "Woven in Biella, Italy. Made in Portugal.",
      "specifications": {
        "Fit": "Straight, mid-calf",
        "Weight": "780 g/m²",
        "Closure": "Concealed four-button placket",
        "Pockets": "Two welt, one interior",
        "Finishing": "Hand-closed edges"
      },
      "shipping_info": "Complimentary insured delivery worldwide. Dispatched within 48 hours.",
      "returns_info": "Thirty days, unworn, with tags. Return shipping is on us.",
      "tags": [
        "cashmere",
        "overcoat",
        "winter",
        "hand-finished",
        "limited"
      ],
      "rating_average": 5.0,
      "rating_count": 2,
      "units_sold": 84,
      "position": 1,
      "seo_title": "Obsidian Cashmere Overcoat — BRUNO",
      "seo_description": "A double-faced Italian cashmere overcoat, unlined and hand-finished. Sixty made this season.",
      "category_slug": "outerwear",
      "category_name": "Outerwear",
      "images": [
        {
          "url": "/images/products/obsidian-cashmere-overcoat-1.svg",
          "alt": "Obsidian Cashmere Overcoat — material study in obsidian and champagne",
          "width": 1000,
          "height": 1250
        },
        {
          "url": "/images/products/obsidian-cashmere-overcoat-2.svg",
          "alt": "Obsidian Cashmere Overcoat — detail study showing surface and edge",
          "width": 1000,
          "height": 1250
        }
      ],
      "options": [
        {
          "name": "Size",
          "values": [
            "46",
            "48",
            "50",
            "52",
            "54"
          ]
        },
        {
          "name": "Colour",
          "values": [
            "Obsidian",
            "Camel"
          ]
        }
      ],
      "variants": [
        {
          "title": "Obsidian / 46",
          "sku": "BR-OUT-001-OBS-46",
          "options": {
            "Size": "46",
            "Colour": "Obsidian"
          },
          "stock": 0
        },
        {
          "title": "Obsidian / 48",
          "sku": "BR-OUT-001-OBS-48",
          "options": {
            "Size": "48",
            "Colour": "Obsidian"
          },
          "stock": 0
        },
        {
          "title": "Obsidian / 50",
          "sku": "BR-OUT-001-OBS-50",
          "options": {
            "Size": "50",
            "Colour": "Obsidian"
          },
          "stock": 15
        },
        {
          "title": "Obsidian / 52",
          "sku": "BR-OUT-001-OBS-52",
          "options": {
            "Size": "52",
            "Colour": "Obsidian"
          },
          "stock": 3
        },
        {
          "title": "Obsidian / 54",
          "sku": "BR-OUT-001-OBS-54",
          "options": {
            "Size": "54",
            "Colour": "Obsidian"
          },
          "stock": 16
        },
        {
          "title": "Camel / 46",
          "sku": "BR-OUT-001-CAM-46",
          "options": {
            "Size": "46",
            "Colour": "Camel"
          },
          "stock": 15
        },
        {
          "title": "Camel / 48",
          "sku": "BR-OUT-001-CAM-48",
          "options": {
            "Size": "48",
            "Colour": "Camel"
          },
          "stock": 2
        },
        {
          "title": "Camel / 50",
          "sku": "BR-OUT-001-CAM-50",
          "options": {
            "Size": "50",
            "Colour": "Camel"
          },
          "stock": 0
        },
        {
          "title": "Camel / 52",
          "sku": "BR-OUT-001-CAM-52",
          "options": {
            "Size": "52",
            "Colour": "Camel"
          },
          "stock": 8
        },
        {
          "title": "Camel / 54",
          "sku": "BR-OUT-001-CAM-54",
          "options": {
            "Size": "54",
            "Colour": "Camel"
          },
          "stock": 14
        }
      ],
      "reviews": [
        {
          "author": "Marcus D.",
          "location": "London",
          "rating": 5,
          "title": "Worth the wait",
          "body": "I put off buying a coat at this price for two years. Three winters in and the hand-finished edges have not moved. The unlined construction means it is genuinely warmer than the padded coat it replaced, and it packs better.",
          "verified": true,
          "createdAt": "2026-07-25T00:15:52.873342+00:00"
        },
        {
          "author": "Helena V.",
          "location": "Copenhagen",
          "rating": 5,
          "title": "The drape is the thing",
          "body": "It falls in one line from the shoulder in a way I have only seen on made-to-measure. I sized up one and the proportion is exactly right over a jacket.",
          "verified": true,
          "createdAt": "2026-06-09T00:15:52.873342+00:00"
        }
      ],
      "related": [
        "cirrus-cashmere-crew",
        "sable-cashmere-wrap"
      ]
    },
    {
      "slug": "nocturne-leather-jacket",
      "name": "Nocturne Leather Jacket",
      "subtitle": "Vegetable-tanned lambskin, cut close",
      "description": "A short jacket in vegetable-tanned lambskin, cut close through the body with a standing collar. The hide is aniline-finished, so it takes light unevenly and will darken where you fold it. It is meant to look better in five years than it does today.",
      "story": "Vegetable tanning takes forty days and a pit of oak bark. Chrome tanning takes six hours. We use the slow one because it leaves the hide alive — it keeps reacting to light, oil and wear long after it has left the workshop.",
      "sku": "BR-OUT-002",
      "price": 2400.0,
      "compare_at_price": null,
      "currency": "USD",
      "badge": "Members Only",
      "is_featured": true,
      "is_new": false,
      "is_limited": true,
      "is_members_only": true,
      "materials": "Vegetable-tanned lambskin, cupro lining",
      "care_instructions": "Wipe with a dry cloth. Condition annually. Never machine wash.",
      "origin": "Tanned in Tuscany. Made in Italy.",
      "specifications": {
        "Fit": "Close, hip length",
        "Lining": "Bemberg cupro",
        "Closure": "Two-way YKK Excella",
        "Pockets": "Two side, one chest, two interior",
        "Hardware": "Antiqued brass"
      },
      "shipping_info": "Complimentary insured delivery worldwide. Dispatched within 48 hours.",
      "returns_info": "Thirty days, unworn, with tags. Return shipping is on us.",
      "tags": [
        "leather",
        "jacket",
        "members",
        "italy"
      ],
      "rating_average": 5.0,
      "rating_count": 1,
      "units_sold": 41,
      "position": 2,
      "seo_title": "Nocturne Leather Jacket — BRUNO",
      "seo_description": "Vegetable-tanned lambskin jacket, aniline-finished and made in Italy. Reserved for members.",
      "category_slug": "outerwear",
      "category_name": "Outerwear",
      "images": [
        {
          "url": "/images/products/nocturne-leather-jacket-1.svg",
          "alt": "Nocturne Leather Jacket — material study in obsidian and champagne",
          "width": 1000,
          "height": 1250
        },
        {
          "url": "/images/products/nocturne-leather-jacket-2.svg",
          "alt": "Nocturne Leather Jacket — detail study showing surface and edge",
          "width": 1000,
          "height": 1250
        }
      ],
      "options": [
        {
          "name": "Size",
          "values": [
            "46",
            "48",
            "50",
            "52"
          ]
        },
        {
          "name": "Colour",
          "values": [
            "Black"
          ]
        }
      ],
      "variants": [
        {
          "title": "Black / 46",
          "sku": "BR-OUT-002-BLA-46",
          "options": {
            "Size": "46",
            "Colour": "Black"
          },
          "stock": 1
        },
        {
          "title": "Black / 48",
          "sku": "BR-OUT-002-BLA-48",
          "options": {
            "Size": "48",
            "Colour": "Black"
          },
          "stock": 3
        },
        {
          "title": "Black / 50",
          "sku": "BR-OUT-002-BLA-50",
          "options": {
            "Size": "50",
            "Colour": "Black"
          },
          "stock": 14
        },
        {
          "title": "Black / 52",
          "sku": "BR-OUT-002-BLA-52",
          "options": {
            "Size": "52",
            "Colour": "Black"
          },
          "stock": 14
        }
      ],
      "reviews": [
        {
          "author": "Sofia M.",
          "location": "Milan",
          "rating": 5,
          "title": "It is already changing",
          "body": "Six months in and it has darkened at the elbows and the fold of the collar exactly as described. It looks like mine now, not like a product.",
          "verified": true,
          "createdAt": "2026-08-09T00:15:52.873342+00:00"
        }
      ],
      "related": [
        "solstice-suede-weekender"
      ]
    },
    {
      "slug": "monolith-wool-topcoat",
      "name": "Monolith Wool Topcoat",
      "subtitle": "Melton wool, half-canvassed, storm collar",
      "description": "A heavy melton topcoat with a half-canvas chest and a collar that stands when you need it to. The cloth is milled to 820 g/m² and pressed until it sheds rain. It is a coat for standing outside in.",
      "story": "Melton is wool that has been felted until the weave disappears. The finisher raises the nap, shears it, and presses it — three times. What is left is a cloth so dense that water beads on it and the raw edge does not fray.",
      "sku": "BR-OUT-003",
      "price": 1650.0,
      "compare_at_price": 1950.0,
      "currency": "USD",
      "badge": "Archive",
      "is_featured": true,
      "is_new": false,
      "is_limited": false,
      "is_members_only": false,
      "materials": "90% virgin wool, 10% cashmere melton",
      "care_instructions": "Dry clean sparingly. Brush with a stiff brush after wear.",
      "origin": "Woven in Yorkshire. Made in Portugal.",
      "specifications": {
        "Fit": "Relaxed, knee length",
        "Weight": "820 g/m²",
        "Closure": "Six-button double-breasted",
        "Pockets": "Two flap, two interior",
        "Construction": "Half-canvas"
      },
      "shipping_info": "Complimentary insured delivery worldwide. Dispatched within 48 hours.",
      "returns_info": "Thirty days, unworn, with tags. Return shipping is on us.",
      "tags": [
        "wool",
        "coat",
        "winter",
        "sale"
      ],
      "rating_average": 4.5,
      "rating_count": 2,
      "units_sold": 156,
      "position": 3,
      "seo_title": "Monolith Wool Topcoat — BRUNO",
      "seo_description": "A half-canvassed melton wool topcoat at 820 g/m², milled in Yorkshire. Now in the archive.",
      "category_slug": "outerwear",
      "category_name": "Outerwear",
      "images": [
        {
          "url": "/images/products/monolith-wool-topcoat-1.svg",
          "alt": "Monolith Wool Topcoat — material study in obsidian and champagne",
          "width": 1000,
          "height": 1250
        },
        {
          "url": "/images/products/monolith-wool-topcoat-2.svg",
          "alt": "Monolith Wool Topcoat — detail study showing surface and edge",
          "width": 1000,
          "height": 1250
        }
      ],
      "options": [
        {
          "name": "Size",
          "values": [
            "46",
            "48",
            "50",
            "52",
            "54"
          ]
        },
        {
          "name": "Colour",
          "values": [
            "Charcoal",
            "Navy"
          ]
        }
      ],
      "variants": [
        {
          "title": "Charcoal / 46",
          "sku": "BR-OUT-003-CHA-46",
          "options": {
            "Size": "46",
            "Colour": "Charcoal"
          },
          "stock": 7
        },
        {
          "title": "Charcoal / 48",
          "sku": "BR-OUT-003-CHA-48",
          "options": {
            "Size": "48",
            "Colour": "Charcoal"
          },
          "stock": 8
        },
        {
          "title": "Charcoal / 50",
          "sku": "BR-OUT-003-CHA-50",
          "options": {
            "Size": "50",
            "Colour": "Charcoal"
          },
          "stock": 8
        },
        {
          "title": "Charcoal / 52",
          "sku": "BR-OUT-003-CHA-52",
          "options": {
            "Size": "52",
            "Colour": "Charcoal"
          },
          "stock": 16
        },
        {
          "title": "Charcoal / 54",
          "sku": "BR-OUT-003-CHA-54",
          "options": {
            "Size": "54",
            "Colour": "Charcoal"
          },
          "stock": 13
        },
        {
          "title": "Navy / 46",
          "sku": "BR-OUT-003-NAV-46",
          "options": {
            "Size": "46",
            "Colour": "Navy"
          },
          "stock": 3
        },
        {
          "title": "Navy / 48",
          "sku": "BR-OUT-003-NAV-48",
          "options": {
            "Size": "48",
            "Colour": "Navy"
          },
          "stock": 3
        },
        {
          "title": "Navy / 50",
          "sku": "BR-OUT-003-NAV-50",
          "options": {
            "Size": "50",
            "Colour": "Navy"
          },
          "stock": 16
        },
        {
          "title": "Navy / 52",
          "sku": "BR-OUT-003-NAV-52",
          "options": {
            "Size": "52",
            "Colour": "Navy"
          },
          "stock": 9
        },
        {
          "title": "Navy / 54",
          "sku": "BR-OUT-003-NAV-54",
          "options": {
            "Size": "54",
            "Colour": "Navy"
          },
          "stock": 7
        }
      ],
      "reviews": [
        {
          "author": "Ewan B.",
          "location": "Edinburgh",
          "rating": 5,
          "title": "Actually sheds rain",
          "body": "I was sceptical about the melton claim. It rained for forty minutes on me in November and the water sat on the surface. Genuinely windproof too.",
          "verified": true,
          "createdAt": "2026-06-24T00:15:52.873342+00:00"
        },
        {
          "author": "Renata C.",
          "location": "Toronto",
          "rating": 4,
          "title": "Heavy, in the good way",
          "body": "820 grams is not a marketing number, you feel it on the shoulders. It is a coat for standing at a bus stop in January, not for a warm office.",
          "verified": true,
          "createdAt": "2026-05-27T00:15:52.873342+00:00"
        }
      ],
      "related": null
    },
    {
      "slug": "atelier-wool-blazer",
      "name": "Atelier Wool Blazer",
      "subtitle": "Half-canvas, soft shoulder, patch pockets",
      "description": "An unstructured blazer with a soft Neapolitan shoulder and a half-canvas chest. There is no padding, so the jacket takes the shape of whoever is wearing it rather than imposing one.",
      "story": "A soft shoulder is harder to make than a padded one. There is nothing inside to correct a bad cut, so the pattern has to be right the first time. Our cutter spent nine years in Naples learning to make a jacket that does not fight the body.",
      "sku": "BR-TAI-001",
      "price": 1250.0,
      "compare_at_price": null,
      "currency": "USD",
      "badge": "New",
      "is_featured": true,
      "is_new": true,
      "is_limited": false,
      "is_members_only": false,
      "materials": "Super 130s virgin wool",
      "care_instructions": "Dry clean only. Rest 24 hours between wears.",
      "origin": "Woven in Huddersfield. Made in Italy.",
      "specifications": {
        "Fit": "Soft, two-button",
        "Vents": "Double side",
        "Pockets": "Three patch",
        "Shoulder": "Unpadded Neapolitan",
        "Construction": "Half-canvas"
      },
      "shipping_info": "Complimentary insured delivery worldwide. Dispatched within 48 hours.",
      "returns_info": "Thirty days, unworn, with tags. Return shipping is on us.",
      "tags": [
        "tailoring",
        "blazer",
        "wool",
        "new"
      ],
      "rating_average": 5.0,
      "rating_count": 1,
      "units_sold": 62,
      "position": 4,
      "seo_title": "Atelier Wool Blazer — BRUNO",
      "seo_description": "Half-canvassed Super 130s blazer with an unpadded Neapolitan shoulder, made in Italy.",
      "category_slug": "tailoring",
      "category_name": "Tailoring",
      "images": [
        {
          "url": "/images/products/atelier-wool-blazer-1.svg",
          "alt": "Atelier Wool Blazer — material study in obsidian and champagne",
          "width": 1000,
          "height": 1250
        },
        {
          "url": "/images/products/atelier-wool-blazer-2.svg",
          "alt": "Atelier Wool Blazer — detail study showing surface and edge",
          "width": 1000,
          "height": 1250
        }
      ],
      "options": [
        {
          "name": "Size",
          "values": [
            "46",
            "48",
            "50",
            "52",
            "54"
          ]
        },
        {
          "name": "Colour",
          "values": [
            "Ink",
            "Stone"
          ]
        }
      ],
      "variants": [
        {
          "title": "Ink / 46",
          "sku": "BR-TAI-001-INK-46",
          "options": {
            "Size": "46",
            "Colour": "Ink"
          },
          "stock": 15
        },
        {
          "title": "Ink / 48",
          "sku": "BR-TAI-001-INK-48",
          "options": {
            "Size": "48",
            "Colour": "Ink"
          },
          "stock": 14
        },
        {
          "title": "Ink / 50",
          "sku": "BR-TAI-001-INK-50",
          "options": {
            "Size": "50",
            "Colour": "Ink"
          },
          "stock": 6
        },
        {
          "title": "Ink / 52",
          "sku": "BR-TAI-001-INK-52",
          "options": {
            "Size": "52",
            "Colour": "Ink"
          },
          "stock": 16
        },
        {
          "title": "Ink / 54",
          "sku": "BR-TAI-001-INK-54",
          "options": {
            "Size": "54",
            "Colour": "Ink"
          },
          "stock": 9
        },
        {
          "title": "Stone / 46",
          "sku": "BR-TAI-001-STO-46",
          "options": {
            "Size": "46",
            "Colour": "Stone"
          },
          "stock": 14
        },
        {
          "title": "Stone / 48",
          "sku": "BR-TAI-001-STO-48",
          "options": {
            "Size": "48",
            "Colour": "Stone"
          },
          "stock": 7
        },
        {
          "title": "Stone / 50",
          "sku": "BR-TAI-001-STO-50",
          "options": {
            "Size": "50",
            "Colour": "Stone"
          },
          "stock": 8
        },
        {
          "title": "Stone / 52",
          "sku": "BR-TAI-001-STO-52",
          "options": {
            "Size": "52",
            "Colour": "Stone"
          },
          "stock": 2
        },
        {
          "title": "Stone / 54",
          "sku": "BR-TAI-001-STO-54",
          "options": {
            "Size": "54",
            "Colour": "Stone"
          },
          "stock": 2
        }
      ],
      "reviews": [
        {
          "author": "Christopher N.",
          "location": "Boston",
          "rating": 5,
          "title": "The shoulder is the whole point",
          "body": "No padding at all, and yet it holds. This is the first off-the-rack jacket that has not made me look like I borrowed it.",
          "verified": true,
          "createdAt": "2026-08-24T00:15:52.873342+00:00"
        }
      ],
      "related": [
        "meridian-tailored-trouser",
        "alabaster-poplin-shirt",
        "onyx-calfskin-belt"
      ]
    },
    {
      "slug": "meridian-tailored-trouser",
      "name": "Meridian Tailored Trouser",
      "subtitle": "High rise, single pleat, unfinished hem",
      "description": "A high-rise trouser with a single forward pleat and a wide, tapering leg. Shipped with an unfinished hem so your tailor can set the break where you want it.",
      "story": "A pleat is not decoration. It gives the fabric somewhere to go when you sit down, which is why a pleated trouser stays clean through a long day and a flat front does not.",
      "sku": "BR-TAI-002",
      "price": 540.0,
      "compare_at_price": null,
      "currency": "USD",
      "badge": "New",
      "is_featured": false,
      "is_new": true,
      "is_limited": false,
      "is_members_only": false,
      "materials": "Super 120s virgin wool tropical",
      "care_instructions": "Dry clean. Press with a cloth.",
      "origin": "Woven in Biella. Made in Portugal.",
      "specifications": {
        "Hem": "Unfinished",
        "Leg": "Wide, tapered",
        "Rise": "High",
        "Pleat": "Single forward",
        "Waistband": "Extended tab, side adjusters"
      },
      "shipping_info": "Complimentary insured delivery worldwide. Dispatched within 48 hours.",
      "returns_info": "Thirty days, unworn, with tags. Return shipping is on us.",
      "tags": [
        "tailoring",
        "trouser",
        "wool",
        "new"
      ],
      "rating_average": 4.0,
      "rating_count": 1,
      "units_sold": 97,
      "position": 5,
      "seo_title": "Meridian Tailored Trouser — BRUNO",
      "seo_description": "High-rise single-pleat trouser in Super 120s tropical wool, shipped unhemmed.",
      "category_slug": "tailoring",
      "category_name": "Tailoring",
      "images": [
        {
          "url": "/images/products/meridian-tailored-trouser-1.svg",
          "alt": "Meridian Tailored Trouser — material study in obsidian and champagne",
          "width": 1000,
          "height": 1250
        },
        {
          "url": "/images/products/meridian-tailored-trouser-2.svg",
          "alt": "Meridian Tailored Trouser — detail study showing surface and edge",
          "width": 1000,
          "height": 1250
        }
      ],
      "options": [
        {
          "name": "Size",
          "values": [
            "30",
            "32",
            "34",
            "36",
            "38"
          ]
        },
        {
          "name": "Colour",
          "values": [
            "Charcoal",
            "Sand"
          ]
        }
      ],
      "variants": [
        {
          "title": "Charcoal / 30",
          "sku": "BR-TAI-002-CHA-30",
          "options": {
            "Size": "30",
            "Colour": "Charcoal"
          },
          "stock": 1
        },
        {
          "title": "Charcoal / 32",
          "sku": "BR-TAI-002-CHA-32",
          "options": {
            "Size": "32",
            "Colour": "Charcoal"
          },
          "stock": 0
        },
        {
          "title": "Charcoal / 34",
          "sku": "BR-TAI-002-CHA-34",
          "options": {
            "Size": "34",
            "Colour": "Charcoal"
          },
          "stock": 5
        },
        {
          "title": "Charcoal / 36",
          "sku": "BR-TAI-002-CHA-36",
          "options": {
            "Size": "36",
            "Colour": "Charcoal"
          },
          "stock": 0
        },
        {
          "title": "Charcoal / 38",
          "sku": "BR-TAI-002-CHA-38",
          "options": {
            "Size": "38",
            "Colour": "Charcoal"
          },
          "stock": 9
        },
        {
          "title": "Sand / 30",
          "sku": "BR-TAI-002-SAN-30",
          "options": {
            "Size": "30",
            "Colour": "Sand"
          },
          "stock": 2
        },
        {
          "title": "Sand / 32",
          "sku": "BR-TAI-002-SAN-32",
          "options": {
            "Size": "32",
            "Colour": "Sand"
          },
          "stock": 10
        },
        {
          "title": "Sand / 34",
          "sku": "BR-TAI-002-SAN-34",
          "options": {
            "Size": "34",
            "Colour": "Sand"
          },
          "stock": 12
        },
        {
          "title": "Sand / 36",
          "sku": "BR-TAI-002-SAN-36",
          "options": {
            "Size": "36",
            "Colour": "Sand"
          },
          "stock": 14
        },
        {
          "title": "Sand / 38",
          "sku": "BR-TAI-002-SAN-38",
          "options": {
            "Size": "38",
            "Colour": "Sand"
          },
          "stock": 9
        }
      ],
      "reviews": [
        {
          "author": "Felix A.",
          "location": "Berlin",
          "rating": 4,
          "title": "Unhemmed is the right call",
          "body": "Shipped unfinished so my tailor set the break. The single pleat means they still look clean after eight hours at a desk.",
          "verified": true,
          "createdAt": "2026-08-20T00:15:52.873342+00:00"
        }
      ],
      "related": null
    },
    {
      "slug": "cirrus-cashmere-crew",
      "name": "Cirrus Cashmere Crew",
      "subtitle": "Grade-A Mongolian cashmere, 12-gauge",
      "description": "A crew-neck in 12-gauge grade-A cashmere — fine enough to wear under a jacket, dense enough to wear alone. The neck, cuffs and hem are linked by hand so there is no ridge.",
      "story": "Grade-A cashmere means fibres longer than 34 millimetres and finer than 15.5 microns. Longer fibres pill less. It costs roughly three times what grade-C costs, and it is the entire difference between a sweater you keep and one you replace.",
      "sku": "BR-KNI-001",
      "price": 680.0,
      "compare_at_price": null,
      "currency": "USD",
      "badge": "Best Seller",
      "is_featured": true,
      "is_new": false,
      "is_limited": false,
      "is_members_only": false,
      "materials": "100% grade-A Mongolian cashmere",
      "care_instructions": "Hand wash cold, dry flat. Do not hang.",
      "origin": "Knitted in Scotland.",
      "specifications": {
        "Fit": "Regular",
        "Ply": "Two",
        "Neck": "Crew, hand-linked",
        "Gauge": "12",
        "Weight": "340 g"
      },
      "shipping_info": "Complimentary insured delivery worldwide. Dispatched within 48 hours.",
      "returns_info": "Thirty days, unworn, with tags. Return shipping is on us.",
      "tags": [
        "cashmere",
        "knitwear",
        "scotland",
        "bestseller"
      ],
      "rating_average": 4.67,
      "rating_count": 3,
      "units_sold": 312,
      "position": 6,
      "seo_title": "Cirrus Cashmere Crew — BRUNO",
      "seo_description": "12-gauge grade-A Mongolian cashmere crew-neck, hand-linked and knitted in Scotland.",
      "category_slug": "knitwear",
      "category_name": "Knitwear",
      "images": [
        {
          "url": "/images/products/cirrus-cashmere-crew-1.svg",
          "alt": "Cirrus Cashmere Crew — material study in obsidian and champagne",
          "width": 1000,
          "height": 1250
        },
        {
          "url": "/images/products/cirrus-cashmere-crew-2.svg",
          "alt": "Cirrus Cashmere Crew — detail study showing surface and edge",
          "width": 1000,
          "height": 1250
        }
      ],
      "options": [
        {
          "name": "Size",
          "values": [
            "S",
            "M",
            "L",
            "XL"
          ]
        },
        {
          "name": "Colour",
          "values": [
            "Bone",
            "Obsidian",
            "Camel"
          ]
        }
      ],
      "variants": [
        {
          "title": "Bone / S",
          "sku": "BR-KNI-001-BON-S",
          "options": {
            "Size": "S",
            "Colour": "Bone"
          },
          "stock": 9
        },
        {
          "title": "Bone / M",
          "sku": "BR-KNI-001-BON-M",
          "options": {
            "Size": "M",
            "Colour": "Bone"
          },
          "stock": 14
        },
        {
          "title": "Bone / L",
          "sku": "BR-KNI-001-BON-L",
          "options": {
            "Size": "L",
            "Colour": "Bone"
          },
          "stock": 11
        },
        {
          "title": "Bone / XL",
          "sku": "BR-KNI-001-BON-XL",
          "options": {
            "Size": "XL",
            "Colour": "Bone"
          },
          "stock": 14
        },
        {
          "title": "Obsidian / S",
          "sku": "BR-KNI-001-OBS-S",
          "options": {
            "Size": "S",
            "Colour": "Obsidian"
          },
          "stock": 14
        },
        {
          "title": "Obsidian / M",
          "sku": "BR-KNI-001-OBS-M",
          "options": {
            "Size": "M",
            "Colour": "Obsidian"
          },
          "stock": 4
        },
        {
          "title": "Obsidian / L",
          "sku": "BR-KNI-001-OBS-L",
          "options": {
            "Size": "L",
            "Colour": "Obsidian"
          },
          "stock": 10
        },
        {
          "title": "Obsidian / XL",
          "sku": "BR-KNI-001-OBS-XL",
          "options": {
            "Size": "XL",
            "Colour": "Obsidian"
          },
          "stock": 2
        },
        {
          "title": "Camel / S",
          "sku": "BR-KNI-001-CAM-S",
          "options": {
            "Size": "S",
            "Colour": "Camel"
          },
          "stock": 12
        },
        {
          "title": "Camel / M",
          "sku": "BR-KNI-001-CAM-M",
          "options": {
            "Size": "M",
            "Colour": "Camel"
          },
          "stock": 6
        },
        {
          "title": "Camel / L",
          "sku": "BR-KNI-001-CAM-L",
          "options": {
            "Size": "L",
            "Colour": "Camel"
          },
          "stock": 13
        },
        {
          "title": "Camel / XL",
          "sku": "BR-KNI-001-CAM-XL",
          "options": {
            "Size": "XL",
            "Colour": "Camel"
          },
          "stock": 10
        }
      ],
      "reviews": [
        {
          "author": "James O.",
          "location": "New York",
          "rating": 5,
          "title": "No pilling after a year",
          "body": "I own four cashmere crews from other houses and all of them pilled under the arms within a season. This one has not. The grade-A claim is doing real work.",
          "verified": true,
          "createdAt": "2026-08-05T00:15:52.873342+00:00"
        },
        {
          "author": "Priya S.",
          "location": "Singapore",
          "rating": 4,
          "title": "Perfect weight, runs slightly large",
          "body": "Twelve gauge is exactly right for a warm climate — I wear it under a blazer in air conditioning year round. I would size down.",
          "verified": true,
          "createdAt": "2026-07-03T00:15:52.873342+00:00"
        },
        {
          "author": "Tomas R.",
          "location": "Zurich",
          "rating": 5,
          "title": "Hand-linked neck is noticeable",
          "body": "You can feel the absence of a seam ridge at the collar immediately. Small thing, but it is why this sits flat under a shirt.",
          "verified": true,
          "createdAt": "2026-05-08T00:15:52.873342+00:00"
        }
      ],
      "related": [
        "meridian-tailored-trouser"
      ]
    },
    {
      "slug": "ember-merino-rollneck",
      "name": "Ember Merino Rollneck",
      "subtitle": "Extrafine merino, 7-gauge, full roll",
      "description": "A heavier rollneck in 7-gauge extrafine merino with a deep, genuine roll rather than a folded mock. It holds its shape at the neck because the collar is knitted in one piece.",
      "story": "Most rollnecks are a tube sewn to a body. Ours is knitted whole, which takes four times as long on the machine and is the only way the collar still stands after fifty wears.",
      "sku": "BR-KNI-002",
      "price": 590.0,
      "compare_at_price": null,
      "currency": "USD",
      "badge": null,
      "is_featured": false,
      "is_new": false,
      "is_limited": false,
      "is_members_only": false,
      "materials": "100% extrafine merino wool, 17.5 micron",
      "care_instructions": "Hand wash cold, dry flat.",
      "origin": "Knitted in Scotland.",
      "specifications": {
        "Fit": "Regular",
        "Neck": "Full roll, knitted whole",
        "Gauge": "7",
        "Micron": "17.5",
        "Weight": "520 g"
      },
      "shipping_info": "Complimentary insured delivery worldwide. Dispatched within 48 hours.",
      "returns_info": "Thirty days, unworn, with tags. Return shipping is on us.",
      "tags": [
        "merino",
        "knitwear",
        "rollneck",
        "winter"
      ],
      "rating_average": 5.0,
      "rating_count": 1,
      "units_sold": 178,
      "position": 7,
      "seo_title": "Ember Merino Rollneck — BRUNO",
      "seo_description": "Seven-gauge extrafine merino rollneck with a whole-knitted collar, made in Scotland.",
      "category_slug": "knitwear",
      "category_name": "Knitwear",
      "images": [
        {
          "url": "/images/products/ember-merino-rollneck-1.svg",
          "alt": "Ember Merino Rollneck — material study in obsidian and champagne",
          "width": 1000,
          "height": 1250
        },
        {
          "url": "/images/products/ember-merino-rollneck-2.svg",
          "alt": "Ember Merino Rollneck — detail study showing surface and edge",
          "width": 1000,
          "height": 1250
        }
      ],
      "options": [
        {
          "name": "Size",
          "values": [
            "S",
            "M",
            "L",
            "XL"
          ]
        },
        {
          "name": "Colour",
          "values": [
            "Ember",
            "Obsidian"
          ]
        }
      ],
      "variants": [
        {
          "title": "Ember / S",
          "sku": "BR-KNI-002-EMB-S",
          "options": {
            "Size": "S",
            "Colour": "Ember"
          },
          "stock": 13
        },
        {
          "title": "Ember / M",
          "sku": "BR-KNI-002-EMB-M",
          "options": {
            "Size": "M",
            "Colour": "Ember"
          },
          "stock": 0
        },
        {
          "title": "Ember / L",
          "sku": "BR-KNI-002-EMB-L",
          "options": {
            "Size": "L",
            "Colour": "Ember"
          },
          "stock": 14
        },
        {
          "title": "Ember / XL",
          "sku": "BR-KNI-002-EMB-XL",
          "options": {
            "Size": "XL",
            "Colour": "Ember"
          },
          "stock": 5
        },
        {
          "title": "Obsidian / S",
          "sku": "BR-KNI-002-OBS-S",
          "options": {
            "Size": "S",
            "Colour": "Obsidian"
          },
          "stock": 0
        },
        {
          "title": "Obsidian / M",
          "sku": "BR-KNI-002-OBS-M",
          "options": {
            "Size": "M",
            "Colour": "Obsidian"
          },
          "stock": 9
        },
        {
          "title": "Obsidian / L",
          "sku": "BR-KNI-002-OBS-L",
          "options": {
            "Size": "L",
            "Colour": "Obsidian"
          },
          "stock": 6
        },
        {
          "title": "Obsidian / XL",
          "sku": "BR-KNI-002-OBS-XL",
          "options": {
            "Size": "XL",
            "Colour": "Obsidian"
          },
          "stock": 0
        }
      ],
      "reviews": [
        {
          "author": "Isabelle G.",
          "location": "Montreal",
          "rating": 5,
          "title": "The collar does not collapse",
          "body": "I have thrown out three rollnecks whose necks went limp by February. This one is knitted whole and it still stands.",
          "verified": true,
          "createdAt": "2026-08-14T00:15:52.873342+00:00"
        }
      ],
      "related": null
    },
    {
      "slug": "vellum-silk-shirt",
      "name": "Vellum Silk Shirt",
      "subtitle": "19-momme sand-washed silk",
      "description": "A shirt in 19-momme sand-washed silk — heavy enough to hang properly, washed until the sheen is gone. Mother-of-pearl buttons, French seams throughout.",
      "story": "Momme measures the weight of silk. Most silk shirts are 12 to 16. At 19 the cloth stops clinging and starts to drape, which is the entire point of wearing silk in the first place.",
      "sku": "BR-SHI-001",
      "price": 420.0,
      "compare_at_price": null,
      "currency": "USD",
      "badge": "Best Seller",
      "is_featured": true,
      "is_new": false,
      "is_limited": false,
      "is_members_only": false,
      "materials": "100% mulberry silk, 19 momme",
      "care_instructions": "Hand wash cold or specialist clean. Cool iron on reverse.",
      "origin": "Made in Italy.",
      "specifications": {
        "Cuff": "Single, rounded",
        "Seams": "French",
        "Collar": "Soft point, unfused",
        "Weight": "19 momme",
        "Buttons": "Mother-of-pearl"
      },
      "shipping_info": "Complimentary insured delivery worldwide. Dispatched within 48 hours.",
      "returns_info": "Thirty days, unworn, with tags. Return shipping is on us.",
      "tags": [
        "silk",
        "shirt",
        "italy",
        "bestseller"
      ],
      "rating_average": 5.0,
      "rating_count": 2,
      "units_sold": 264,
      "position": 8,
      "seo_title": "Vellum Silk Shirt — BRUNO",
      "seo_description": "19-momme sand-washed mulberry silk shirt with mother-of-pearl buttons, made in Italy.",
      "category_slug": "shirting",
      "category_name": "Shirting",
      "images": [
        {
          "url": "/images/products/vellum-silk-shirt-1.svg",
          "alt": "Vellum Silk Shirt — material study in obsidian and champagne",
          "width": 1000,
          "height": 1250
        },
        {
          "url": "/images/products/vellum-silk-shirt-2.svg",
          "alt": "Vellum Silk Shirt — detail study showing surface and edge",
          "width": 1000,
          "height": 1250
        }
      ],
      "options": [
        {
          "name": "Size",
          "values": [
            "S",
            "M",
            "L",
            "XL"
          ]
        },
        {
          "name": "Colour",
          "values": [
            "Vellum",
            "Ink"
          ]
        }
      ],
      "variants": [
        {
          "title": "Vellum / S",
          "sku": "BR-SHI-001-VEL-S",
          "options": {
            "Size": "S",
            "Colour": "Vellum"
          },
          "stock": 16
        },
        {
          "title": "Vellum / M",
          "sku": "BR-SHI-001-VEL-M",
          "options": {
            "Size": "M",
            "Colour": "Vellum"
          },
          "stock": 10
        },
        {
          "title": "Vellum / L",
          "sku": "BR-SHI-001-VEL-L",
          "options": {
            "Size": "L",
            "Colour": "Vellum"
          },
          "stock": 8
        },
        {
          "title": "Vellum / XL",
          "sku": "BR-SHI-001-VEL-XL",
          "options": {
            "Size": "XL",
            "Colour": "Vellum"
          },
          "stock": 8
        },
        {
          "title": "Ink / S",
          "sku": "BR-SHI-001-INK-S",
          "options": {
            "Size": "S",
            "Colour": "Ink"
          },
          "stock": 13
        },
        {
          "title": "Ink / M",
          "sku": "BR-SHI-001-INK-M",
          "options": {
            "Size": "M",
            "Colour": "Ink"
          },
          "stock": 10
        },
        {
          "title": "Ink / L",
          "sku": "BR-SHI-001-INK-L",
          "options": {
            "Size": "L",
            "Colour": "Ink"
          },
          "stock": 7
        },
        {
          "title": "Ink / XL",
          "sku": "BR-SHI-001-INK-XL",
          "options": {
            "Size": "XL",
            "Colour": "Ink"
          },
          "stock": 0
        }
      ],
      "reviews": [
        {
          "author": "Adrienne L.",
          "location": "Paris",
          "rating": 5,
          "title": "Nineteen momme changes everything",
          "body": "Every other silk shirt I own clings. This one hangs. The sand-wash finish means it reads matte rather than shiny, which is the difference between evening and every day.",
          "verified": true,
          "createdAt": "2026-08-17T00:15:52.873342+00:00"
        },
        {
          "author": "Daniel K.",
          "location": "Melbourne",
          "rating": 5,
          "title": "Second one ordered",
          "body": "Bought the vellum, immediately ordered the ink. French seams throughout, which you notice when you roll the sleeves.",
          "verified": true,
          "createdAt": "2026-07-12T00:15:52.873342+00:00"
        }
      ],
      "related": [
        "halo-silk-scarf"
      ]
    },
    {
      "slug": "alabaster-poplin-shirt",
      "name": "Alabaster Poplin Shirt",
      "subtitle": "Two-fold 140s cotton, unfused collar",
      "description": "The white shirt, made properly. Two-fold 140s poplin, an unfused collar that softens with washing, and a split yoke cut on the bias so the shoulders move.",
      "story": "A fused collar is glued. It looks sharp for a year and then bubbles. An unfused collar is three layers of cloth stitched together — it starts softer, and it is still there in a decade.",
      "sku": "BR-SHI-002",
      "price": 340.0,
      "compare_at_price": null,
      "currency": "USD",
      "badge": null,
      "is_featured": false,
      "is_new": false,
      "is_limited": false,
      "is_members_only": false,
      "materials": "100% two-fold 140s Egyptian cotton poplin",
      "care_instructions": "Machine wash 30°. Iron damp.",
      "origin": "Woven in Italy. Made in Portugal.",
      "specifications": {
        "Yarn": "Two-fold 140s",
        "Yoke": "Split, bias-cut",
        "Collar": "Unfused semi-spread",
        "Buttons": "Mother-of-pearl",
        "Stitching": "18 per inch"
      },
      "shipping_info": "Complimentary insured delivery worldwide. Dispatched within 48 hours.",
      "returns_info": "Thirty days, unworn, with tags. Return shipping is on us.",
      "tags": [
        "cotton",
        "shirt",
        "essential"
      ],
      "rating_average": 4.5,
      "rating_count": 2,
      "units_sold": 401,
      "position": 9,
      "seo_title": "Alabaster Poplin Shirt — BRUNO",
      "seo_description": "Two-fold 140s Egyptian cotton poplin shirt with an unfused collar and split yoke.",
      "category_slug": "shirting",
      "category_name": "Shirting",
      "images": [
        {
          "url": "/images/products/alabaster-poplin-shirt-1.svg",
          "alt": "Alabaster Poplin Shirt — material study in obsidian and champagne",
          "width": 1000,
          "height": 1250
        },
        {
          "url": "/images/products/alabaster-poplin-shirt-2.svg",
          "alt": "Alabaster Poplin Shirt — detail study showing surface and edge",
          "width": 1000,
          "height": 1250
        }
      ],
      "options": [
        {
          "name": "Size",
          "values": [
            "S",
            "M",
            "L",
            "XL"
          ]
        },
        {
          "name": "Colour",
          "values": [
            "White"
          ]
        }
      ],
      "variants": [
        {
          "title": "White / S",
          "sku": "BR-SHI-002-WHI-S",
          "options": {
            "Size": "S",
            "Colour": "White"
          },
          "stock": 15
        },
        {
          "title": "White / M",
          "sku": "BR-SHI-002-WHI-M",
          "options": {
            "Size": "M",
            "Colour": "White"
          },
          "stock": 8
        },
        {
          "title": "White / L",
          "sku": "BR-SHI-002-WHI-L",
          "options": {
            "Size": "L",
            "Colour": "White"
          },
          "stock": 15
        },
        {
          "title": "White / XL",
          "sku": "BR-SHI-002-WHI-XL",
          "options": {
            "Size": "XL",
            "Colour": "White"
          },
          "stock": 12
        }
      ],
      "reviews": [
        {
          "author": "Nadia F.",
          "location": "Beirut",
          "rating": 4,
          "title": "Excellent, iron it damp",
          "body": "Exactly as described. The 140s poplin does crease — iron it damp as they say and it presses beautifully.",
          "verified": true,
          "createdAt": "2026-07-19T00:15:52.873342+00:00"
        },
        {
          "author": "Yuki T.",
          "location": "Tokyo",
          "rating": 5,
          "title": "The collar still stands",
          "body": "Two years, weekly wear, machine washed every time. The unfused collar has softened but has never bubbled. I have bought three more.",
          "verified": true,
          "createdAt": "2026-06-01T00:15:52.873342+00:00"
        }
      ],
      "related": null
    },
    {
      "slug": "ivory-linen-overshirt",
      "name": "Ivory Linen Overshirt",
      "subtitle": "Heavyweight washed linen, patch pockets",
      "description": "A linen overshirt heavy enough to wear as a jacket. Garment-washed so it arrives already soft, with two large patch pockets and a straight hem.",
      "story": "Linen is stiff until it is not. We wash every piece for ninety minutes with volcanic stone before it ships, so the first wear feels like the fiftieth.",
      "sku": "BR-SHI-003",
      "price": 460.0,
      "compare_at_price": null,
      "currency": "USD",
      "badge": "New",
      "is_featured": false,
      "is_new": true,
      "is_limited": false,
      "is_members_only": false,
      "materials": "100% European flax linen, 260 g/m²",
      "care_instructions": "Machine wash 30°. Line dry. Embrace the creases.",
      "origin": "Woven in Belgium. Made in Portugal.",
      "specifications": {
        "Fit": "Relaxed overshirt",
        "Hem": "Straight",
        "Finish": "Stone-washed",
        "Weight": "260 g/m²",
        "Pockets": "Two patch"
      },
      "shipping_info": "Complimentary insured delivery worldwide. Dispatched within 48 hours.",
      "returns_info": "Thirty days, unworn, with tags. Return shipping is on us.",
      "tags": [
        "linen",
        "overshirt",
        "summer",
        "new"
      ],
      "rating_average": 4.0,
      "rating_count": 1,
      "units_sold": 88,
      "position": 10,
      "seo_title": "Ivory Linen Overshirt — BRUNO",
      "seo_description": "Heavyweight stone-washed Belgian flax overshirt, cut to wear as a light jacket.",
      "category_slug": "shirting",
      "category_name": "Shirting",
      "images": [
        {
          "url": "/images/products/ivory-linen-overshirt-1.svg",
          "alt": "Ivory Linen Overshirt — material study in obsidian and champagne",
          "width": 1000,
          "height": 1250
        },
        {
          "url": "/images/products/ivory-linen-overshirt-2.svg",
          "alt": "Ivory Linen Overshirt — detail study showing surface and edge",
          "width": 1000,
          "height": 1250
        }
      ],
      "options": [
        {
          "name": "Size",
          "values": [
            "S",
            "M",
            "L",
            "XL"
          ]
        },
        {
          "name": "Colour",
          "values": [
            "Ivory",
            "Olive"
          ]
        }
      ],
      "variants": [
        {
          "title": "Ivory / S",
          "sku": "BR-SHI-003-IVO-S",
          "options": {
            "Size": "S",
            "Colour": "Ivory"
          },
          "stock": 13
        },
        {
          "title": "Ivory / M",
          "sku": "BR-SHI-003-IVO-M",
          "options": {
            "Size": "M",
            "Colour": "Ivory"
          },
          "stock": 13
        },
        {
          "title": "Ivory / L",
          "sku": "BR-SHI-003-IVO-L",
          "options": {
            "Size": "L",
            "Colour": "Ivory"
          },
          "stock": 0
        },
        {
          "title": "Ivory / XL",
          "sku": "BR-SHI-003-IVO-XL",
          "options": {
            "Size": "XL",
            "Colour": "Ivory"
          },
          "stock": 0
        },
        {
          "title": "Olive / S",
          "sku": "BR-SHI-003-OLI-S",
          "options": {
            "Size": "S",
            "Colour": "Olive"
          },
          "stock": 7
        },
        {
          "title": "Olive / M",
          "sku": "BR-SHI-003-OLI-M",
          "options": {
            "Size": "M",
            "Colour": "Olive"
          },
          "stock": 1
        },
        {
          "title": "Olive / L",
          "sku": "BR-SHI-003-OLI-L",
          "options": {
            "Size": "L",
            "Colour": "Olive"
          },
          "stock": 13
        },
        {
          "title": "Olive / XL",
          "sku": "BR-SHI-003-OLI-XL",
          "options": {
            "Size": "XL",
            "Colour": "Olive"
          },
          "stock": 8
        }
      ],
      "reviews": [
        {
          "author": "Sam K.",
          "location": "Sydney",
          "rating": 4,
          "title": "Soft from the first wear",
          "body": "The stone-wash means none of that cardboard stiffness new linen usually has. Wore it straight out of the box.",
          "verified": true,
          "createdAt": "2026-08-27T00:15:52.873342+00:00"
        }
      ],
      "related": null
    },
    {
      "slug": "solstice-suede-weekender",
      "name": "Solstice Suede Weekender",
      "subtitle": "Calf suede, brass hardware, 42 litres",
      "description": "A weekend bag in thick calf suede with solid brass hardware and a cotton-drill lining. Forty-two litres — three days, comfortably, or five if you pack like someone who has done this before.",
      "story": "The hardware is solid brass, not plated. Plating chips and then the piece looks cheap forever. Solid brass just goes dark, which is what you want.",
      "sku": "BR-LEA-001",
      "price": 1680.0,
      "compare_at_price": null,
      "currency": "USD",
      "badge": "Limited",
      "is_featured": true,
      "is_new": false,
      "is_limited": true,
      "is_members_only": false,
      "materials": "Calf suede, solid brass hardware, cotton drill lining",
      "care_instructions": "Brush with a suede brush. Protect before first use.",
      "origin": "Made in Florence, Italy.",
      "specifications": {
        "Strap": "Detachable, adjustable",
        "Lining": "Cotton drill",
        "Capacity": "42 litres",
        "Hardware": "Solid brass",
        "Dimensions": "55 × 30 × 26 cm"
      },
      "shipping_info": "Complimentary insured delivery worldwide. Dispatched within 48 hours.",
      "returns_info": "Thirty days, unworn, with tags. Return shipping is on us.",
      "tags": [
        "leather",
        "suede",
        "bag",
        "florence",
        "limited"
      ],
      "rating_average": 5.0,
      "rating_count": 1,
      "units_sold": 53,
      "position": 11,
      "seo_title": "Solstice Suede Weekender — BRUNO",
      "seo_description": "A 42-litre calf suede weekend bag with solid brass hardware, made in Florence.",
      "category_slug": "leather",
      "category_name": "Leather",
      "images": [
        {
          "url": "/images/products/solstice-suede-weekender-1.svg",
          "alt": "Solstice Suede Weekender — material study in obsidian and champagne",
          "width": 1000,
          "height": 1250
        },
        {
          "url": "/images/products/solstice-suede-weekender-2.svg",
          "alt": "Solstice Suede Weekender — detail study showing surface and edge",
          "width": 1000,
          "height": 1250
        }
      ],
      "options": [
        {
          "name": "Colour",
          "values": [
            "Tobacco"
          ]
        }
      ],
      "variants": [
        {
          "title": "Tobacco",
          "sku": "BR-LEA-001-TOB",
          "options": {
            "Colour": "Tobacco"
          },
          "stock": 9
        }
      ],
      "reviews": [
        {
          "author": "Oliver H.",
          "location": "Amsterdam",
          "rating": 5,
          "title": "Brass has gone dark, as promised",
          "body": "A year of monthly flights. The suede has scuffed in a way that looks deliberate and the brass has taken on a proper patina. Forty-two litres is genuinely three days.",
          "verified": true,
          "createdAt": "2026-07-29T00:15:52.873342+00:00"
        }
      ],
      "related": null
    },
    {
      "slug": "onyx-calfskin-belt",
      "name": "Onyx Calfskin Belt",
      "subtitle": "Single-piece calfskin, brushed brass",
      "description": "A belt cut from a single piece of vegetable-tanned calfskin — no bonding, no splitting. The buckle is solid brushed brass on a hand-set pin.",
      "story": "Most belts are two thin strips glued back to back. Cut one from a single hide and it costs more, weighs more, and never delaminates.",
      "sku": "BR-LEA-002",
      "price": 320.0,
      "compare_at_price": null,
      "currency": "USD",
      "badge": null,
      "is_featured": false,
      "is_new": false,
      "is_limited": false,
      "is_members_only": false,
      "materials": "Vegetable-tanned calfskin, solid brass buckle",
      "care_instructions": "Wipe with a dry cloth. Condition twice yearly.",
      "origin": "Made in Italy.",
      "specifications": {
        "Edge": "Hand-burnished",
        "Width": "3.5 cm",
        "Buckle": "Solid brushed brass",
        "Thickness": "4 mm",
        "Construction": "Single-piece"
      },
      "shipping_info": "Complimentary insured delivery worldwide. Dispatched within 48 hours.",
      "returns_info": "Thirty days, unworn, with tags. Return shipping is on us.",
      "tags": [
        "leather",
        "belt",
        "accessories"
      ],
      "rating_average": 5.0,
      "rating_count": 1,
      "units_sold": 233,
      "position": 12,
      "seo_title": "Onyx Calfskin Belt — BRUNO",
      "seo_description": "Single-piece vegetable-tanned calfskin belt with a solid brushed-brass buckle.",
      "category_slug": "leather",
      "category_name": "Leather",
      "images": [
        {
          "url": "/images/products/onyx-calfskin-belt-1.svg",
          "alt": "Onyx Calfskin Belt — material study in obsidian and champagne",
          "width": 1000,
          "height": 1250
        },
        {
          "url": "/images/products/onyx-calfskin-belt-2.svg",
          "alt": "Onyx Calfskin Belt — detail study showing surface and edge",
          "width": 1000,
          "height": 1250
        }
      ],
      "options": [
        {
          "name": "Size",
          "values": [
            "85",
            "90",
            "95",
            "100"
          ]
        },
        {
          "name": "Colour",
          "values": [
            "Onyx",
            "Chestnut"
          ]
        }
      ],
      "variants": [
        {
          "title": "Onyx / 85",
          "sku": "BR-LEA-002-ONY-85",
          "options": {
            "Size": "85",
            "Colour": "Onyx"
          },
          "stock": 4
        },
        {
          "title": "Onyx / 90",
          "sku": "BR-LEA-002-ONY-90",
          "options": {
            "Size": "90",
            "Colour": "Onyx"
          },
          "stock": 9
        },
        {
          "title": "Onyx / 95",
          "sku": "BR-LEA-002-ONY-95",
          "options": {
            "Size": "95",
            "Colour": "Onyx"
          },
          "stock": 9
        },
        {
          "title": "Onyx / 100",
          "sku": "BR-LEA-002-ONY-100",
          "options": {
            "Size": "100",
            "Colour": "Onyx"
          },
          "stock": 8
        },
        {
          "title": "Chestnut / 85",
          "sku": "BR-LEA-002-CHE-85",
          "options": {
            "Size": "85",
            "Colour": "Chestnut"
          },
          "stock": 12
        },
        {
          "title": "Chestnut / 90",
          "sku": "BR-LEA-002-CHE-90",
          "options": {
            "Size": "90",
            "Colour": "Chestnut"
          },
          "stock": 5
        },
        {
          "title": "Chestnut / 95",
          "sku": "BR-LEA-002-CHE-95",
          "options": {
            "Size": "95",
            "Colour": "Chestnut"
          },
          "stock": 0
        },
        {
          "title": "Chestnut / 100",
          "sku": "BR-LEA-002-CHE-100",
          "options": {
            "Size": "100",
            "Colour": "Chestnut"
          },
          "stock": 4
        }
      ],
      "reviews": [
        {
          "author": "Grace P.",
          "location": "Chicago",
          "rating": 5,
          "title": "Single-piece is worth it",
          "body": "My last belt delaminated in eighteen months. This one is cut from one hide and there is nothing to come apart.",
          "verified": true,
          "createdAt": "2026-06-16T00:15:52.873342+00:00"
        }
      ],
      "related": null
    },
    {
      "slug": "halo-silk-scarf",
      "name": "Halo Silk Scarf",
      "subtitle": "Hand-rolled twill, 90 × 90 cm",
      "description": "A ninety-centimetre silk twill square with hand-rolled edges. The pattern is a study in refracted light, printed in eleven screens.",
      "story": "Hand-rolling an edge means a seamstress turns the hem twice with a needle, by eye, all the way around. It takes forty minutes per scarf and it is the only reason the edge sits plump instead of flat.",
      "sku": "BR-ACC-001",
      "price": 280.0,
      "compare_at_price": null,
      "currency": "USD",
      "badge": null,
      "is_featured": false,
      "is_new": false,
      "is_limited": false,
      "is_members_only": false,
      "materials": "100% silk twill, 14 momme",
      "care_instructions": "Specialist clean only.",
      "origin": "Printed and finished in Como, Italy.",
      "specifications": {
        "Edge": "Hand-rolled",
        "Size": "90 × 90 cm",
        "Finish": "Twill",
        "Weight": "14 momme",
        "Screens": "11"
      },
      "shipping_info": "Complimentary insured delivery worldwide. Dispatched within 48 hours.",
      "returns_info": "Thirty days, unworn, with tags. Return shipping is on us.",
      "tags": [
        "silk",
        "scarf",
        "accessories",
        "como"
      ],
      "rating_average": 5.0,
      "rating_count": 1,
      "units_sold": 147,
      "position": 13,
      "seo_title": "Halo Silk Scarf — BRUNO",
      "seo_description": "A 90cm hand-rolled silk twill scarf, printed in eleven screens in Como.",
      "category_slug": "accessories",
      "category_name": "Accessories",
      "images": [
        {
          "url": "/images/products/halo-silk-scarf-1.svg",
          "alt": "Halo Silk Scarf — material study in obsidian and champagne",
          "width": 1000,
          "height": 1250
        },
        {
          "url": "/images/products/halo-silk-scarf-2.svg",
          "alt": "Halo Silk Scarf — detail study showing surface and edge",
          "width": 1000,
          "height": 1250
        }
      ],
      "options": [
        {
          "name": "Colour",
          "values": [
            "Champagne",
            "Obsidian"
          ]
        }
      ],
      "variants": [
        {
          "title": "Champagne",
          "sku": "BR-ACC-001-CHA",
          "options": {
            "Colour": "Champagne"
          },
          "stock": 1
        },
        {
          "title": "Obsidian",
          "sku": "BR-ACC-001-OBS",
          "options": {
            "Colour": "Obsidian"
          },
          "stock": 3
        }
      ],
      "reviews": [
        {
          "author": "Marguerite D.",
          "location": "Lyon",
          "rating": 5,
          "title": "The rolled edge is beautiful",
          "body": "You can see the forty minutes in the hem. It sits plump around the neck rather than lying flat like a printed square.",
          "verified": true,
          "createdAt": "2026-08-02T00:15:52.873342+00:00"
        }
      ],
      "related": null
    },
    {
      "slug": "sable-cashmere-wrap",
      "name": "Sable Cashmere Wrap",
      "subtitle": "Double-ply cashmere, 200 × 70 cm",
      "description": "A generous double-ply cashmere wrap with a fringed edge. Two metres long, so it works as a scarf, a shawl, or the only reason a long flight is survivable.",
      "story": "We tried it at 180 centimetres and it was not enough. At 200 it wraps twice with the ends still hanging where they should.",
      "sku": "BR-ACC-002",
      "price": 390.0,
      "compare_at_price": 490.0,
      "currency": "USD",
      "badge": "Archive",
      "is_featured": true,
      "is_new": false,
      "is_limited": false,
      "is_members_only": false,
      "materials": "100% grade-A cashmere, two-ply",
      "care_instructions": "Hand wash cold, dry flat.",
      "origin": "Woven in Scotland.",
      "specifications": {
        "Ply": "Two",
        "Edge": "Hand-knotted fringe",
        "Size": "200 × 70 cm",
        "Grade": "A",
        "Weight": "280 g"
      },
      "shipping_info": "Complimentary insured delivery worldwide. Dispatched within 48 hours.",
      "returns_info": "Thirty days, unworn, with tags. Return shipping is on us.",
      "tags": [
        "cashmere",
        "scarf",
        "accessories",
        "sale"
      ],
      "rating_average": 5.0,
      "rating_count": 1,
      "units_sold": 195,
      "position": 14,
      "seo_title": "Sable Cashmere Wrap — BRUNO",
      "seo_description": "A 200cm two-ply grade-A cashmere wrap with a hand-knotted fringe, woven in Scotland.",
      "category_slug": "accessories",
      "category_name": "Accessories",
      "images": [
        {
          "url": "/images/products/sable-cashmere-wrap-1.svg",
          "alt": "Sable Cashmere Wrap — material study in obsidian and champagne",
          "width": 1000,
          "height": 1250
        },
        {
          "url": "/images/products/sable-cashmere-wrap-2.svg",
          "alt": "Sable Cashmere Wrap — detail study showing surface and edge",
          "width": 1000,
          "height": 1250
        }
      ],
      "options": [
        {
          "name": "Colour",
          "values": [
            "Sable",
            "Bone"
          ]
        }
      ],
      "variants": [
        {
          "title": "Sable",
          "sku": "BR-ACC-002-SAB",
          "options": {
            "Colour": "Sable"
          },
          "stock": 12
        },
        {
          "title": "Bone",
          "sku": "BR-ACC-002-BON",
          "options": {
            "Colour": "Bone"
          },
          "stock": 11
        }
      ],
      "reviews": [
        {
          "author": "Clara W.",
          "location": "Lisbon",
          "rating": 5,
          "title": "Two hundred centimetres is correct",
          "body": "I have a 180 from elsewhere and it is always four inches short of wrapping properly. This one does. It lives in my carry-on.",
          "verified": true,
          "createdAt": "2026-07-08T00:15:52.873342+00:00"
        }
      ],
      "related": null
    }
  ],
  "categories": [
    {
      "slug": "outerwear",
      "name": "Outerwear",
      "description": "Coats and jackets cut for weight, drape and a long life.",
      "image_url": "/images/editorial/category-outerwear.svg",
      "image_alt": "Layered obsidian and champagne composition representing outerwear",
      "is_featured": true,
      "position": 1,
      "seo_title": "Luxury Outerwear — BRUNO",
      "seo_description": "Cashmere overcoats, wool topcoats and leather jackets, cut in limited runs and finished by hand."
    },
    {
      "slug": "tailoring",
      "name": "Tailoring",
      "description": "Soft-shouldered construction with a deliberately quiet line.",
      "image_url": "/images/editorial/category-tailoring.svg",
      "image_alt": "Vertical light study representing tailoring",
      "is_featured": true,
      "position": 2,
      "seo_title": "Tailoring — BRUNO",
      "seo_description": "Blazers and trousers with half-canvas construction, cut for movement rather than formality."
    },
    {
      "slug": "knitwear",
      "name": "Knitwear",
      "description": "Grade-A cashmere and extrafine merino, knitted in small batches.",
      "image_url": "/images/editorial/category-knitwear.svg",
      "image_alt": "Soft woven gradient representing knitwear",
      "is_featured": true,
      "position": 3,
      "seo_title": "Cashmere & Merino Knitwear — BRUNO",
      "seo_description": "Rollnecks and crews in grade-A cashmere and extrafine merino, knitted in small batches."
    },
    {
      "slug": "shirting",
      "name": "Shirting",
      "description": "Silk, poplin and linen, in a cut that reads well untucked.",
      "image_url": "/images/editorial/category-shirting.svg",
      "image_alt": "Fine vertical weave representing shirting",
      "is_featured": false,
      "position": 4,
      "seo_title": "Shirting — BRUNO",
      "seo_description": "Silk, two-fold poplin and washed linen shirts with mother-of-pearl fastenings."
    },
    {
      "slug": "leather",
      "name": "Leather",
      "description": "Vegetable-tanned hides that record where you have been.",
      "image_url": "/images/editorial/category-leather.svg",
      "image_alt": "Deep grained surface representing leather",
      "is_featured": false,
      "position": 5,
      "seo_title": "Leather Goods — BRUNO",
      "seo_description": "Vegetable-tanned leather bags, belts and jackets, finished in a Florentine workshop."
    },
    {
      "slug": "accessories",
      "name": "Accessories",
      "description": "The last five per cent, which is most of the effect.",
      "image_url": "/images/editorial/category-accessories.svg",
      "image_alt": "Fine linear composition representing accessories",
      "is_featured": true,
      "position": 6,
      "seo_title": "Accessories — BRUNO",
      "seo_description": "Silk scarves, calfskin belts and cashmere wraps to finish a considered wardrobe."
    }
  ],
  "testimonials": [
    {
      "author_name": "Helena Vestergaard",
      "author_title": "Architect",
      "author_location": "Copenhagen",
      "quote": "I have bought one BRUNO piece a year for four years. Not one of them has been replaced, which is the only review that matters.",
      "rating": 5,
      "position": 1,
      "is_featured": true
    },
    {
      "author_name": "Marcus Delacroix",
      "author_title": "Gallerist",
      "author_location": "London",
      "quote": "The overcoat is the single best thing in my wardrobe and I have owned some expensive mistakes. The difference is that this one is still improving.",
      "rating": 5,
      "position": 2,
      "is_featured": true
    },
    {
      "author_name": "Yuki Tanaka",
      "author_title": "Creative Director",
      "author_location": "Tokyo",
      "quote": "They publish the micron count. Nobody publishes the micron count. It tells you everything about how they think.",
      "rating": 5,
      "position": 3,
      "is_featured": true
    },
    {
      "author_name": "Sofia Marchetti",
      "author_title": "Photographer",
      "author_location": "Milan",
      "quote": "I live in a city full of leather and I still get asked about this jacket. It has aged into something none of the new ones look like.",
      "rating": 5,
      "position": 4,
      "is_featured": false
    },
    {
      "author_name": "Oliver Hendricks",
      "author_title": "Founder",
      "author_location": "Amsterdam",
      "quote": "Forty flights a year with the weekender. The brass has gone dark and the suede has scars. It looks better than the day it arrived.",
      "rating": 5,
      "position": 5,
      "is_featured": false
    }
  ],
  "faqs": [
    {
      "question": "How limited is \"limited\"?",
      "answer": "Nothing we make exceeds four hundred pieces, and most limited releases run to sixty. When a size sells out we do not re-cut it — the run is the run. Members see every release forty-eight hours before it opens publicly.",
      "category": "Ordering",
      "position": 1
    },
    {
      "question": "Why is there no lining in the overcoat?",
      "answer": "The cloth is double-faced: two lengths of cashmere bonded together. A lining would add weight and remove the drape that makes the coat worth making. Every edge is closed by hand instead.",
      "category": "Products",
      "position": 2
    },
    {
      "question": "What does membership cost?",
      "answer": "Nothing. Atelier membership is free and begins the first time you buy. Circle opens at five thousand in lifetime spend, Maison at twenty-five thousand and by invitation. There is no subscription and there never will be.",
      "category": "Membership",
      "position": 3
    },
    {
      "question": "Do you really repair anything, forever?",
      "answer": "Yes, on anything we have ever sold, for as long as we exist. We re-finish edges, re-link collars, re-dye leather, replace hardware and re-knit cuffs. You pay return shipping; we pay for the work.",
      "category": "Care",
      "position": 4
    },
    {
      "question": "How long does delivery take?",
      "answer": "Orders are dispatched within 48 hours. Two to three working days within Europe and North America, three to five elsewhere. Shipping is insured and complimentary on every order, with no minimum.",
      "category": "Shipping",
      "position": 5
    },
    {
      "question": "Can I return something?",
      "answer": "Thirty days, unworn, with tags attached. We pay return shipping. Made-to-measure and monogrammed pieces are the only exceptions, and we will say so clearly before you order.",
      "category": "Returns",
      "position": 6
    },
    {
      "question": "How should I choose a size?",
      "answer": "Every product page carries the measurements of the actual garment, not a body chart. If you are between sizes, our client care team will tell you which way to go — they have handled the pieces.",
      "category": "Sizing",
      "position": 7
    },
    {
      "question": "Where are your clothes made?",
      "answer": "Cloth from Biella, Huddersfield and Como. Garments from workshops in Porto, Florence and Naples. Knitwear from Hawick. We name every partner and we visit each of them twice a year.",
      "category": "Products",
      "position": 8
    }
  ],
  "brandValues": [
    {
      "title": "Made in small numbers",
      "description": "Nothing we make exceeds four hundred pieces. Most run to sixty.",
      "icon": "Gem",
      "detail": "Scarcity is not a marketing device here — it is a consequence of insisting on workshops that finish by hand.",
      "position": 1
    },
    {
      "title": "Materials you can name",
      "description": "Every fibre is traceable to a mill we have visited.",
      "icon": "Layers",
      "detail": "Grade-A Mongolian cashmere. Two-fold 140s Egyptian cotton. Vegetable-tanned Tuscan calf. We publish the mill, the weight and the micron.",
      "position": 2
    },
    {
      "title": "Finished by hand",
      "description": "The last eleven hours of a coat are a person, not a machine.",
      "icon": "Scissors",
      "detail": "Hand-closed edges, hand-linked collars, hand-rolled hems. These are the operations that decide whether a garment survives a decade.",
      "position": 3
    },
    {
      "title": "Repaired, not replaced",
      "description": "Lifetime repairs on everything we have ever sold.",
      "icon": "RefreshCw",
      "detail": "Send it back. We re-finish edges, re-link collars, re-dye leather and replace hardware. A BRUNO piece should outlast the reason you bought it.",
      "position": 4
    }
  ],
  "stories": [
    {
      "key": "atelier",
      "eyebrow": "The Atelier",
      "title": "Eleven hours, one coat",
      "body": "Our overcoats are made in a workshop of nineteen people outside Porto. The cloth arrives from Biella as a double-faced length — two cashmeres bonded together. Before a single seam is sewn, a finisher separates those layers by hand at every edge, so that the seam can be closed inside the cloth and disappear.\n\nIt is slow, it cannot be mechanised, and it is the reason the coat has no lining, no facing, and no weight it does not need.",
      "quote": "You cannot rush an edge. The cloth decides how fast you go.",
      "image_url": "/images/editorial/atelier.svg",
      "image_alt": "Layered light composition evoking a workshop interior",
      "stat_value": "11",
      "stat_label": "hours of hand-finishing per coat",
      "cta_label": "Read the full process",
      "cta_href": "/journal/eleven-hours",
      "position": 1
    },
    {
      "key": "materials",
      "eyebrow": "The Materials",
      "title": "We will tell you the micron",
      "body": "Most houses say \"the finest cashmere\". We say 15.5 microns, 34-millimetre staple, grade-A, from a co-operative in Mongolia we buy from directly. We say 19 momme for the silk and 820 grams per square metre for the melton.\n\nThese are the numbers that decide whether something pills, sags, or lasts. Publishing them is the simplest way to be held to them.",
      "quote": "A specification you can check is worth more than an adjective you cannot.",
      "image_url": "/images/editorial/materials.svg",
      "image_alt": "Fine gradient study evoking layered natural fibres",
      "stat_value": "15.5",
      "stat_label": "micron grade-A cashmere",
      "cta_label": "See our material standards",
      "cta_href": "/materials",
      "position": 2
    },
    {
      "key": "provenance",
      "eyebrow": "The Provenance",
      "title": "Four mills, three workshops",
      "body": "Biella for cashmere. Huddersfield for worsted. Como for silk. Hawick for knitwear. Three workshops — Porto, Florence, Naples — that between them employ under two hundred people.\n\nWe have been to all of them. We go back twice a year. When something is wrong, we know whose hands it passed through, and so do they.",
      "quote": "A short supply chain is not an ethical position. It is just the only way to keep a standard.",
      "image_url": "/images/editorial/provenance.svg",
      "image_alt": "Cartographic light composition evoking European provenance",
      "stat_value": "7",
      "stat_label": "partners, all visited twice a year",
      "cta_label": "Meet the makers",
      "cta_href": "/provenance",
      "position": 3
    }
  ],
  "banners": [
    {
      "placement": "ANNOUNCEMENT_BAR",
      "eyebrow": null,
      "title": "Complimentary insured delivery worldwide",
      "subtitle": null,
      "body": null,
      "cta_label": "The Winter Edit",
      "cta_href": "/collections/winter-edit",
      "secondary_cta_label": null,
      "secondary_cta_href": null,
      "image_url": null,
      "image_alt": null
    },
    {
      "placement": "HOME_HERO",
      "eyebrow": "Autumn / Winter — Sixty pieces",
      "title": "Clothes that outlast the reason you bought them",
      "subtitle": "Grade-A cashmere, vegetable-tanned leather and half-canvas tailoring, made in numbers small enough to finish by hand.",
      "body": null,
      "cta_label": "Explore the collection",
      "cta_href": "/collection",
      "secondary_cta_label": "The atelier",
      "secondary_cta_href": "/journal/eleven-hours",
      "image_url": "/images/editorial/hero.svg",
      "image_alt": "Liquid glass composition in obsidian and champagne"
    },
    {
      "placement": "HOME_PROMO",
      "eyebrow": "The Members' Reserve",
      "title": "Some pieces never reach the public floor",
      "subtitle": "Members see every release forty-eight hours early, and a small number of pieces are never released beyond the Circle at all.",
      "body": null,
      "cta_label": "Request an invitation",
      "cta_href": "/membership",
      "secondary_cta_label": null,
      "secondary_cta_href": null,
      "image_url": "/images/editorial/membership.svg",
      "image_alt": "Refracted champagne light through dark glass"
    }
  ],
  "navigation": [
    {
      "menu": "footer-care",
      "label": "Shipping",
      "href": "/shipping",
      "position": 1
    },
    {
      "menu": "footer-care",
      "label": "Returns",
      "href": "/returns",
      "position": 2
    },
    {
      "menu": "footer-care",
      "label": "Repairs",
      "href": "/repairs",
      "position": 3
    },
    {
      "menu": "footer-care",
      "label": "Size guide",
      "href": "/sizing",
      "position": 4
    },
    {
      "menu": "footer-care",
      "label": "Contact",
      "href": "/contact",
      "position": 5
    },
    {
      "menu": "footer-house",
      "label": "The House",
      "href": "/house",
      "position": 1
    },
    {
      "menu": "footer-house",
      "label": "Materials",
      "href": "/materials",
      "position": 2
    },
    {
      "menu": "footer-house",
      "label": "Provenance",
      "href": "/provenance",
      "position": 3
    },
    {
      "menu": "footer-house",
      "label": "The Journal",
      "href": "/journal",
      "position": 4
    },
    {
      "menu": "footer-house",
      "label": "Membership",
      "href": "/membership",
      "position": 5
    },
    {
      "menu": "footer-legal",
      "label": "Privacy",
      "href": "/privacy",
      "position": 1
    },
    {
      "menu": "footer-legal",
      "label": "Terms",
      "href": "/terms",
      "position": 2
    },
    {
      "menu": "footer-legal",
      "label": "Accessibility",
      "href": "/accessibility",
      "position": 3
    },
    {
      "menu": "footer-shop",
      "label": "All pieces",
      "href": "/collection",
      "position": 1
    },
    {
      "menu": "footer-shop",
      "label": "Outerwear",
      "href": "/category/outerwear",
      "position": 2
    },
    {
      "menu": "footer-shop",
      "label": "Tailoring",
      "href": "/category/tailoring",
      "position": 3
    },
    {
      "menu": "footer-shop",
      "label": "Knitwear",
      "href": "/category/knitwear",
      "position": 4
    },
    {
      "menu": "footer-shop",
      "label": "Shirting",
      "href": "/category/shirting",
      "position": 5
    },
    {
      "menu": "footer-shop",
      "label": "Leather",
      "href": "/category/leather",
      "position": 6
    },
    {
      "menu": "footer-shop",
      "label": "Accessories",
      "href": "/category/accessories",
      "position": 7
    },
    {
      "menu": "header",
      "label": "Collection",
      "href": "/collection",
      "position": 1
    },
    {
      "menu": "header",
      "label": "Outerwear",
      "href": "/category/outerwear",
      "position": 2
    },
    {
      "menu": "header",
      "label": "Tailoring",
      "href": "/category/tailoring",
      "position": 3
    },
    {
      "menu": "header",
      "label": "Knitwear",
      "href": "/category/knitwear",
      "position": 4
    },
    {
      "menu": "header",
      "label": "The House",
      "href": "/house",
      "position": 5
    },
    {
      "menu": "header",
      "label": "Membership",
      "href": "/membership",
      "position": 6
    }
  ],
  "membershipTiers": [
    {
      "name": "Atelier",
      "slug": "atelier",
      "tagline": "The invitation",
      "description": "Where the relationship begins. Early sight of every release and a direct line to the people who make the clothes.",
      "benefits": [
        "48-hour early access to every release",
        "Complimentary insured shipping, always",
        "Invitations to atelier previews",
        "A direct line to our head of client care"
      ],
      "min_spend": 0.0,
      "discount_percent": 0.0,
      "early_access_hours": 48,
      "position": 1
    },
    {
      "name": "Circle",
      "slug": "circle",
      "tagline": "The relationship",
      "description": "For clients who have made BRUNO part of how they dress. Adds private allocation and lifetime repairs.",
      "benefits": [
        "Everything in Atelier",
        "Private allocation on limited runs",
        "Ten per cent on every order",
        "Lifetime repairs and re-finishing",
        "Two personal styling sessions each year"
      ],
      "min_spend": 5000.0,
      "discount_percent": 10.0,
      "early_access_hours": 96,
      "position": 2
    },
    {
      "name": "Maison",
      "slug": "maison",
      "tagline": "The house",
      "description": "By invitation only. Made-to-measure, first refusal on archive pieces, and a permanent record of your measurements.",
      "benefits": [
        "Everything in Circle",
        "Made-to-measure at no surcharge",
        "First refusal on archive and one-of-one pieces",
        "Fifteen per cent on every order",
        "Your measurements held permanently",
        "An annual private appointment in Florence"
      ],
      "min_spend": 25000.0,
      "discount_percent": 15.0,
      "early_access_hours": 168,
      "position": 3
    }
  ],
  "collections": [
    {
      "slug": "winter-edit",
      "name": "The Winter Edit",
      "description": "Eight pieces for the cold months, chosen for weight and drape.",
      "position": 1,
      "product_slugs": [
        "obsidian-cashmere-overcoat",
        "monolith-wool-topcoat",
        "cirrus-cashmere-crew",
        "ember-merino-rollneck",
        "sable-cashmere-wrap"
      ]
    },
    {
      "slug": "members-reserve",
      "name": "Members' Reserve",
      "description": "Released first, and sometimes only, to members of the House.",
      "position": 2,
      "product_slugs": [
        "obsidian-cashmere-overcoat",
        "nocturne-leather-jacket",
        "solstice-suede-weekender"
      ]
    },
    {
      "slug": "foundation",
      "name": "The Foundation",
      "description": "The six pieces we would keep if we could keep only six.",
      "position": 3,
      "product_slugs": [
        "monolith-wool-topcoat",
        "atelier-wool-blazer",
        "meridian-tailored-trouser",
        "cirrus-cashmere-crew",
        "alabaster-poplin-shirt",
        "onyx-calfskin-belt"
      ]
    }
  ],
  "journal": [
    {
      "slug": "six-pieces",
      "title": "The six pieces",
      "excerpt": "If you could keep only six things, these would be the six — and the order in which to buy them.",
      "content": "Most wardrobes fail because they are wide rather than deep. Here is the depth version.\n\n**One. A white shirt with an unfused collar.** It goes under everything and it is the item people notice when it is bad. Two-fold 140s poplin, split yoke, mother-of-pearl.\n\n**Two. A cashmere crew in a neutral.** Twelve gauge — fine enough to layer, warm enough alone. Bone or obsidian, nothing else, not yet.\n\n**Three. A high-rise trouser in tropical wool.** Buy it unhemmed and have it finished. This single act does more for how clothes look on you than any other three hundred you could spend.\n\n**Four. A soft-shouldered blazer.** Half-canvas, unpadded, patch pockets. It should not look like it came from an office.\n\n**Five. A belt cut from one piece of hide.** Not two strips glued together. You will own it for fifteen years.\n\n**Six. A coat heavy enough to be the only one.** This is the expensive one, and it should be the last one you buy, because by the time you get here you will know what you actually wear.\n\nThat is the wardrobe. Everything after it is preference.",
      "featured_image_url": "/images/editorial/journal-wardrobe.svg",
      "featured_image_alt": "Composed grid of material tones",
      "author_name": "The Atelier",
      "tags": [
        "wardrobe",
        "essentials"
      ],
      "reading_minutes": 7,
      "published_at": "2026-08-24T00:15:52.873342+00:00",
      "seo_title": "The six pieces — BRUNO Journal",
      "seo_description": "If you could keep only six things, these would be the six — and the order in which to buy them."
    },
    {
      "slug": "eleven-hours",
      "title": "Eleven hours, one coat",
      "excerpt": "Why a double-faced cashmere overcoat cannot be finished by a machine, and what those eleven hours actually buy you.",
      "content": "There is a moment in making a double-faced coat where the machines stop.\n\nThe cloth arrives from Biella as two lengths of cashmere bonded into one. To close a seam invisibly, a finisher has to separate those two layers by hand along every edge — running a blade between them, opening a pocket of a few millimetres, and then stitching the seam inside the cloth so it disappears entirely.\n\nThere is no machine for this. There has never been a machine for this. It is nineteen people in a workshop outside Porto, a blade, and eleven hours.\n\n**What it buys you.** No lining, which is roughly four hundred grams you do not carry. No facing, which is the stiff panel that makes most coats break awkwardly at the lapel. And an edge that is cloth all the way through, so it will not fray, delaminate, or show a different colour when it wears.\n\n**What it costs.** Sixty coats a season. That is the whole run, and it is not a marketing decision — it is arithmetic. Nineteen people, eleven hours each, one season.",
      "featured_image_url": "/images/editorial/journal-atelier.svg",
      "featured_image_alt": "Light study of a workshop interior in obsidian and champagne",
      "author_name": "The Atelier",
      "tags": [
        "cashmere",
        "process",
        "outerwear"
      ],
      "reading_minutes": 8,
      "published_at": "2026-08-12T00:15:52.873342+00:00",
      "seo_title": "Eleven hours, one coat — BRUNO Journal",
      "seo_description": "Why a double-faced cashmere overcoat cannot be finished by a machine, and what those eleven hours actually buy you."
    },
    {
      "slug": "micron-count",
      "title": "What a micron count actually tells you",
      "excerpt": "Grade-A, 15.5 micron, 34-millimetre staple. Three numbers that decide whether a cashmere sweater survives its second winter.",
      "content": "\"The finest cashmere\" means nothing. Here are the three numbers that mean something.\n\n**Micron** is fibre diameter. Cashmere runs from about 14 to 19 microns. Finer is softer, and finer is more expensive, but finer alone is not the whole story.\n\n**Staple length** is how long each fibre is. This is the number nobody quotes, and it is the one that decides pilling. Short fibres work loose from the yarn under friction, ball up, and become the pills you shave off a jumper in its second month. Grade-A cashmere is longer than 34 millimetres. Grade-C can be half that.\n\n**Ply** is how many yarns are twisted together. Two-ply is the minimum for a garment you intend to keep. Single-ply is lighter and cheaper and will go through at the elbow.\n\nWe knit at 15.5 micron, 34-millimetre staple, two-ply. A jumper made this way costs about three times what a grade-C equivalent costs and lasts something like eight times as long, which is a bargain expressed inconveniently.",
      "featured_image_url": "/images/editorial/journal-materials.svg",
      "featured_image_alt": "Fine fibre gradient study",
      "author_name": "The Atelier",
      "tags": [
        "cashmere",
        "materials",
        "knitwear"
      ],
      "reading_minutes": 6,
      "published_at": "2026-07-16T00:15:52.873342+00:00",
      "seo_title": "What a micron count actually tells you — BRUNO Journal",
      "seo_description": "Grade-A, 15.5 micron, 34-millimetre staple. Three numbers that decide whether a cashmere sweater survives its second winter."
    },
    {
      "slug": "vegetable-tanning",
      "title": "Forty days in oak bark",
      "excerpt": "Chrome tanning takes six hours. Vegetable tanning takes forty days. The difference shows up in year three.",
      "content": "Ninety per cent of the world's leather is chrome-tanned. It takes about six hours, produces a hide of uniform colour that resists water and stains, and is, for most purposes, the correct choice.\n\nWe do not use it.\n\nVegetable tanning suspends the hide in pits of oak, chestnut and mimosa bark for forty days. The tannins bind to the collagen slowly and unevenly. What comes out is a hide that is still, in a meaningful sense, reactive: it darkens in sunlight, absorbs the oil from your hands, and holds a fold as a permanent crease.\n\nIn year one, chrome-tanned leather looks better. It is more even, more consistent, more like a product.\n\nIn year three, it looks exactly the same as it did, except for the places where the finish has cracked. The vegetable-tanned hide, by then, has gone several shades deeper at the elbows and the collar fold, and has stopped looking like a product at all.\n\nThat is the trade. We think it is an easy one.",
      "featured_image_url": "/images/editorial/journal-leather.svg",
      "featured_image_alt": "Deep grained surface study in warm tones",
      "author_name": "The Atelier",
      "tags": [
        "leather",
        "materials",
        "process"
      ],
      "reading_minutes": 5,
      "published_at": "2026-06-29T00:15:52.873342+00:00",
      "seo_title": "Forty days in oak bark — BRUNO Journal",
      "seo_description": "Chrome tanning takes six hours. Vegetable tanning takes forty days. The difference shows up in year three."
    }
  ],
  "settings": {
    "site.name": "BRUNO",
    "site.tagline": "Premium Apparel",
    "site.description": "Clothes made in small numbers and finished by hand. Grade-A cashmere, vegetable-tanned leather, half-canvas tailoring.",
    "site.url": "https://bruno.example.com",
    "site.currency": "USD",
    "site.email": "clientcare@bruno.example.com",
    "site.phone": "+1 (212) 555-0180",
    "site.address": "41 Rue Saint-Honoré, 75001 Paris",
    "site.hours": "Monday to Friday, 09:00–18:00 CET",
    "social.instagram": "https://instagram.com/bruno",
    "social.pinterest": "https://pinterest.com/bruno",
    "commerce.free_shipping_threshold": 0,
    "analytics.ga4_id": null,
    "analytics.meta_pixel": null
  },
  "pages": [
    {
      "slug": "house",
      "title": "The House",
      "subtitle": "Nineteen people outside Porto, and a rule about numbers",
      "content": "BRUNO makes a small number of things and finishes them by hand.\n\nThat sentence is the entire strategy. Everything else — the mills we buy from, the workshops we use, the decision to publish micron counts and garment weights, the lifetime repair programme — follows from it.\n\nWe began in 2019 with six pieces and one workshop. We now make around forty pieces a year across six categories, from four mills and three workshops, none of which employs more than a hundred people. We visit all of them twice a year.\n\nWe are not trying to become large. Large would require the operations we have specifically refused: fused collars, chrome tanning, bonded belts, lined coats. Each of those makes a garment cheaper and faster and worse in its third year, which is the year we care about.",
      "seo_title": "The House — BRUNO",
      "seo_description": "BRUNO makes a small number of things and finishes them by hand. Four mills, three workshops, forty pieces a year."
    },
    {
      "slug": "materials",
      "title": "Materials",
      "subtitle": "The numbers, published",
      "content": "We publish specifications because a specification can be checked and an adjective cannot.\n\n**Cashmere.** Grade-A Mongolian. 15.5 micron, 34mm staple, two-ply. Knitted in Hawick, Scotland.\n\n**Wool.** Super 120s and 130s worsted from Huddersfield; 90/10 wool-cashmere melton at 820 g/m² from Yorkshire; tropical wool from Biella.\n\n**Silk.** Mulberry silk at 19 momme for shirting, 14 momme twill for scarves. Woven, printed and finished in Como.\n\n**Cotton.** Two-fold 140s Egyptian poplin, woven in Italy.\n\n**Linen.** European flax at 260 g/m², woven in Belgium, stone-washed before shipping.\n\n**Leather.** Vegetable-tanned Tuscan calf and lambskin, forty days in oak, chestnut and mimosa bark. Aniline finish. Solid brass hardware, never plated.",
      "seo_title": "Materials — BRUNO",
      "seo_description": "Grade-A cashmere at 15.5 micron, 19-momme silk, 820gsm melton, vegetable-tanned Tuscan calf. Every specification, published."
    },
    {
      "slug": "returns",
      "title": "Returns & Repairs",
      "subtitle": "Thirty days to change your mind. Forever to fix it.",
      "content": "**Returns.** Thirty days from delivery, unworn, with tags attached. We pay return shipping. Refunds are issued to the original payment method within five working days of the piece arriving back with us.\n\nMade-to-measure and monogrammed pieces cannot be returned, and we will tell you so clearly before you order.\n\n**Repairs.** Lifetime, on anything we have ever sold. We re-finish edges, re-link collars, re-knit cuffs, re-dye leather and replace hardware. You pay return shipping; the work itself is free, permanently, regardless of how you came to own the piece.",
      "seo_title": "Returns & Repairs — BRUNO",
      "seo_description": "Thirty-day returns with shipping paid, and free lifetime repairs on everything we have ever made."
    },
    {
      "slug": "shipping",
      "title": "Shipping",
      "subtitle": "Insured, worldwide, complimentary",
      "content": "Every order ships insured and tracked at no cost, with no minimum.\n\nOrders are dispatched within 48 hours. Two to three working days in Europe and North America, three to five elsewhere. Signature is required on delivery.\n\nExpress delivery is 35, complimentary over 1,500. White-glove hand delivery by appointment is available in selected cities at 120.\n\nDuties and taxes are prepaid for the UK, EU, US, Canada, Australia, Japan and Singapore. Elsewhere they are collected on delivery.",
      "seo_title": "Shipping — BRUNO",
      "seo_description": "Complimentary insured worldwide delivery, dispatched within 48 hours."
    }
  ]
} as const;
