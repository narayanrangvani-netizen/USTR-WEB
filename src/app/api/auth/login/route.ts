import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });

    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });

    return NextResponse.json({ user: { id: data.user.id, email: data.user.email } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not sign in.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
