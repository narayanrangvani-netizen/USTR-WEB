import { redirect } from "next/navigation";
import { getCurrentStoreUser } from "@/lib/supabase/server";

export async function requireAdmin() {
  const current = await getCurrentStoreUser();
  if (!current) redirect("/admin/login");
  if (current.profile.role !== "owner") redirect("/account");
}
