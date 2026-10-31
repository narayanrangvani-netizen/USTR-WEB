import { NextResponse } from "next/server";
import { ADMIN_PASSWORD, ADMIN_SESSION_COOKIE, signAdminSession } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const password = body.password;

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, message: "Unauthorized admin access" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: await signAdminSession(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
