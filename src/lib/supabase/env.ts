import "server-only";

function isPrivilegedApiKey(key: string) {
  if (key.startsWith("sb_secret_")) return true;
  const [header, payload] = key.split(".");
  if (!header || !payload) return false;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { role?: unknown };
    return claims.role === "service_role";
  } catch {
    return false;
  }
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_APIKEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKeyVariable = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    : "SUPABASE_APIKEY";

  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL), NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_APIKEY), and SUPABASE_SERVICE_ROLE_KEY in the deployment environment.",
    );
  }
  if (anonKey === serviceRoleKey || isPrivilegedApiKey(anonKey)) {
    throw new Error(
      `Supabase configuration error: ${anonKeyVariable} must contain the anon/publishable key, not the service-role/secret key. Keep the service-role key only in SUPABASE_SERVICE_ROLE_KEY.`,
    );
  }

  return { url, anonKey, serviceRoleKey };
}
