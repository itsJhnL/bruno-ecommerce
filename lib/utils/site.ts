import { fallbackData } from "@/lib/fallback-catalog";

const settings = fallbackData.settings as Record<string, string | number | null>;

export const SITE = {
  name: String(settings["site.name"] ?? "BRUNO"),
  tagline: String(settings["site.tagline"] ?? "Premium Apparel"),
  description: String(settings["site.description"] ?? ""),
  email: String(settings["site.email"] ?? ""),
  phone: String(settings["site.phone"] ?? ""),
  address: String(settings["site.address"] ?? ""),
  hours: String(settings["site.hours"] ?? ""),
  currency: String(settings["site.currency"] ?? "USD"),
  social: {
    instagram: String(settings["social.instagram"] ?? ""),
    pinterest: String(settings["social.pinterest"] ?? ""),
  },
} as const;

/** Ignores a variable that is present but blank — Vercel sets those readily. */
function present(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/$/, "") : null;
}

/**
 * Where this deployment lives.
 *
 * Used for canonicals, OG image URLs, the sitemap, JSON-LD, password-reset
 * links, and the URL Stripe returns the customer to after paying. Getting it
 * wrong is not cosmetic: an unset variable used to fall through to the seeded
 * `site.url`, which is `https://bruno.example.com` — a domain nobody here owns.
 * Stripe would have sent paying customers to it.
 *
 * Order matters:
 *   1. NEXT_PUBLIC_SITE_URL — your own domain, always wins.
 *   2. The Vercel production domain, so a deploy is correct before anyone
 *      remembers to set (1).
 *   3. The per-deployment Vercel URL, which is right for a preview build.
 *   4. Localhost, for development.
 *
 * The seeded `site.url` is deliberately NOT a fallback any more. A plausible
 * wrong answer is worse than an obviously wrong one.
 */
export function siteUrl(path = "/"): string {
  const vercelProduction = present(process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL);
  const vercelDeployment = present(process.env.NEXT_PUBLIC_VERCEL_URL);

  const base =
    present(process.env.NEXT_PUBLIC_SITE_URL) ??
    (vercelProduction ? `https://${vercelProduction}` : null) ??
    (vercelDeployment ? `https://${vercelDeployment}` : null) ??
    "http://localhost:3000";

  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}
