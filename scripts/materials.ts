/**
 * scripts/materials.ts
 *
 * The house material vocabulary: palette, deterministic PRNG, cloth specs and
 * the weave patterns that make cashmere look unlike calfskin.
 *
 * Extracted from `generate-images.ts` so the Open Graph card generator can
 * share it. Importing from `generate-images.ts` would have run its `main()`
 * as a side effect of the import.
 */

/* -------------------------------------------------------------------------- */
/* Palette                                                                     */
/* -------------------------------------------------------------------------- */

export const OBSIDIAN_950 = "#08070a";
export const OBSIDIAN_900 = "#0d0c11";
export const OBSIDIAN_850 = "#131218";
export const CHAMPAGNE_200 = "#eddcbd";
export const CHAMPAGNE_300 = "#e3cba0";
export const CHAMPAGNE_500 = "#c9a96a";
export const CHAMPAGNE_700 = "#9a7c42";
export const COOL = "#7e96b8";

/* Light-theme ground. The editorial backdrops need a light variant, or light
   mode is a dark photograph printed on cream paper. Product plates stay dark
   in both themes — a dark plate on a light page reads as photography. */
export const BONE_50 = "#faf8f3";
export const BONE_100 = "#f4f1ea";
export const BONE_200 = "#ebe5d9";

/* -------------------------------------------------------------------------- */
/* Deterministic PRNG — same slug, same picture, every build                  */
/* -------------------------------------------------------------------------- */

export function makeRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
}

export type Rng = () => number;
export const between = (r: Rng, min: number, max: number) => min + r() * (max - min);
export const R = (n: number) => Math.round(n * 100) / 100;
export const pick = <T,>(r: Rng, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)] as T;

/* -------------------------------------------------------------------------- */
/* Material vocabulary                                                         */
/*                                                                             */
/* Each material gets three tones — shadow, body, highlight — kept inside the  */
/* house envelope (dark, desaturated, warm-biased) but distinct enough that a  */
/* grid of twelve products does not read as twelve copies of one picture.      */
/* -------------------------------------------------------------------------- */

export type Weave = "brushed" | "twill" | "satin" | "grain" | "nap" | "plain" | "poplin" | "polished";

export interface MaterialSpec {
  shadow: string;
  body: string;
  highlight: string;
  weave: Weave;
  /** 0 matte, 1 mirror. Drives the strength of the specular band. */
  sheen: number;
  /** Texture scale in px. Larger = coarser cloth. */
  grain: number;
}

export const MATERIALS: Record<string, MaterialSpec> = {
  cashmere: { shadow: "#1a160f", body: "#4c3c2b", highlight: "#c9b28d", weave: "brushed", sheen: 0.34, grain: 7 },
  merino:   { shadow: "#1b120d", body: "#563820", highlight: "#c0936a", weave: "brushed", sheen: 0.30, grain: 6 },
  wool:     { shadow: "#131519", body: "#343945", highlight: "#8f97a6", weave: "twill",   sheen: 0.26, grain: 8 },
  worsted:  { shadow: "#15171d", body: "#383c49", highlight: "#9aa2b0", weave: "twill",   sheen: 0.32, grain: 6 },
  silk:     { shadow: "#191720", body: "#544d5c", highlight: "#ded2c2", weave: "satin",   sheen: 0.88, grain: 4 },
  leather:  { shadow: "#150e09", body: "#432c17", highlight: "#a8783f", weave: "grain",   sheen: 0.58, grain: 10 },
  suede:    { shadow: "#191108", body: "#4c331c", highlight: "#a37f4f", weave: "nap",     sheen: 0.18, grain: 12 },
  linen:    { shadow: "#181913", body: "#464634", highlight: "#c4bfa6", weave: "plain",   sheen: 0.30, grain: 11 },
  cotton:   { shadow: "#14161a", body: "#464b53", highlight: "#d2d6db", weave: "poplin",  sheen: 0.42, grain: 5 },
  brass:    { shadow: "#191207", body: "#5f4820", highlight: "#d9bc7c", weave: "polished",sheen: 0.95, grain: 4 },
};

/* -------------------------------------------------------------------------- */
/* Shared fragments                                                            */
/* -------------------------------------------------------------------------- */

/** Film grain. Without this every gradient bands and the set reads as CSS. */
export function grainOverlay(id: string, w: number, h: number, opacity = 0.09): string {
  return `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" seed="7" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.52  0 0 0 0 0.47  0 0 0 0.6 0"/>
  </filter>
  <rect width="${w}" height="${h}" filter="url(#${id})" opacity="${opacity}" style="mix-blend-mode:overlay"/>`;
}

/** The weave itself, as a tiling pattern. Legible at thumbnail size. */
export function weavePattern(id: string, spec: MaterialSpec): string {
  const s = spec.grain;
  const lo = "#000000";
  const hi = spec.highlight;

  switch (spec.weave) {
    case "twill":
      return `<pattern id="${id}" width="${s}" height="${s}" patternUnits="userSpaceOnUse" patternTransform="rotate(32)">
        <rect width="${s}" height="${s}" fill="none"/>
        <line x1="0" y1="0" x2="0" y2="${s}" stroke="${hi}" stroke-opacity="0.20" stroke-width="${R(s * 0.22)}"/>
        <line x1="${R(s / 2)}" y1="0" x2="${R(s / 2)}" y2="${s}" stroke="${lo}" stroke-opacity="0.24" stroke-width="${R(s * 0.2)}"/>
      </pattern>`;

    case "plain":
      return `<pattern id="${id}" width="${s}" height="${s}" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="${s}" y2="0" stroke="${hi}" stroke-opacity="0.16" stroke-width="${R(s * 0.18)}"/>
        <line x1="0" y1="${R(s / 2)}" x2="${s}" y2="${R(s / 2)}" stroke="${lo}" stroke-opacity="0.2" stroke-width="${R(s * 0.16)}"/>
        <line x1="0" y1="0" x2="0" y2="${s}" stroke="${hi}" stroke-opacity="0.13" stroke-width="${R(s * 0.18)}"/>
        <line x1="${R(s / 2)}" y1="0" x2="${R(s / 2)}" y2="${s}" stroke="${lo}" stroke-opacity="0.17" stroke-width="${R(s * 0.16)}"/>
      </pattern>`;

    case "poplin":
      return `<pattern id="${id}" width="${s}" height="${s}" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="${s}" stroke="${hi}" stroke-opacity="0.15" stroke-width="${R(s * 0.3)}"/>
        <line x1="0" y1="0" x2="${s}" y2="0" stroke="${lo}" stroke-opacity="0.13" stroke-width="${R(s * 0.22)}"/>
      </pattern>`;

    case "satin":
      return `<pattern id="${id}" width="${R(s * 6)}" height="${R(s * 6)}" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
        <line x1="0" y1="0" x2="0" y2="${R(s * 6)}" stroke="${hi}" stroke-opacity="0.10" stroke-width="${R(s * 0.8)}"/>
        <line x1="${R(s * 3)}" y1="0" x2="${R(s * 3)}" y2="${R(s * 6)}" stroke="${lo}" stroke-opacity="0.10" stroke-width="${R(s * 1.2)}"/>
      </pattern>`;

    case "brushed":
      return `<pattern id="${id}" width="${R(s * 5)}" height="${R(s * 5)}" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
        <line x1="0" y1="${R(s)}"     x2="${R(s * 5)}" y2="${R(s * 1.4)}" stroke="${hi}" stroke-opacity="0.11" stroke-width="${R(s * 0.34)}"/>
        <line x1="0" y1="${R(s * 2.6)}" x2="${R(s * 5)}" y2="${R(s * 2.2)}" stroke="${lo}" stroke-opacity="0.14" stroke-width="${R(s * 0.5)}"/>
        <line x1="0" y1="${R(s * 4)}" x2="${R(s * 5)}" y2="${R(s * 4.4)}" stroke="${hi}" stroke-opacity="0.08" stroke-width="${R(s * 0.28)}"/>
      </pattern>`;

    case "grain":
      // Hide grain: irregular cells, offset row to row.
      return `<pattern id="${id}" width="${R(s * 3)}" height="${R(s * 2.6)}" patternUnits="userSpaceOnUse">
        <ellipse cx="${R(s * 0.8)}" cy="${R(s * 0.7)}" rx="${R(s * 0.62)}" ry="${R(s * 0.48)}" fill="${hi}" fill-opacity="0.09"/>
        <ellipse cx="${R(s * 2.2)}" cy="${R(s * 1.9)}" rx="${R(s * 0.74)}" ry="${R(s * 0.52)}" fill="${hi}" fill-opacity="0.07"/>
        <ellipse cx="${R(s * 2.4)}" cy="${R(s * 0.5)}" rx="${R(s * 0.42)}" ry="${R(s * 0.36)}" fill="${lo}" fill-opacity="0.16"/>
        <ellipse cx="${R(s * 0.6)}" cy="${R(s * 2.1)}" rx="${R(s * 0.5)}" ry="${R(s * 0.4)}" fill="${lo}" fill-opacity="0.13"/>
      </pattern>`;

    case "nap":
      return `<pattern id="${id}" width="${R(s * 2)}" height="${R(s * 2)}" patternUnits="userSpaceOnUse" patternTransform="rotate(54)">
        <line x1="0" y1="0" x2="0" y2="${R(s * 2)}" stroke="${hi}" stroke-opacity="0.07" stroke-width="${R(s * 0.5)}"/>
        <line x1="${R(s)}" y1="0" x2="${R(s)}" y2="${R(s * 2)}" stroke="${lo}" stroke-opacity="0.09" stroke-width="${R(s * 0.7)}"/>
      </pattern>`;

    case "polished":
    default:
      return `<pattern id="${id}" width="${R(s * 10)}" height="${R(s * 10)}" patternUnits="userSpaceOnUse" patternTransform="rotate(24)">
        <line x1="0" y1="0" x2="0" y2="${R(s * 10)}" stroke="${hi}" stroke-opacity="0.13" stroke-width="${R(s * 0.5)}"/>
        <line x1="${R(s * 4)}" y1="0" x2="${R(s * 4)}" y2="${R(s * 10)}" stroke="${lo}" stroke-opacity="0.11" stroke-width="${R(s * 1.4)}"/>
      </pattern>`;
  }
}
