import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const recoveryCookie = "ustr-password-recovery";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Enter and confirm your new password." }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Enter and confirm your new password." }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < 8) {
    return NextResponse.json({ error: "Your new password must be at least 8 characters." }, { status: 400 });
  }

  try {
    const cookieStore = await cookies();
    if (cookieStore.get(recoveryCookie)?.value !== "1") {
      return NextResponse.json(
        { error: "This recovery link is not verified or has expired. Request a new one." },
        { status: 401 },
      );
    }

    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      cookieStore.delete(recoveryCookie);
      return NextResponse.json(
        { error: "This recovery link is not valid anymore. Request a new one." },
        { status: 401 },
      );
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return NextResponse.json(
        { error: "Supabase could not update this password. Check the password requirements and try again." },
        { status: error.status === 429 ? 429 : 400 },
      );
    }

    cookieStore.delete(recoveryCookie);
    await supabase.auth.signOut();
    return NextResponse.json({ message: "Password updated. Sign in with your new password." });
  } catch {
    return NextResponse.json(
      { error: "Password recovery is temporarily unavailable. Request a new recovery email and try again." },
      { status: 503 },
    );
  }
}
