import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Panel admin tidak boleh diindeks.
        disallow: ["/admin", "/admin/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
