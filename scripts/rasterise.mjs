/**
 * scripts/rasterise.mjs
 *
 * Turns the generated SVGs into the raster formats that browsers and social
 * platforms actually accept:
 *
 *   app/favicon.ico          16 / 32 / 48, for tabs, bookmarks and Google
 *   app/apple-icon.png       180, for iOS home screens
 *   public/images/og/*.png   1200x630, because no social platform renders SVG
 *
 * Run it after `npm run images`:
 *
 *   npm run images:raster
 *
 * The PNGs are committed, so a normal `npm run build` never needs a browser.
 * This only has to run when the artwork changes.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const OG_DIR = join(ROOT, "public", "images", "og");
const APP_DIR = join(ROOT, "app");

/* -------------------------------------------------------------------------- */
/* Finding a browser                                                           */
/* -------------------------------------------------------------------------- */

const CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

const chrome = CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error(
    "No Chrome or Edge found. Set CHROME_PATH to a Chromium binary.\n" +
      "The committed PNGs are still valid — this step is only needed when the art changes."
  );
  process.exit(1);
}

const work = mkdtempSync(join(tmpdir(), "bruno-raster-"));

/**
 * Rasterises one SVG at an exact pixel size.
 *
 * The SVG is wrapped in an HTML page sized to the target, because Chrome's
 * --screenshot captures the viewport, not the image's intrinsic size, and a
 * mismatch silently letterboxes the result.
 */
function toPng(svgPath, outPath, width, height) {
  const svg = readFileSync(svgPath, "utf8");
  const page = join(work, `${Math.random().toString(36).slice(2)}.html`);

  writeFileSync(
    page,
    `<!doctype html><meta charset="utf-8">
     <style>html,body{margin:0;padding:0;background:transparent}
     svg{display:block;width:${width}px;height:${height}px}</style>${svg}`,
    "utf8"
  );

  execFileSync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--default-background-color=00000000",
      `--window-size=${width},${height}`,
      `--screenshot=${outPath}`,
      pathToFileURL(page).href,
    ],
    { stdio: "ignore" }
  );

  if (!existsSync(outPath)) throw new Error(`Chrome produced nothing for ${svgPath}`);
}

/* -------------------------------------------------------------------------- */
/* ICO container                                                               */
/* -------------------------------------------------------------------------- */

/**
 * An .ico is a tiny header followed by whole PNG files, so no image encoder is
 * needed — just the directory structure. Sizes are limited to <= 256 because
 * the format stores width and height in a single byte each (0 meaning 256).
 */
function buildIco(pngPaths) {
  const images = pngPaths.map(({ size, path }) => ({ size, data: readFileSync(path) }));

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(images.length, 4);

  const entries = [];
  let offset = 6 + images.length * 16;

  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

/* -------------------------------------------------------------------------- */

try {
  let count = 0;

  // --- App icons ----------------------------------------------------------
  const iconSvg = join(APP_DIR, "icon.svg");
  if (!existsSync(iconSvg)) {
    throw new Error("app/icon.svg is missing — run `npm run images` first.");
  }

  const icoSizes = [16, 32, 48];
  const icoParts = icoSizes.map((size) => {
    const out = join(work, `icon-${size}.png`);
    toPng(iconSvg, out, size, size);
    return { size, path: out };
  });

  writeFileSync(join(APP_DIR, "favicon.ico"), buildIco(icoParts));
  console.log(`  ok   app/favicon.ico (${icoSizes.join(", ")})`);
  count += 1;

  toPng(iconSvg, join(APP_DIR, "apple-icon.png"), 180, 180);
  console.log("  ok   app/apple-icon.png (180)");
  count += 1;

  // --- Share cards --------------------------------------------------------
  mkdirSync(OG_DIR, { recursive: true });
  const cards = readdirSync(OG_DIR).filter((f) => f.endsWith(".svg"));

  for (const file of cards) {
    const out = join(OG_DIR, file.replace(/\.svg$/, ".png"));
    toPng(join(OG_DIR, file), out, 1200, 630);
    count += 1;
  }
  console.log(`  ok   ${cards.length} share cards at 1200x630`);

  console.log(`\nRasterised ${count} assets.`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
