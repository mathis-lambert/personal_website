import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/** A `public/robots.txt` would shadow this route, so the two cannot coexist. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
