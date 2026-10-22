// File: app/layout.tsx

import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";

import { getSiteUrl } from "@/lib/env";

import "./globals.css";

// Poppins — geometris dan tegas; dipakai untuk judul maupun isi.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const SITE_URL = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Rohkris SMK Penus — Rohani Kristen SMK Plus Pelita Nusantara",
    template: "%s — Rohkris SMK Penus",
  },
  description:
    "Situs resmi Rohkris SMK Penus (Rohani Kristen SMK Plus Pelita Nusantara). Informasi lengkap jadwal ibadah, persekutuan doa, perayaan Natal, Paskah, retreat, dokumentasi, dan warta kegiatan siswa.",
  keywords: [
    "rohkris smk penus",
    "rohkris penus",
    "rohani kristen smk penus",
    "rohkris smk plus pelita nusantara",
    "smk penus",
    "smk plus pelita nusantara",
    "smk penus bogor",
    "smk penus cibinong",
    "jadwal ibadah rohkris penus",
    "kegiatan rohkris smk penus",
  ],
  authors: [{ name: "Rohkris SMK Penus", url: SITE_URL }],
  creator: "Rohkris SMK Penus",
  publisher: "SMK Plus Pelita Nusantara",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon.png?v=2", type: "image/png", sizes: "32x32" },
      { url: "/favicon.ico?v=2", sizes: "any" },
    ],
    shortcut: ["/favicon.ico?v=2"],
    apple: [
      { url: "/apple-icon.png?v=2", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "Rohkris SMK Penus",
    title: "Rohkris SMK Penus — Rohani Kristen SMK Plus Pelita Nusantara",
    description:
      "Situs resmi Rohkris SMK Penus (Rohani Kristen SMK Plus Pelita Nusantara). Informasi lengkap jadwal ibadah, persekutuan doa, perayaan Natal, Paskah, retreat, dan dokumentasi kegiatan.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rohkris SMK Penus — Rohani Kristen SMK Plus Pelita Nusantara",
    description:
      "Situs resmi Rohkris SMK Penus (Rohani Kristen SMK Plus Pelita Nusantara). Pusat informasi kegiatan rohani siswa.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "BpPAxO31Xed0nwf_d8nY3P9_lewbmbwgPK_AhoW95mU",
  },
};

export const viewport: Viewport = {
  themeColor: "#f3f3f1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": `${SITE_URL}/#organization`,
        name: "Rohkris SMK Penus",
        alternateName: [
          "Rohkris Penus",
          "Rohani Kristen SMK Penus",
          "Rohani Kristen SMK Plus Pelita Nusantara",
          "Rohkris Pelita Nusantara",
          "SMK Penus Rohkris",
        ],
        url: SITE_URL,
        description:
          "Wadah pembinaan iman, persekutuan, dan pelayanan Rohani Kristen bagi siswa-siswi SMK Plus Pelita Nusantara (SMK Penus).",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Cibinong",
          addressRegion: "Jawa Barat",
          addressCountry: "ID",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Rohkris SMK Penus",
        alternateName: "Website Resmi Rohkris SMK Penus",
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
        inLanguage: "id-ID",
      },
    ],
  };

  return (
    <html lang="id" className={poppins.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
