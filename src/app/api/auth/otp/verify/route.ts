import { NextResponse } from "next/server";
import type { AuthError } from "@supabase/supabase-js";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function clearSession(supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>) {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) {
    console.error("[auth.otp] Could not clear a non-owner session", {
      code: "code" in error ? error.code ?? "unknown" : "unknown",
    });
  }
}

function getVerificationError(error: AuthError) {
  const code = "code" in error ? error.code : undefined;
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit" || error.status === 429) {
    return { status: 429, message: "Too many code attempts. Wait a few minutes before trying again." };
  }
  if (code === "otp_expired" || code === "invalid_credentials" || code === "user_not_found") {
    return { status: 400, message: "That code is invalid or expired. Check it or request a new code." };
  }
  return { status: 503, message: "We could not verify the code right now. Try again shortly." };
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Enter the email address and one-time code." }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Enter the email address and one-time code." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const ownerLogin = body.ownerLogin === true;
  if (!emailPattern.test(email) || email.length > 320 || !/^\d{6}$/.test(token)) {
    return NextResponse.json({ error: "Enter a valid email address and the 6-digit code from your email." }, { status: 400 });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error) {
      const result = getVerificationError(error);
      return NextResponse.json({ error: result.message }, { status: result.status });
    }
    if (!data.user || !data.session) {
      return NextResponse.json({ error: "The code could not establish a sign-in session. Request a new code." }, { status: 503 });
    }
    if (ownerLogin) {
      const { data: profile, error: profileError } = await getSupabaseServiceClient()
        .from("store_profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profileError) {
        console.error("[auth.otp] Owner role check failed", { code: profileError.code ?? "unknown" });
        await clearSession(supabase);
        return NextResponse.json({ error: "Owner access could not be verified. Try again shortly." }, { status: 503 });
      }
      if (profile?.role !== "owner") {
        await clearSession(supabase);
        return NextResponse.json({ error: "This account does not have owner access. Ask the store administrator to authorize its owner role." }, { status: 403 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Email sign-in is temporarily unavailable. Try again shortly." }, { status: 503 });
  }
}
