import { NextResponse } from "next/server";
import type { AuthError } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function getLoginError(error: AuthError) {
  const code = "code" in error ? error.code : undefined;
  if (code === "invalid_credentials" || code === "user_not_found") {
    return "Email or password is incorrect. Check both fields, or create an account if you have not signed up yet.";
  }
  if (code === "email_not_confirmed" || code === "user_banned") {
    return "Sign-in is unavailable. Please contact the store owner.";
  }
  if (code === "over_request_rate_limit" || error.status === 429) {
    return "Too many sign-in attempts. Please wait a few minutes and try again.";
  }
  if (code === "email_address_invalid") {
    return "That email address is not accepted. Check the spelling and try again.";
  }
  return "Sign-in is temporarily unavailable. Please try again later.";
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
      const expectedRejection =
        code === "invalid_credentials" || code === "user_not_found";
      const status = code === "over_request_rate_limit" || error.status === 429
        ? 429
        : code === "email_not_confirmed" || code === "user_banned"
          ? 403
        : code === "email_address_invalid"
          ? 400
        : expectedRejection
          ? 401
          : error.name === "AuthRetryableFetchError" || (error.status !== undefined && error.status >= 500)
            ? 503
            : 500;
      console.warn("[auth.login] Supabase sign-in rejected", { code: code ?? "unknown", status });
      return NextResponse.json({ error: getLoginError(error) }, { status });
    }
    if (!data.user || !data.session) {
      console.error("[auth.login] Sign-in returned no authenticated session");
      return NextResponse.json({ error: "Sign-in could not establish a session. Please try again." }, { status: 503 });
    }

    return NextResponse.json({ user: { id: data.user.id, email: data.user.email } });
  } catch (error) {
    const configError = error instanceof Error && error.message.startsWith("Supabase");
    console.error("[auth.login] Sign-in request failed", {
      kind: configError ? "configuration" : error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.json(
      { error: "Sign-in is temporarily unavailable. Verify that the Supabase project URL, anon/publishable key, and server-side service key are configured, then try again." },
      { status: 503 },
    );
  }
}
