/**
 * scripts/smoke.mjs
 *
 * Checks the HTTP status of every route that matters, against a running server.
 *
 *   npm run build && npm run start &
 *   npm run test:http                        # localhost:3000
 *   npm run test:http -- https://your.site   # a real deployment
 *
 * It exists because of one bug it would have caught immediately: a
 * `loading.tsx` at the storefront root made Next stream the response, so every
 * `notFound()` arrived after the `200 OK` had already gone out. Missing
 * products returned a page that said "404" with a status of 200 — a soft 404,
 * which search engines index as a real page (Memory.md D-038).
 *
 * Status codes are invisible in a browser, which is exactly why they need a
 * test rather than a look.
 */

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

const rand = () => Math.random().toString(36).slice(2, 10);

/** [path, expected status, why it matters] */
const ROUTES = [
  // Storefront.
  ["/", 200, "landing"],
  ["/collection", 200, "catalogue"],
  ["/journal", 200, "journal index"],
  ["/membership", 200, "membership"],
  ["/cart", 200, "bag"],
  ["/checkout", 200, "checkout"],

  // Dynamic routes that exist.
  ["/product/obsidian-cashmere-overcoat", 200, "product detail"],
  ["/category/outerwear", 200, "category"],
  ["/journal/eleven-hours", 200, "journal article"],
  ["/house", 200, "CMS page"],
  ["/materials", 200, "CMS page"],
  ["/shipping", 200, "CMS page"],
  ["/returns", 200, "CMS page"],

  // Catalogue state lives in the URL, so every combination must resolve.
  ["/collection?q=cashmere", 200, "search"],
  ["/collection?category=knitwear", 200, "category filter"],
  ["/collection?sort=price-asc", 200, "sort"],
  ["/collection?sort=nonsense", 200, "unknown sort must not 500"],
  ["/collection?page=2", 200, "pagination"],
  ["/collection?page=99999", 200, "page past the end must not 500"],
  ["/collection?minPrice=300&maxPrice=800", 200, "price filter"],
  ["/collection?minPrice=abc", 200, "junk price must not 500"],
  ["/collection?sizes=M&colours=Bone", 200, "attribute filters"],

  // Auth.
  ["/login", 200, "sign in"],
  ["/register", 200, "register"],
  ["/forgot-password", 200, "reset request"],
  ["/reset-password", 200, "reset form"],

  // Machine-readable surfaces.
  ["/api/viewer", 200, "cart + session endpoint"],
  ["/sitemap.xml", 200, "sitemap"],
  ["/robots.txt", 200, "robots"],
  ["/favicon.ico", 200, "favicon"],
  ["/icon.svg", 200, "app icon"],
  ["/apple-icon.png", 200, "apple touch icon"],
  ["/images/og/default.png", 200, "share card"],

  // Everything below must NOT be a soft 404.
  [`/product/missing-${rand()}`, 404, "missing product"],
  [`/category/missing-${rand()}`, 404, "missing category"],
  [`/journal/missing-${rand()}`, 404, "missing article"],
  [`/missing-page-${rand()}`, 404, "missing CMS page"],
  [`/one/two/three-${rand()}`, 404, "unmatched path"],

  // Protected.
  ["/account", [307, 308], "account redirects when signed out"],
  ["/account/orders", [307, 308], "account subpage redirects"],
];

const expectations = new Map(ROUTES.map(([path, want]) => [path, want]));
let failures = 0;

console.log(`\nSmoke test against ${base}\n`);

for (const [path, want, why] of ROUTES) {
  let status = 0;
  let note = "";

  try {
    const response = await fetch(base + path, { redirect: "manual" });
    status = response.status;

    // A page that says "404" but returns 200 is the exact bug this catches.
    if (status === 200 && expectations.get(path) === 404) {
      const body = await response.text();
      if (/404|not found/i.test(body)) note = "soft 404 — body says missing, status says OK";
    }
  } catch (error) {
    note = error instanceof Error ? error.message : String(error);
  }

  const wanted = Array.isArray(want) ? want : [want];
  const pass = wanted.includes(status);
  if (!pass) failures += 1;

  console.log(
    `  ${pass ? "PASS" : "FAIL"}  ${String(status).padEnd(3)} ${path.padEnd(42)} ${
      pass ? why : `${why} — wanted ${wanted.join(" or ")}${note ? `; ${note}` : ""}`
    }`
  );
}

console.log(
  failures === 0
    ? `\nALL ${ROUTES.length} ROUTES OK\n`
    : `\n${failures} of ${ROUTES.length} ROUTES WRONG\n`
);
process.exit(failures === 0 ? 0 : 1);
