import { NextResponse } from "next/server";
import { getCurrentStoreUser } from "@/lib/supabase/server";

export async function GET() {
  try {
    const current = await getCurrentStoreUser();
    if (!current) return NextResponse.json({ user: null });
    return NextResponse.json({
      user: {
        id: current.user.id,
        email: current.profile.email,
        fullName: current.profile.full_name,
        role: current.profile.role,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not check the current session.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
