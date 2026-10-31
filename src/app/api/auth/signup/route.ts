import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (fullName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
      return NextResponse.json({ error: "Enter your name, a valid email, and a password of at least 8 characters." }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data.user) return NextResponse.json({ error: "Account was created, but Supabase did not return a user. Please try signing in." }, { status: 400 });
    if (!data.session) {
      return NextResponse.json({ message: "Account created. Check your email to confirm it, then sign in.", needsEmailConfirmation: true });
    }
    return NextResponse.json({ message: "Account created and signed in.", user: { id: data.user.id, email: data.user.email } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create your account.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
