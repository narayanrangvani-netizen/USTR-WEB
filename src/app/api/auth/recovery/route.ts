import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Enter the email address for your account." }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Enter the email address for your account." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const redirectUrl = new URL("/account/reset-password", request.url);
    if (body.ownerLogin === true) redirectUrl.searchParams.set("next", "admin");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl.toString(),
    });

    if (error) {
      if (error.status === 429 || ("code" in error && error.code === "over_email_send_rate_limit")) {
        return NextResponse.json(
          { error: "Too many recovery emails were requested. Wait a few minutes before trying again." },
          { status: 429 },
        );
      }
      return NextResponse.json(
        { error: "We could not send a recovery email right now. Check the Supabase Auth email settings and try again." },
        { status: 503 },
      );
    }

    return NextResponse.json({
      message: "If an account exists for that email, a password recovery link will be sent. Check your inbox and spam folder.",
    });
  } catch (error) {
    const configMessage = error instanceof Error && error.message.startsWith("Supabase configuration error:")
      ? error.message
      : null;
    return NextResponse.json({
      error: configMessage ?? "Password recovery is temporarily unavailable. Check the Supabase Auth configuration and try again.",
    }, { status: 503 });
  }
}
