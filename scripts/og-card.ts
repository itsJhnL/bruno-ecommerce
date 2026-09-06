/**
 * scripts/og-card.ts
 *
 * Open Graph share cards, 1200 × 630.
 *
 * Social platforms do not render SVG. Pointing `openGraph.images` at an `.svg`
 * — which this project did on every page — means a share on X, Facebook,
 * LinkedIn, Slack or WhatsApp shows no picture at all. It is invisible until
 * somebody shares the site, and then it is embarrassing.
 *
 * These are composed here as SVG and rasterised to PNG by
 * `npm run images:raster`, because the PNG is what actually gets shipped.
 */

import { buildGarment, STAGE_H, STAGE_W, type GarmentKind } from "./garments";
import { monogramMark, wordmarkOutlines } from "./brand-marks";
import {
  CHAMPAGNE_200,
  CHAMPAGNE_300,
  CHAMPAGNE_500,
  CHAMPAGNE_700,
  grainOverlay,
  MATERIALS,
  OBSIDIAN_850,
  OBSIDIAN_900,
  OBSIDIAN_950,
  weavePattern,
  type MaterialSpec,
} from "./materials";

export const OG_W = 1200;
export const OG_H = 630;

export interface OgOptions {
  slug: string;
  eyebrow: string;
  title: string;
  /** Omitted for the brand card, which carries no garment. */
  garment?: { kind: GarmentKind; material: keyof typeof MATERIALS };
  footnote?: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Greedy wrap, capped at two lines. A share card that needs three lines has
 * a title problem, not a layout problem.
 */
function wrapTitle(text: string, x: number, y: number, size: number, fill: string): string {
  const maxChars = 17;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);

  return lines
    .slice(0, 2)
    .map(
      (l, i) =>
        `<text x="${x}" y="${y + i * (size * 1.1)}" font-size="${size}" font-weight="300"
               font-family="Futura, 'Century Gothic', 'Trebuchet MS', Helvetica, Arial, sans-serif"
               letter-spacing="-1.4" fill="${fill}">${escapeXml(l)}</text>`
    )
    .join("");
}

export function ogCard({ slug, eyebrow, title, garment, footnote }: OgOptions): string {
  const p = `og-${slug}`;
  const m = garment ? (MATERIALS[garment.material] as MaterialSpec) : null;
  const g = garment ? buildGarment(garment.kind) : null;

  // The garment occupies the right third, scaled to sit inside the card.
  const art =
    g && m
      ? `<g transform="translate(${OG_W - 392} 8) scale(0.49)">
          <ellipse cx="${g.shadow[0]}" cy="${g.shadow[1]}" rx="${g.shadow[2]}" ry="${g.shadow[3]}"
                   fill="url(#${p}-contact)"/>
          <g clip-path="url(#${p}-clip)">
            <rect width="${STAGE_W}" height="${STAGE_H}" fill="url(#${p}-cloth)"/>
            <rect width="${STAGE_W}" height="${STAGE_H}" fill="url(#${p}-weave)"/>
            ${g.texture ?? ""}
            ${g.panels
              .map(
                (panel) =>
                  `<path d="${panel.d}" fill="${
                    panel.tone === "shadow"
                      ? "#000000"
                      : panel.tone === "highlight"
                        ? m.highlight
                        : m.body
                  }" fill-opacity="${
                    panel.opacity ?? (panel.tone === "shadow" ? 0.4 : 0.16)
                  }" fill-rule="evenodd"/>`
              )
              .join("")}
          </g>
          <path d="${g.outline}" fill="none" fill-rule="evenodd" stroke="${m.highlight}"
                stroke-opacity="0.24" stroke-width="2.4"/>
          <g clip-path="url(#${p}-clip)">
            ${g.seams
              .map(
                (d) =>
                  `<path d="${d}" fill="none" stroke="#000000" stroke-opacity="0.42"
                         stroke-width="3.4" stroke-linecap="round"/>`
              )
              .join("")}
          </g>
          ${g.hardware}
        </g>`
      : "";

  const findings = m
    ? `<linearGradient id="${p}-cloth" x1="0" y1="0.06" x2="1" y2="0.96">
         <stop offset="0%"   stop-color="${m.highlight}" stop-opacity="0.38"/>
         <stop offset="20%"  stop-color="${m.body}"/>
         <stop offset="64%"  stop-color="${m.body}"/>
         <stop offset="100%" stop-color="${m.shadow}"/>
       </linearGradient>
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
       ${weavePattern(`${p}-weave`, m)}`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${OG_W} ${OG_H}" width="${OG_W}" height="${OG_H}" role="img">
  <defs>
    <linearGradient id="${p}-ground" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%"   stop-color="${OBSIDIAN_900}"/>
      <stop offset="55%"  stop-color="${OBSIDIAN_850}"/>
      <stop offset="100%" stop-color="${OBSIDIAN_950}"/>
    </linearGradient>
    <radialGradient id="${p}-bloom" cx="0.76" cy="0.14" r="0.72">
      <stop offset="0%"   stop-color="${CHAMPAGNE_500}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${CHAMPAGNE_700}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${p}-contact" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%"   stop-color="#000000" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    ${findings}
    ${g ? `<clipPath id="${p}-clip"><path d="${g.outline}" clip-rule="evenodd"/></clipPath>` : ""}
  </defs>

  <rect width="${OG_W}" height="${OG_H}" fill="url(#${p}-ground)"/>
  <rect width="${OG_W}" height="${OG_H}" fill="url(#${p}-bloom)"/>
  ${art}

  <!-- Wordmark as outlines: the rasteriser's machine has no house font. -->
  ${wordmarkOutlines(246, 66, 44, CHAMPAGNE_300)}
  <line x1="96" y1="146" x2="396" y2="146" stroke="${CHAMPAGNE_700}" stroke-opacity="0.55" stroke-width="1"/>
  <text x="96" y="176" font-size="15" font-weight="500" letter-spacing="6.6"
        font-family="Helvetica, Arial, sans-serif" fill="${CHAMPAGNE_700}">PREMIUM APPAREL</text>

  <text x="96" y="292" font-size="18" font-weight="500" letter-spacing="5.2"
        font-family="Helvetica, Arial, sans-serif" fill="${CHAMPAGNE_700}">
    ${escapeXml(eyebrow.toUpperCase())}
  </text>
  ${wrapTitle(title, 96, 366, 66, "#f4f2ee")}
  ${
    footnote
      ? `<text x="96" y="${OG_H - 74}" font-size="24" font-family="Helvetica, Arial, sans-serif"
              fill="#b6b2ab">${escapeXml(footnote)}</text>`
      : ""
  }

  ${monogramMark(OG_W - 118, OG_H - 118, 0.14, CHAMPAGNE_700)}
  ${grainOverlay(`${p}-grain`, OG_W, OG_H, 0.055)}
</svg>`;
}
