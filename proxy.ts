// File: proxy.ts

import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 memakai konvensi file `proxy.ts` (pengganti middleware.ts).
 *
 * Proxy ini:
 * 1. Menandai respons rute admin agar TIDAK disimpan cache (CDN/proxy hosting).
 * 2. Mengarahkan URL yang membawa query ?key=... ke Route Handler /admin/gate/:key
 *    sehingga proses validasi kriptografis dan penulisan cookie aman dilakukan
 *    di runtime Node.js tanpa membebani runtime proxy.
 */
function getPublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ||
    (request.url.startsWith("https") ? "https" : "http");

  if (host && !host.includes("0.0.0.0")) {
    return `${proto}://${host}`;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    return siteUrl.replace(/\/+$/, "");
  }

  return process.env.NODE_ENV === "production"
    ? "https://rohkrissmkpenus.web.id"
    : "http://localhost:3000";
}

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const keyParam = url.searchParams.get("key");

  if (keyParam) {
    const origin = getPublicOrigin(request);
    const gateDestination = new URL(
      `/admin/gate/${encodeURIComponent(keyParam.trim())}`,
      origin,
    );
    return NextResponse.redirect(gateDestination);
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};


