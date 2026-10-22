// File: app/admin/gate/[key]/route.ts

import { NextResponse, type NextRequest } from "next/server";

import {
  GATE_COOKIE_MAX_AGE,
  GATE_COOKIE_NAME,
  hashGateKey,
  isGateKeyValid,
} from "@/lib/auth/gate-crypto";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const origin = getPublicOrigin(request);

  try {
    const { key } = await params;
    const decodedKey = key ? decodeURIComponent(key) : "";

    if (!isGateKeyValid(decodedKey)) {
      return NextResponse.redirect(new URL("/", origin));
    }

    const destination = new URL("/admin/login", origin);
    const response = NextResponse.redirect(destination);
    response.cookies.set(GATE_COOKIE_NAME, hashGateKey(decodedKey), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: GATE_COOKIE_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("Gagal memproses gerbang admin:", error);
    return NextResponse.redirect(new URL("/", origin));
  }
}


