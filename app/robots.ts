import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/utils/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Never index the admin area, the customer account area, or filtered
        // catalogue permutations — they are duplicate content.
        disallow: ["/admin", "/account", "/api/", "/*?*sort=", "/*?*page="],
      },
    ],
    sitemap: siteUrl("/sitemap.xml"),
    host: siteUrl(),
  };
}
