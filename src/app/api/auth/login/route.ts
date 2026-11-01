import { NextResponse } from "next/server";
import type { AuthError } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function getLoginError(error: AuthError) {
  const code = "code" in error ? error.code : undefined;
  if (code === "email_not_confirmed") {
    return "Please confirm your email using the link we sent you, then sign in.";
  }
  if (code === "invalid_credentials" || code === "user_not_found") {
    return "Email or password is incorrect. Check both fields, or create an account if you have not signed up yet.";
  }
  if (code === "over_request_rate_limit" || error.status === 429) {
    return "Too many sign-in attempts. Please wait a few minutes and try again.";
  }
  if (code === "email_address_invalid") {
    return "That email address is not accepted. Check the spelling and try again.";
  }
  return "We could not sign you in right now. Check your Supabase Auth email/password settings and try again.";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  try {
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
      return NextResponse.json({ error: "Enter a valid email address and your password." }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const code = "code" in error ? error.code : undefined;
      const status = code === "email_not_confirmed" ? 403 : error.status === 429 ? 429 : 401;
      return NextResponse.json({ error: getLoginError(error) }, { status });
    }
    if (!data.user) {
      return NextResponse.json({ error: "Sign-in did not return an account. Please try again." }, { status: 401 });
    }

    return NextResponse.json({ user: { id: data.user.id, email: data.user.email } });
  } catch (error) {
    const configMessage = error instanceof Error && error.message.startsWith("Supabase configuration error:")
      ? error.message
      : null;
    return NextResponse.json({
      error: configMessage ?? "Sign-in is temporarily unavailable. Verify that SUPABASE_URL and SUPABASE_APIKEY use your project URL and anon/publishable key, and that the server-side service key is configured.",
    }, { status: 503 });
  }
}
