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

  if (error || !user) return null;

  const service = getSupabaseServiceClient();
  const { data: profile, error: profileError } = await service
    .from("store_profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw new Error(`Could not read account profile: ${profileError.message}`);
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
    const message = error instanceof Error ? error.message : "Store database configuration is unavailable.";
    return { response: Response.json({ error: message }, { status: 503 }) };
  }
}
