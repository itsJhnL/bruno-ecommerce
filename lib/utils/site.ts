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

/** Absolute site URL, used for canonicals, OG tags, sitemap and JSON-LD. */
export function siteUrl(path = "/"): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    String(settings["site.url"] ?? "http://localhost:3000").replace(/\/$/, "");
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}
