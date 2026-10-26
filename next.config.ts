import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hasil build mandiri (.next/standalone/server.js) untuk hosting cPanel
  // "Setup Node.js App" — tidak perlu node_modules lengkap di server.
  output: "standalone",
  // Driver MySQL dimuat langsung dari node_modules, tidak di-bundle.
  serverExternalPackages: ["mysql2", "nodemailer"],
  experimental: {
    serverActions: {
      // Unggahan poster/foto hingga 5 MB (lib/validation/schemas.ts) +
      // ruang untuk overhead multipart. Bawaan Next.js hanya 1 MB.
      bodySizeLimit: "6mb",
    },
  },
  images: {
    // Optimizer gambar HANYA untuk unggahan lokal. URL https eksternal yang
    // ditempel admin dirender `unoptimized` (lihat lib/images.ts), sehingga
    // server tidak bisa dipakai sebagai proxy/pengolah gambar milik orang lain.
    remotePatterns: [],
    localPatterns: [{ pathname: "/uploads/**", search: "" }],
    maximumResponseBody: 10_000_000,
    maximumDiskCacheSize: 300_000_000,
  },
  // Jangan bocorkan versi Next.js lewat header response.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
