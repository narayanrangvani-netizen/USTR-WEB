import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies; route handlers can.
        }
      },
    },
  });
}

export function getSupabaseServiceClient() {
  const { url, serviceRoleKey } = getSupabaseEnv();
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getCurrentStoreUser() {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    const code = "code" in error ? error.code : undefined;
    if (
      error.name === "AuthSessionMissingError" ||
      code === "session_not_found" ||
      code === "bad_jwt" ||
      code === "invalid_token"
    ) return null;
    console.error("[auth.session] Session verification failed", {
      code: code ?? "unknown",
      status: error.status ?? null,
    });
    throw new Error("Could not verify the sign-in session.");
  }
  if (!user) return null;

  const service = getSupabaseServiceClient();
  const { data: profile, error: profileError } = await service
    .from("store_profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[auth.session] Owner profile lookup failed", { code: profileError.code ?? "unknown" });
    throw new Error("Could not read the store account profile.");
  }
  return profile ? { user, profile } : null;
}

export async function requireStoreOwner() {
  try {
    const current = await getCurrentStoreUser();
    if (!current) return { response: Response.json({ error: "Sign in required." }, { status: 401 }) };
    if (current.profile.role !== "owner") {
      return { response: Response.json({ error: "Owner access required." }, { status: 403 }) };
    }
    return { current, service: getSupabaseServiceClient() };
  } catch (error) {
    console.error("[auth.owner] Store access check failed", {
      kind: error instanceof Error ? error.name : "unknown",
    });
    return { response: Response.json({ error: "Store access is temporarily unavailable." }, { status: 503 }) };
  }
}
