import type { MetadataRoute } from "next";

import { getPublishedEventSlugs, getPublishedNewsSlugs } from "@/lib/data/public";
import { getSiteUrl } from "@/lib/env";

export const revalidate = 3600;

/**
 * Sitemap hanya memuat konten PUBLISHED.
 * Halaman admin dan konten draft tidak pernah masuk (PRD §12 SEO).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();

  const halamanStatis: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/kegiatan`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/jadwal`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/dokumentasi`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/berita`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/tentang`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/kontak`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/privasi`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const [events, news] = await Promise.all([
    getPublishedEventSlugs(),
    getPublishedNewsSlugs(),
  ]);

  const halamanEvent: MetadataRoute.Sitemap = events.map((item) => ({
    url: `${base}/kegiatan/${item.slug}`,
    lastModified: new Date(item.updated_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const halamanBerita: MetadataRoute.Sitemap = news.map((item) => ({
    url: `${base}/berita/${item.slug}`,
    lastModified: new Date(item.updated_at),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...halamanStatis, ...halamanEvent, ...halamanBerita];
}
