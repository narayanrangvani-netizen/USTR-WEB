import { NextResponse, type NextRequest } from "next/server";
import { getAuthSiteOrigin } from "@/lib/auth-site-url";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/account/forgot-password") {
    const canonicalOrigin = getAuthSiteOrigin(request.url);
    if (request.nextUrl.origin !== canonicalOrigin) {
      const canonicalUrl = new URL("/account/forgot-password", canonicalOrigin);
      if (request.nextUrl.searchParams.get("next") === "admin") {
        canonicalUrl.searchParams.set("next", "admin");
      }
      return NextResponse.redirect(canonicalUrl);
    }
    return NextResponse.next();
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.next();

  const resetUrl = request.nextUrl.clone();
  resetUrl.pathname = "/account/reset-password";
  resetUrl.search = "";
  resetUrl.searchParams.set("code", code);
  if (request.nextUrl.searchParams.get("next") === "admin") {
    resetUrl.searchParams.set("next", "admin");
  }

  return NextResponse.redirect(resetUrl);
}

export const config = {
  matcher: ["/", "/account/forgot-password"],
};
