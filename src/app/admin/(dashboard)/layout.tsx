import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";

export const instant = false;

async function AdminGuard({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-8 text-[#63452f]">Checking admin access…</div>}>
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  );
}
