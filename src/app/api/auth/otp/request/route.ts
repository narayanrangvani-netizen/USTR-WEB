import { NextResponse } from "next/server";
import type { AuthError } from "@supabase/supabase-js";
import { getAuthSiteOrigin } from "@/lib/auth-site-url";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getRequestError(error: AuthError) {
  const code = "code" in error ? error.code : undefined;
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || error.status === 429) {
    return { status: 429, message: "Too many code requests. Wait a minute before requesting another code." };
  }
  if (code === "email_address_invalid") {
    return { status: 400, message: "That email address is not accepted. Check its spelling and try again." };
  }
  if (code === "email_address_not_authorized") {
    return { status: 503, message: "Email sending is not configured for this address. Check the Supabase Auth email provider and SMTP settings." };
  }
  if (code === "email_provider_disabled" || code === "signup_disabled") {
    return { status: 503, message: "Email sign-in is temporarily unavailable. Check the Supabase Auth email provider settings." };
  }
  return { status: 503, message: "We could not send a sign-in code right now. Check the Supabase Auth email settings and try again." };
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const ownerLogin = body.ownerLogin === true;
  const mode = body.mode === "signup" ? "signup" : body.mode === "login" ? "login" : null;
  if (!emailPattern.test(email) || email.length > 320 || !mode) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (ownerLogin && mode !== "login") {
    return NextResponse.json({ error: "Owner sign-in only supports existing accounts." }, { status: 400 });
  }
  if (!ownerLogin && mode === "signup" && (fullName.length < 2 || fullName.length > 120)) {
    return NextResponse.json({ error: "Enter a name between 2 and 120 characters." }, { status: 400 });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const redirectUrl = new URL(ownerLogin ? "/admin/login" : "/account", getAuthSiteOrigin(request.url));
    const options = {
      emailRedirectTo: redirectUrl.toString(),
      shouldCreateUser: !ownerLogin && mode === "signup",
      ...(!ownerLogin && mode === "signup" ? { data: { full_name: fullName } } : {}),
    };
    let { error } = await supabase.auth.signInWithOtp({
      email,
      options,
    });

    const code = error && "code" in error ? error.code : undefined;
    if (!ownerLogin && mode === "signup" && (code === "user_already_exists" || code === "email_exists")) {
      ({ error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectUrl.toString(), shouldCreateUser: false },
      }));
    }

    if (error) {
      const errorCode = "code" in error ? error.code : undefined;
      if (errorCode === "user_not_found") {
        return NextResponse.json({
          message: "If this email can sign in here, a one-time code will be sent. Check your inbox and spam folder.",
        });
      }
      const result = getRequestError(error);
      return NextResponse.json({ error: result.message }, { status: result.status });
    }

    return NextResponse.json({
      message: "If this email can sign in here, a one-time code will be sent. Check your inbox and spam folder.",
    });
  } catch (error) {
    const configMessage = error instanceof Error && error.message.startsWith("Supabase configuration error:")
      ? error.message
      : null;
    return NextResponse.json({
      error: configMessage ?? "Email sign-in is temporarily unavailable. Check the Supabase Auth configuration and try again.",
    }, { status: 503 });
  }
}
