import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Panel admin & tautan rahasia ubah jawaban tidak boleh diindeks.
        disallow: ["/admin", "/admin/", "/kegiatan/*/daftar/ubah/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
