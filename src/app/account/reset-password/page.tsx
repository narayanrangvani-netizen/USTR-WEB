import { PasswordResetForm } from "@/components/auth/PasswordResetForm";

export const instant = false;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f2e9dd] px-4 py-10">
      <div className="w-full max-w-md">
        <PasswordResetForm ownerLogin={next === "admin"} />
      </div>
    </main>
  );
}
