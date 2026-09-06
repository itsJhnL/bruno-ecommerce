/**
 * scripts/generate-images.ts
 *
 * Generates the BRUNO image set as SVG (Memory.md D-010).
 *
 * No image-generation model was available, and stock photography would not be
 * exclusive to the brand. So imagery here is ART DIRECTION, not imitation
 * photography: composed material studies in the manner of a luxury house's
 * swatch plates — an obsidian ground, a lit arch, a legible weave, champagne
 * light raking across it.
 *
 * Every asset is deterministic (seeded by slug), resolution-independent, a few
 * kilobytes, and locked to a fixed aspect ratio so nothing shifts on load.
 *
 * To replace with photography later: upload to Supabase Storage and update
 * `product_images.url`. No code change required.
 *
 *   npx tsx scripts/generate-images.ts
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import {
  buildGarment,
  STAGE_H,
  STAGE_W,
  type GarmentKind,
  type Panel,
} from "./garments";

import {
  between,
  CHAMPAGNE_200,
  CHAMPAGNE_300,
  CHAMPAGNE_500,
  CHAMPAGNE_700,
  COOL,
  BONE_50,
  BONE_100,
  BONE_200,
  grainOverlay,
  makeRandom,
  MATERIALS,
  OBSIDIAN_850,
  OBSIDIAN_900,
  OBSIDIAN_950,
  pick,
  R,
  weavePattern,
  type MaterialSpec,
  type Rng,
} from "./materials";
import { appIcon } from "./brand-marks";
import { ogCard } from "./og-card";

function monogram(x: number, y: number, size: number, opacity: number): string {
  return `<text x="${R(x)}" y="${R(y)}" font-family="Cormorant Garamond, Georgia, serif" font-size="${R(size)}"
    font-weight="300" fill="${CHAMPAGNE_300}" fill-opacity="${opacity}" text-anchor="middle"
    dominant-baseline="central" letter-spacing="0.04em">B</text>`;
}

/** The arch: a rounded-top vitrine. The single strongest luxury-editorial motif. */
function archPath(x: number, y: number, w: number, h: number): string {
  const r = w / 2;
  return `M ${R(x)} ${R(y + h)} L ${R(x)} ${R(y + r)} A ${R(r)} ${R(r)} 0 0 1 ${R(x + w)} ${R(y + r)} L ${R(x + w)} ${R(y + h)} Z`;
}

/* -------------------------------------------------------------------------- */
/* Product plate                                                               */
/*                                                                             */
/* A product photograph has two jobs: say what the thing is, and say what it   */
/* is made of. The first version of this file only did the second — every      */
/* product was the same lit arch of cloth, so a belt and an overcoat were the  */
/* same picture at thumbnail size. The silhouettes now come from               */
/* `garments.ts`; the material, the light and the ground stay here.            */
/* -------------------------------------------------------------------------- */

interface PlateOptions {
  slug: string;
  material: keyof typeof MATERIALS;
  kind: GarmentKind;
  variant: "material" | "detail";
  width?: number;
  height?: number;
}

function productPlate({
  slug,
  material,
  kind,
  variant,
  width = STAGE_W,
  height = STAGE_H,
}: PlateOptions): string {
  const rng = makeRandom(`${slug}-${variant}`);
  const m = MATERIALS[material] as MaterialSpec;
  const p = `${slug}-${variant}`;
  const detail = variant === "detail";
  const g = buildGarment(kind);

  /* Light comes from one side only. Two-sided lighting flattens cloth. */
  const fromLeft = rng() > 0.45;
  const lightX = fromLeft ? 0.24 : 0.76;

  /* The detail plate is the same garment, moved closer — not a different
     picture. Scaling the whole group takes the weave and the stitch gauge with
     it, which is what a macro lens actually does. */
  const [bx, by, bw] = g.detailBox;
  const zoom = detail ? STAGE_W / bw : 1;
  const transform = detail
    ? `transform="translate(${R(-bx * zoom)} ${R(-by * zoom)}) scale(${R(zoom)})"`
    : "";

  const toneColour = (tone: Panel["tone"]) =>
    tone === "shadow" ? "#000000" : tone === "highlight" ? m.highlight : m.body;

  const panels = g.panels
    .map(
      (panel) =>
        `<path d="${panel.d}" fill="${toneColour(panel.tone)}" fill-opacity="${
          panel.opacity ?? (panel.tone === "shadow" ? 0.4 : 0.16)
        }" fill-rule="evenodd"/>`
    )
    .join("");

  const seams = g.seams
    .map(
      (d) =>
        `<path d="${d}" fill="none" stroke="#000000" stroke-opacity="0.42" stroke-width="3.4" stroke-linecap="round"/>` +
        `<path d="${d}" fill="none" stroke="${m.highlight}" stroke-opacity="0.16" stroke-width="1.2"
               transform="translate(0 -2.2)" stroke-linecap="round"/>`
    )
    .join("");

  const stitches = g.stitches
    .map(
      (d) =>
        `<path d="${d}" fill="none" stroke="${CHAMPAGNE_300}" stroke-opacity="0.34" stroke-width="2.2"
               stroke-dasharray="7 9" stroke-linecap="round"/>`
    )
    .join("");

  /* Folds, laid inside the silhouette so the cloth has weight. Fewer and
     broader than before, because they now compete with real construction
     lines instead of carrying the picture on their own. */
  const foldCount = detail ? 3 : Math.round(between(rng, 3, 5));
  const folds: string[] = [];
  for (let i = 0; i < foldCount; i += 1) {
    const t = (i + between(rng, 0.25, 0.75)) / foldCount;
    const fx = 180 + t * 640;
    const lean = between(rng, -30, 30);
    const bandW = between(rng, 46, 96);
    const bright = rng() > 0.52;
    folds.push(
      `<path d="M ${R(fx)} 200 C ${R(fx - 20)} 560 ${R(fx + lean)} 820 ${R(fx + lean * 1.5)} 1200
                L ${R(fx + lean * 1.5 + bandW)} 1200 C ${R(fx + lean + bandW)} 820 ${R(fx + bandW - 20)} 560 ${R(fx + bandW)} 200 Z"
             fill="${bright ? m.highlight : "#000000"}" fill-opacity="${R(bright ? m.sheen * 0.13 : 0.15)}"/>`
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="${p}-ground" x1="0" y1="0" x2="0.25" y2="1">
      <stop offset="0%"   stop-color="${OBSIDIAN_900}"/>
      <stop offset="55%"  stop-color="${OBSIDIAN_850}"/>
      <stop offset="100%" stop-color="${OBSIDIAN_950}"/>
    </linearGradient>

    <radialGradient id="${p}-bloom" cx="${fromLeft ? 0.22 : 0.78}" cy="0.14" r="0.74">
      <stop offset="0%"   stop-color="${CHAMPAGNE_500}" stop-opacity="0.30"/>
      <stop offset="44%"  stop-color="${CHAMPAGNE_700}" stop-opacity="0.11"/>
      <stop offset="100%" stop-color="${CHAMPAGNE_700}" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="${p}-cool" cx="${fromLeft ? 0.88 : 0.12}" cy="0.86" r="0.62">
      <stop offset="0%"   stop-color="${COOL}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${COOL}" stop-opacity="0"/>
    </radialGradient>

    <!-- The cloth: shadow to body to highlight, raked from the light side. -->
    <linearGradient id="${p}-cloth" x1="${fromLeft ? 0 : 1}" y1="0.06" x2="${fromLeft ? 1 : 0}" y2="0.96">
      <stop offset="0%"   stop-color="${m.highlight}" stop-opacity="0.38"/>
      <stop offset="20%"  stop-color="${m.body}"/>
      <stop offset="64%"  stop-color="${m.body}"/>
      <stop offset="100%" stop-color="${m.shadow}"/>
    </linearGradient>

    <!-- Specular band. Silk gets a hard one, suede almost none. -->
    <linearGradient id="${p}-spec" x1="${R(lightX - 0.34)}" y1="0" x2="${R(lightX + 0.34)}" y2="0.72">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="44%"  stop-color="${CHAMPAGNE_200}" stop-opacity="${R(m.sheen * 0.17)}"/>
      <stop offset="53%"  stop-color="#ffffff" stop-opacity="${R(m.sheen * 0.26)}"/>
      <stop offset="63%"  stop-color="${CHAMPAGNE_200}" stop-opacity="${R(m.sheen * 0.13)}"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>

    <!-- Turns a flat fill into something with a near and a far edge. -->
    <linearGradient id="${p}-round" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#000000" stop-opacity="${fromLeft ? 0.1 : 0.5}"/>
      <stop offset="${fromLeft ? "34%" : "66%"}" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="${fromLeft ? 0.5 : 0.1}"/>
    </linearGradient>

    <radialGradient id="${p}-contact" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%"   stop-color="#000000" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <!-- Findings. Fixed ids: garments.ts refers to them by name. -->
    <linearGradient id="brass" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%"   stop-color="${CHAMPAGNE_200}"/>
      <stop offset="42%"  stop-color="${CHAMPAGNE_500}"/>
      <stop offset="100%" stop-color="${CHAMPAGNE_700}"/>
    </linearGradient>
    <radialGradient id="horn" cx="0.36" cy="0.3" r="0.8">
      <stop offset="0%"   stop-color="${m.highlight}" stop-opacity="0.85"/>
      <stop offset="55%"  stop-color="${m.shadow}"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
    <linearGradient id="leatherStrap" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%"   stop-color="#a8783f"/>
      <stop offset="50%"  stop-color="#432c17"/>
      <stop offset="100%" stop-color="#150e09"/>
    </linearGradient>

    ${weavePattern(`${p}-weave`, m)}

    <clipPath id="${p}-clip"><path d="${g.outline}" clip-rule="evenodd"/></clipPath>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#${p}-ground)"/>
  <rect width="${width}" height="${height}" fill="url(#${p}-bloom)"/>
  <rect width="${width}" height="${height}" fill="url(#${p}-cool)"/>

  <g ${transform}>
    <!-- Contact shadow. Without it the garment floats. -->
    <ellipse cx="${g.shadow[0]}" cy="${g.shadow[1]}" rx="${g.shadow[2]}" ry="${g.shadow[3]}"
             fill="url(#${p}-contact)"/>

    <!-- The garment. -->
    <g clip-path="url(#${p}-clip)">
      <rect x="0" y="0" width="${STAGE_W}" height="${STAGE_H}" fill="url(#${p}-cloth)"/>
      <rect x="0" y="0" width="${STAGE_W}" height="${STAGE_H}" fill="url(#${p}-weave)"/>
      ${folds.join("")}
      <rect x="0" y="0" width="${STAGE_W}" height="${STAGE_H}" fill="url(#${p}-spec)"/>
      <rect x="0" y="0" width="${STAGE_W}" height="${STAGE_H}" fill="url(#${p}-round)"/>
      ${panels}
      ${g.texture ?? ""}
    </g>

    <!-- Rim light along the lit edge, then the construction. -->
    <path d="${g.outline}" fill="none" fill-rule="evenodd" stroke="${m.highlight}"
          stroke-opacity="0.26" stroke-width="2"/>
    <path d="${g.outline}" fill="none" fill-rule="evenodd" stroke="#000000"
          stroke-opacity="0.4" stroke-width="1"/>
    <g clip-path="url(#${p}-clip)">${seams}${stitches}</g>
    ${g.hardware}
  </g>

  ${grainOverlay(`${p}-grain`, width, height, 0.075)}
  ${detail ? "" : monogram(width - 74, height - 52, 22, 0.16)}
</svg>`;
}

/* -------------------------------------------------------------------------- */
/* Editorial plate — layered glass panes, refraction, deep blooms             */
/* -------------------------------------------------------------------------- */

interface EditorialOptions {
  slug: string;
  width?: number;
  height?: number;
  intensity?: number;
  mark?: boolean;
  theme?: "dark" | "light";
}

function editorialPlate({
  slug,
  width = 1600,
  height = 1000,
  intensity = 1,
  mark = true,
  theme = "dark",
}: EditorialOptions): string {
  // Seed from the base slug so the light variant is the SAME composition as
  // the dark one, lit differently — not a different picture.
  const rng = makeRandom(slug.replace(/-light$/, ""));
  const p = slug;
  const portrait = height > width;
  const light = theme === "light";

  // On light, glass is defined by shadow and a darker edge rather than by a
  // bright fill, and the blooms warm the paper instead of glowing on black.
  const ground = light
    ? { a: BONE_50, b: BONE_100, c: BONE_200 }
    : { a: OBSIDIAN_900, b: OBSIDIAN_850, c: OBSIDIAN_950 };
  const paneStroke = light ? "#2a2318" : "#ffffff";
  const paneStrokeOpacity = light ? 0.14 : 0.26;
  const vignetteColor = light ? BONE_200 : OBSIDIAN_950;
  const vignetteTop = light ? 0.5 : 0.34;
  const vignetteBottom = light ? 0.66 : 0.72;
  const grainOpacity = light ? 0.05 : 0.08;
  const markOpacity = light ? 0.28 : 0.2;

  // Four blooms, one per quadrant, so the frame is lit everywhere but evenly
  // nowhere.
  const quadrants: [number, number][] = [
    [0.2, 0.18],
    [0.78, 0.24],
    [0.28, 0.8],
    [0.84, 0.74],
  ];
  const lights = quadrants.map(([qx, qy], i) => ({
    x: R((qx + between(rng, -0.08, 0.08)) * width),
    y: R((qy + between(rng, -0.08, 0.08)) * height),
    r: R(between(rng, 0.3, 0.52) * Math.max(width, height) * 0.6),
    warm: i !== 1,
    o: R(between(rng, 0.2, 0.42) * intensity),
  }));

  // Glass panes, lightly rotated, each with a lit top edge.
  const paneCount = portrait ? 2 : 3;
  const panes = Array.from({ length: paneCount }, (_, i) => {
    const w = between(rng, 0.2, 0.34) * width;
    const h = between(rng, 0.46, 0.84) * height;
    const x = (0.1 + i * (0.72 / paneCount)) * width + between(rng, -0.03, 0.03) * width;
    const y = between(rng, 0.04, 0.2) * height;
    const rot = between(rng, -7, 7);
    return `<g transform="rotate(${R(rot)} ${R(x + w / 2)} ${R(y + h / 2)})">
      <rect x="${R(x)}" y="${R(y)}" width="${R(w)}" height="${R(h)}" rx="${R(Math.min(w, h) * 0.09)}"
            fill="url(#${p}-pane${i % 2})" stroke="${paneStroke}" stroke-opacity="${paneStrokeOpacity}" stroke-width="1.3"/>
      <rect x="${R(x + w * 0.08)}" y="${R(y)}" width="${R(w * 0.84)}" height="1.6" rx="1"
            fill="${light ? "#ffffff" : CHAMPAGNE_200}" fill-opacity="${light ? 0.85 : 0.3}"/>
      <rect x="${R(x)}" y="${R(y)}" width="${R(w)}" height="${R(h)}" rx="${R(Math.min(w, h) * 0.09)}"
            fill="url(#${p}-sheen)" style="mix-blend-mode:screen"/>
    </g>`;
  }).join("");

  // Refraction: long shallow arcs, the light bending through thick glass.
  const arcs = Array.from({ length: 7 }, (_, i) => {
    const y = between(rng, 0.06, 0.94) * height;
    const bow = between(rng, -0.2, 0.2) * height;
    const op = R(between(rng, 0.07, 0.2));
    const stroke = pick(rng, [CHAMPAGNE_300, CHAMPAGNE_500, COOL] as const);
    return `<path d="M ${R(-width * 0.04)} ${R(y)} Q ${R(width * 0.5)} ${R(y + bow)} ${R(width * 1.04)} ${R(y - bow * 0.55)}"
      fill="none" stroke="${stroke}" stroke-opacity="${op}" stroke-width="${R(between(rng, 0.7, 2.2))}"/>`;
  }).join("");

  // Caustics: a few bright points where refracted light focuses.
  const caustics = Array.from({ length: 3 }, () => {
    const cx = between(rng, 0.15, 0.85) * width;
    const cy = between(rng, 0.15, 0.85) * height;
    const r = between(rng, 0.03, 0.09) * width;
    return `<ellipse cx="${R(cx)}" cy="${R(cy)}" rx="${R(r)}" ry="${R(r * between(rng, 0.4, 1))}" fill="url(#${p}-caustic)"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="${p}-ground" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0%"   stop-color="${ground.a}"/>
      <stop offset="50%"  stop-color="${ground.b}"/>
      <stop offset="100%" stop-color="${ground.c}"/>
    </linearGradient>
    ${lights
      .map(
        (l, i) => `<radialGradient id="${p}-l${i}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%"   stop-color="${l.warm ? CHAMPAGNE_500 : COOL}" stop-opacity="${R(l.o * (light ? 0.8 : 1))}"/>
      <stop offset="52%"  stop-color="${l.warm ? CHAMPAGNE_700 : COOL}" stop-opacity="${R(l.o * 0.34)}"/>
      <stop offset="100%" stop-color="${vignetteColor}" stop-opacity="0"/>
    </radialGradient>`
      )
      .join("")}
    <linearGradient id="${p}-pane0" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="${light ? 0.72 : 0.14}"/>
      <stop offset="48%"  stop-color="#ffffff" stop-opacity="${light ? 0.34 : 0.03}"/>
      <stop offset="100%" stop-color="${CHAMPAGNE_500}" stop-opacity="${light ? 0.24 : 0.13}"/>
    </linearGradient>
    <linearGradient id="${p}-pane1" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="${COOL}" stop-opacity="${light ? 0.2 : 0.15}"/>
      <stop offset="55%"  stop-color="#ffffff" stop-opacity="${light ? 0.4 : 0.025}"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="${light ? 0.7 : 0.12}"/>
    </linearGradient>
    <filter id="${p}-cast" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="${R(Math.max(width, height) * 0.012)}"
        stdDeviation="${R(Math.max(width, height) * 0.014)}"
        flood-color="#3a2f1c" flood-opacity="${light ? 0.2 : 0}"/>
    </filter>
    <linearGradient id="${p}-sheen" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="30%"  stop-color="#ffffff" stop-opacity="0.07"/>
      <stop offset="36%"  stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${p}-caustic" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%"   stop-color="${light ? CHAMPAGNE_500 : CHAMPAGNE_200}" stop-opacity="${light ? 0.22 : 0.3}"/>
      <stop offset="100%" stop-color="${light ? CHAMPAGNE_500 : CHAMPAGNE_200}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${p}-vignette" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="${vignetteColor}" stop-opacity="${vignetteTop}"/>
      <stop offset="38%"  stop-color="${vignetteColor}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${vignetteColor}" stop-opacity="${vignetteBottom}"/>
    </linearGradient>
    <filter id="${p}-blur"><feGaussianBlur stdDeviation="${R(Math.max(width, height) * 0.0012)}"/></filter>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#${p}-ground)"/>
  ${lights
    .map((l, i) => `<ellipse cx="${l.x}" cy="${l.y}" rx="${l.r}" ry="${R(l.r * 0.78)}" fill="url(#${p}-l${i})"/>`)
    .join("")}

  <g filter="url(#${p}-cast)"><g filter="url(#${p}-blur)">${panes}</g></g>
  ${caustics}
  <g>${arcs}</g>

  <rect width="${width}" height="${height}" fill="url(#${p}-vignette)"/>
  <rect x="18" y="18" width="${width - 36}" height="${height - 36}" fill="none"
        stroke="${light ? CHAMPAGNE_700 : CHAMPAGNE_300}" stroke-opacity="${light ? 0.16 : 0.08}" stroke-width="1"/>
  ${grainOverlay(`${p}-grain`, width, height, grainOpacity)}
  ${mark ? monogram(width * 0.5, height * 0.94, Math.min(width, height) * 0.05, markOpacity) : ""}
</svg>`;
}

/* -------------------------------------------------------------------------- */
/* Brand marks                                                                 */
/* -------------------------------------------------------------------------- */

function wordmark(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 92" width="420" height="92" role="img">
  <defs>
    <linearGradient id="wm" x1="0" y1="0" x2="1" y2="0.6">
      <stop offset="0%"   stop-color="#f6ebd8"/>
      <stop offset="52%"  stop-color="${CHAMPAGNE_300}"/>
      <stop offset="100%" stop-color="${CHAMPAGNE_700}"/>
    </linearGradient>
  </defs>
  <text x="210" y="52" font-family="Cormorant Garamond, Georgia, serif" font-size="58" font-weight="300"
        fill="url(#wm)" text-anchor="middle" letter-spacing="0.28em">BRUNO</text>
  <line x1="118" y1="64" x2="302" y2="64" stroke="${CHAMPAGNE_700}" stroke-opacity="0.5" stroke-width="0.8"/>
  <text x="210" y="80" font-family="Inter Tight, Inter, sans-serif" font-size="9.5" font-weight="500"
        fill="${CHAMPAGNE_700}" text-anchor="middle" letter-spacing="0.44em">PREMIUM APPAREL</text>
</svg>`;
}

function seal(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img">
  <defs>
    <linearGradient id="sealEdge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="${CHAMPAGNE_300}" stop-opacity="0.9"/>
      <stop offset="50%"  stop-color="${CHAMPAGNE_700}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${CHAMPAGNE_300}" stop-opacity="0.8"/>
    </linearGradient>
    <radialGradient id="sealFill" cx="0.4" cy="0.32" r="0.75">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="${OBSIDIAN_950}" stop-opacity="0.6"/>
    </radialGradient>
    <path id="sealArc" d="M 100 100 m -74 0 a 74 74 0 1 1 148 0 a 74 74 0 1 1 -148 0" fill="none"/>
  </defs>
  <circle cx="100" cy="100" r="94" fill="url(#sealFill)"/>
  <circle cx="100" cy="100" r="94" fill="none" stroke="url(#sealEdge)" stroke-width="1.2"/>
  <circle cx="100" cy="100" r="82" fill="none" stroke="${CHAMPAGNE_700}" stroke-opacity="0.4" stroke-width="0.6"/>
  <text font-family="Inter Tight, Inter, sans-serif" font-size="9.5" font-weight="500"
        fill="${CHAMPAGNE_300}" fill-opacity="0.8" letter-spacing="0.34em">
    <textPath href="#sealArc" startOffset="4%">MADE IN SMALL NUMBERS · FINISHED BY HAND ·</textPath>
  </text>
  <text x="100" y="104" font-family="Cormorant Garamond, Georgia, serif" font-size="62" font-weight="300"
        fill="${CHAMPAGNE_300}" text-anchor="middle" dominant-baseline="central">B</text>
</svg>`;
}

/* -------------------------------------------------------------------------- */
/* Manifest                                                                    */
/* -------------------------------------------------------------------------- */

/* Every product is a material AND a shape. The shape is what a shopper
   recognises in a 300px grid cell; the material is what they lean in for. */
const PRODUCTS: Record<string, { material: keyof typeof MATERIALS; kind: GarmentKind }> = {
  "obsidian-cashmere-overcoat": { material: "cashmere", kind: "coat" },
  "monolith-wool-topcoat":      { material: "wool",     kind: "topcoat" },
  "nocturne-leather-jacket":    { material: "leather",  kind: "biker" },
  "atelier-wool-blazer":        { material: "worsted",  kind: "blazer" },
  "meridian-tailored-trouser":  { material: "worsted",  kind: "trouser" },
  "cirrus-cashmere-crew":       { material: "cashmere", kind: "crew" },
  "ember-merino-rollneck":      { material: "merino",   kind: "rollneck" },
  "vellum-silk-shirt":          { material: "silk",     kind: "shirt" },
  "alabaster-poplin-shirt":     { material: "cotton",   kind: "shirt" },
  "ivory-linen-overshirt":      { material: "linen",    kind: "overshirt" },
  "solstice-suede-weekender":   { material: "suede",    kind: "bag" },
  "onyx-calfskin-belt":         { material: "leather",  kind: "belt" },
  "halo-silk-scarf":            { material: "silk",     kind: "scarf" },
  "sable-cashmere-wrap":        { material: "cashmere", kind: "wrap" },
};

const CATEGORIES: Record<string, { material: keyof typeof MATERIALS; kind: GarmentKind }> = {
  outerwear:   { material: "wool",     kind: "coat" },
  tailoring:   { material: "worsted",  kind: "blazer" },
  knitwear:    { material: "cashmere", kind: "rollneck" },
  shirting:    { material: "cotton",   kind: "shirt" },
  leather:     { material: "leather",  kind: "biker" },
  accessories: { material: "silk",     kind: "scarf" },
};

/* Human titles for the share cards. The seed owns the real copy; these only
   have to be right enough for a 1200x630 card. */
const PRODUCT_TITLES: Record<string, string> = {
  "obsidian-cashmere-overcoat": "Obsidian Cashmere Overcoat",
  "monolith-wool-topcoat": "Monolith Wool Topcoat",
  "nocturne-leather-jacket": "Nocturne Leather Jacket",
  "atelier-wool-blazer": "Atelier Wool Blazer",
  "meridian-tailored-trouser": "Meridian Tailored Trouser",
  "cirrus-cashmere-crew": "Cirrus Cashmere Crew",
  "ember-merino-rollneck": "Ember Merino Rollneck",
  "vellum-silk-shirt": "Vellum Silk Shirt",
  "alabaster-poplin-shirt": "Alabaster Poplin Shirt",
  "ivory-linen-overshirt": "Ivory Linen Overshirt",
  "solstice-suede-weekender": "Solstice Suede Weekender",
  "onyx-calfskin-belt": "Onyx Calfskin Belt",
  "halo-silk-scarf": "Halo Silk Scarf",
  "sable-cashmere-wrap": "Sable Cashmere Wrap",
};

const CATEGORY_TITLES: Record<string, string> = {
  outerwear: "Outerwear",
  tailoring: "Tailoring",
  knitwear: "Knitwear",
  shirting: "Shirting",
  leather: "Leather",
  accessories: "Accessories",
};

const OUT = join(process.cwd(), "public", "images");
const APP_DIR = join(process.cwd(), "app");

function writeAbs(full: string, contents: string): void {
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, contents.replace(/\n\s*\n/g, "\n").trim());
}

function write(relativePath: string, contents: string): void {
  const full = join(OUT, relativePath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, contents.replace(/\n\s*\n/g, "\n").trim());
}

function main(): void {
  let count = 0;

  for (const [slug, { material, kind }] of Object.entries(PRODUCTS)) {
    write(`products/${slug}-1.svg`, productPlate({ slug, material, kind, variant: "material" }));
    write(`products/${slug}-2.svg`, productPlate({ slug, material, kind, variant: "detail" }));
    count += 2;
  }

  for (const [slug, { material, kind }] of Object.entries(CATEGORIES)) {
    write(
      `editorial/category-${slug}.svg`,
      productPlate({ slug: `category-${slug}`, material, kind, variant: "material", width: 900, height: 1125 })
    );
    count += 1;
  }

  const editorials: [string, number, number, number][] = [
    ["hero", 1800, 1100, 1.2],
    ["membership", 1400, 900, 1.05],
    ["atelier", 1100, 1375, 1.0],
    ["materials", 1100, 1375, 0.95],
    ["provenance", 1100, 1375, 0.9],
    ["journal-atelier", 1400, 900, 1.05],
    ["journal-materials", 1400, 900, 0.95],
    ["journal-wardrobe", 1400, 900, 1.0],
    ["journal-leather", 1400, 900, 0.9],
    ["placeholder", 1000, 1250, 0.75],
  ];

  for (const [slug, w, h, intensity] of editorials) {
    write(`editorial/${slug}.svg`, editorialPlate({ slug, width: w, height: h, intensity }));
    count += 1;
  }

  // Light-theme variants of the two backdrops the storefront actually renders.
  // Same composition, lit for paper rather than for glass.
  for (const slug of ["hero", "membership"] as const) {
    const spec = editorials.find(([name]) => name === slug);
    if (!spec) continue;
    const [, w, h, intensity] = spec;
    write(
      `editorial/${slug}-light.svg`,
      editorialPlate({ slug: `${slug}-light`, width: w, height: h, intensity, theme: "light" })
    );
    count += 1;
  }

  write("brand/wordmark.svg", wordmark());
  write("brand/seal.svg", seal());
  count += 2;

  // App icon. Next.js picks `app/icon.svg` up automatically and emits the
  // <link rel="icon">; the .ico and apple-touch sizes come from the rasteriser.
  writeAbs(join(APP_DIR, "icon.svg"), appIcon());
  count += 1;

  // Share cards. These are SVG here and PNG after `npm run images:raster` —
  // PNG is what the platforms actually accept.
  write("og/default.svg", ogCard({
    slug: "default",
    eyebrow: "Premium apparel",
    // Two lines is the cap, so the brand card gets a title that fits in two.
    title: "Clothes made to outlast",
    garment: { kind: "coat", material: "cashmere" },
    footnote: "Cashmere, half-canvas tailoring, vegetable-tanned leather",
  }));
  count += 1;

  for (const [slug, { material, kind }] of Object.entries(PRODUCTS)) {
    write(`og/product-${slug}.svg`, ogCard({
      slug: `product-${slug}`,
      eyebrow: "The collection",
      title: PRODUCT_TITLES[slug] ?? slug,
      garment: { kind, material },
    }));
    count += 1;
  }

  for (const [slug, { material, kind }] of Object.entries(CATEGORIES)) {
    write(`og/category-${slug}.svg`, ogCard({
      slug: `category-${slug}`,
      eyebrow: "By category",
      title: CATEGORY_TITLES[slug] ?? slug,
      garment: { kind, material },
    }));
    count += 1;
  }

  // Which cards exist, so metadata can fall back to the brand card for a
  // product added after the last run rather than linking a 404.
  write("og/manifest.json", JSON.stringify({
    products: Object.keys(PRODUCTS),
    categories: Object.keys(CATEGORIES),
  }, null, 2));
  count += 1;

  process.stdout.write(`Generated ${count} assets into public/images\n`);
}

main();
