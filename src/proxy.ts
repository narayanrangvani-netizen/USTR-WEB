import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
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
  matcher: "/",
};
