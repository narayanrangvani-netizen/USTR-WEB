"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        throw new Error("Invalid admin password");
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Invalid admin password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f2e9dd] px-4">
      <div className="w-full max-w-md rounded-[28px] border border-stone-200 bg-white p-8 shadow-lg shadow-stone-200/40">
        <div className="text-center">
          <div className="text-xl font-black uppercase tracking-[0.24em] text-[#29221d]">USTR SUITS</div>
          <h1 className="mt-4 text-3xl font-semibold uppercase tracking-tight text-[#29221d]">Owner access</h1>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#63452f]">Admin password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-stone-300 bg-[#f9f3ee] px-4 py-3 text-[#29221d] outline-none focus:border-[#63452f]"
              placeholder="Enter password"
              required
            />
          </label>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <button type="submit" disabled={loading} className="w-full rounded-full bg-[#29221d] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-70">
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
