import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, signAdminSession, verifySessionValue } from "@/lib/admin-session";

export { ADMIN_SESSION_COOKIE, signAdminSession, verifySessionValue } from "@/lib/admin-session";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "ustr-admin";

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifySessionValue(session);
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}
