import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const recoveryCookie = "ustr-password-recovery";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "This recovery link is invalid or expired. Request a new one." }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "This recovery link is invalid or expired. Request a new one." }, { status: 400 });
  }

  try {
    const supabase = await getSupabaseServerClient();
    let error: Error | null = null;
    const code = typeof body.code === "string" ? body.code : "";
    const accessToken = typeof body.accessToken === "string" ? body.accessToken : "";
    const refreshToken = typeof body.refreshToken === "string" ? body.refreshToken : "";
    const tokenHash = typeof body.tokenHash === "string" ? body.tokenHash : "";

    if (code) {
      ({ error } = await supabase.auth.exchangeCodeForSession(code));
    } else if (accessToken && refreshToken) {
      ({ error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }));
    } else if (tokenHash && body.type === "recovery") {
      ({ error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      }));
    } else {
      return NextResponse.json({ error: "This recovery link is invalid or expired. Request a new one." }, { status: 400 });
    }

    if (error) {
      return NextResponse.json(
        { error: "This recovery link is invalid or expired. Request a new password recovery email." },
        { status: 400 },
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: "We could not verify this recovery link. Request a new password recovery email." },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(recoveryCookie, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 10 * 60,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "We could not verify this recovery link. Request a new password recovery email." },
      { status: 400 },
    );
  }
}
