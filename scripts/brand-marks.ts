/**
 * scripts/brand-marks.ts
 *
 * The monogram, drawn as vector paths rather than as text.
 *
 * The original `seal.svg` and `wordmark.svg` set `font-family="Cormorant
 * Garamond"` — a face this project stopped using at D-017, and one that is not
 * installed on most machines. Inside a favicon or an Open Graph card that is
 * fatal twice over: the file is rasterised on a build machine whose fonts you
 * do not control, and the result is baked in forever. Outlines render the same
 * everywhere, so the mark is outlines.
 */

/** House palette, duplicated here so this module stands alone. */
export const INK = "#08070a";
export const CHAMPAGNE_200 = "#eddcbd";
export const CHAMPAGNE_300 = "#e3cba0";
export const CHAMPAGNE_500 = "#c9a96a";
export const CHAMPAGNE_700 = "#9a7c42";

/**
 * The letter B, as one even-odd path: a silhouette with a waist between the
 * two bowls, and the counters cut out as holes. Drawn on a 512 grid with the
 * letter occupying x 150–394, y 104–400.
 */
export const MONOGRAM_PATH = [
  // Outer silhouette.
  "M 150 104 L 286 104",
  "C 344 104 382 136 382 182",
  "C 382 214 364 236 336 246",
  "C 370 256 394 284 394 320",
  "C 394 368 352 400 292 400",
  "L 150 400 Z",
  // Upper counter.
  "M 206 150 L 280 150 C 306 150 322 162 322 182",
  "C 322 202 306 214 280 214 L 206 214 Z",
  // Lower counter.
  "M 206 266 L 286 266 C 316 266 336 280 336 304",
  "C 336 328 316 342 286 342 L 206 342 Z",
].join(" ");

/** Centres the monogram on a 512 stage. */
const MONOGRAM_TRANSFORM = "translate(-16 4)";

/**
 * The app icon. Opaque on purpose: a transparent favicon disappears into dark
 * browser chrome, and every tab strip is a different colour.
 */
export function appIcon(size = 512): string {
  const r = Math.round(size * 0.22);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}" role="img">
  <defs>
    <linearGradient id="ground" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%"   stop-color="#16141b"/>
      <stop offset="60%"  stop-color="${INK}"/>
      <stop offset="100%" stop-color="#050408"/>
    </linearGradient>
    <linearGradient id="mark" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0%"   stop-color="${CHAMPAGNE_200}"/>
      <stop offset="52%"  stop-color="${CHAMPAGNE_300}"/>
      <stop offset="100%" stop-color="${CHAMPAGNE_700}"/>
    </linearGradient>
    <radialGradient id="bloom" cx="0.3" cy="0.2" r="0.8">
      <stop offset="0%"   stop-color="${CHAMPAGNE_500}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${CHAMPAGNE_500}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="${(r * 512) / size}" fill="url(#ground)"/>
  <rect width="512" height="512" rx="${(r * 512) / size}" fill="url(#bloom)"/>
  <rect x="8" y="8" width="496" height="496" rx="${(r * 512) / size - 8}" fill="none"
        stroke="${CHAMPAGNE_700}" stroke-opacity="0.45" stroke-width="4"/>
  <g transform="${MONOGRAM_TRANSFORM}">
    <path d="${MONOGRAM_PATH}" fill="url(#mark)" fill-rule="evenodd"/>
  </g>
</svg>`;
}

/**
 * A small mark for use inside larger compositions. `scale` is relative to the
 * 512 grid, so 0.1 gives a roughly 51px letter.
 */
export function monogramMark(x: number, y: number, scale: number, fill: string): string {
  return `<g transform="translate(${x} ${y}) scale(${scale}) ${MONOGRAM_TRANSFORM}">
    <path d="${MONOGRAM_PATH}" fill="${fill}" fill-rule="evenodd"/>
  </g>`;
}

/**
 * "BRUNO", letterspaced, as outlines.
 *
 * Each glyph is a rectangle-built approximation in the geometric idiom of Jost
 * — enough to read as the wordmark at card sizes without shipping a font
 * binary into the rasteriser. Only the five letters the house name needs exist.
 */
const GLYPHS: Record<string, string> = {
  // Each glyph is drawn on a 0–100 wide, 0–140 tall box.
  B: "M 8 6 L 58 6 C 82 6 96 20 96 38 C 96 51 89 61 77 66 C 91 70 100 82 100 98 C 100 120 84 134 58 134 L 8 134 Z M 30 26 L 55 26 C 66 26 72 31 72 40 C 72 49 66 54 55 54 L 30 54 Z M 30 76 L 57 76 C 70 76 78 82 78 94 C 78 106 70 112 57 112 L 30 112 Z",
  R: "M 8 6 L 58 6 C 84 6 100 22 100 46 C 100 64 91 77 76 83 L 104 134 L 78 134 L 54 88 L 30 88 L 30 134 L 8 134 Z M 30 26 L 56 26 C 68 26 76 34 76 47 C 76 60 68 68 56 68 L 30 68 Z",
  U: "M 8 6 L 30 6 L 30 92 C 30 106 39 114 54 114 C 69 114 78 106 78 92 L 78 6 L 100 6 L 100 93 C 100 119 82 136 54 136 C 26 136 8 119 8 93 Z",
  N: "M 8 6 L 30 6 L 78 92 L 78 6 L 100 6 L 100 134 L 78 134 L 30 48 L 30 134 L 8 134 Z",
  // Geometric sans wants a near-circular O. The first version was 96 wide on a
  // 140 grid, which reads as a zero rather than a letter.
  O: "M 62 4 C 96 4 120 32 120 70 C 120 108 96 136 62 136 C 28 136 4 108 4 70 C 4 32 28 4 62 4 Z M 62 26 C 43 26 30 44 30 70 C 30 96 43 114 62 114 C 81 114 94 96 94 70 C 94 44 81 26 62 26 Z",
};

/** Renders BRUNO at a given height, centred on `cx`. Returns SVG. */
export function wordmarkOutlines(
  cx: number,
  y: number,
  height: number,
  fill: string,
  tracking = 46
): string {
  const scale = height / 140;
  const letters = "BRUNO".split("");
  const widths = letters.map((l) => (l === "R" ? 104 : l === "O" ? 124 : 100) * scale);
  const gap = tracking * scale;
  const total = widths.reduce((a, b) => a + b, 0) + gap * (letters.length - 1);

  let cursor = cx - total / 2;
  const parts: string[] = [];

  letters.forEach((letter, i) => {
    const path = GLYPHS[letter];
    if (path) {
      parts.push(
        `<g transform="translate(${cursor.toFixed(1)} ${y}) scale(${scale.toFixed(4)})">
          <path d="${path}" fill="${fill}" fill-rule="evenodd"/>
        </g>`
      );
    }
    cursor += (widths[i] ?? 0) + gap;
  });

  return parts.join("");
}
