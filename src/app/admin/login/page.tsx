import { AccountPanel } from "@/components/auth/AccountPanel";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f2e9dd] px-4 py-10">
      <div className="w-full max-w-md"><AccountPanel ownerOnly /></div>
    </div>
  );
}
