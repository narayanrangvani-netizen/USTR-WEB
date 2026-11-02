"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

type RecoveryPayload =
  | { code: string }
  | { accessToken: string; refreshToken: string }
  | { tokenHash: string; type: "recovery" };

export function PasswordResetForm({ ownerLogin = false }: { ownerLogin?: boolean }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const loginUrl = ownerLogin ? "/admin/login" : "/account";

  useEffect(() => {
    let active = true;
    async function verifyRecoveryLink() {
      const currentUrl = new URL(window.location.href);
      const params = new URLSearchParams(currentUrl.hash.slice(1));
      const urlError = currentUrl.searchParams.get("error_description")
        ?? params.get("error_description");
      const recoveryType = currentUrl.searchParams.get("type") ?? params.get("type");
      const code = currentUrl.searchParams.get("code");
      const tokenHash = currentUrl.searchParams.get("token_hash");
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      window.history.replaceState(null, "", currentUrl.pathname);

      if (urlError) {
        throw new Error("This recovery link is invalid or expired. Request a new password recovery email.");
      }

      let payload: RecoveryPayload | null = null;
      if (code) payload = { code };
      else if (tokenHash && recoveryType === "recovery") payload = { tokenHash, type: "recovery" };
      else if (accessToken && refreshToken && recoveryType === "recovery") {
        payload = { accessToken, refreshToken };
      }

      if (!payload) {
        throw new Error("No valid recovery link was found. Request a new password recovery email.");
      }

      const response = await fetch("/api/auth/recovery/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "This recovery link is invalid or expired.");
      if (active) setReady(true);
    }

    void verifyRecoveryLink().catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "This recovery link is invalid or expired.");
    });

    return () => { active = false; };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      if (password.length < 8) throw new Error("Your new password must be at least 8 characters.");
      if (password !== confirmPassword) throw new Error("The passwords do not match.");
      const response = await fetch("/api/auth/recovery/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not update your password.");
      setMessage(body.message);
      setPassword("");
      setConfirmPassword("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update your password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-stone-200 bg-white p-8 shadow-lg shadow-stone-200/30">
      <p className="text-center text-xl font-black uppercase tracking-[0.24em] text-[#29221d]">USTR SUITS</p>
      <h1 className="mt-4 text-center text-3xl font-semibold uppercase tracking-tight text-[#29221d]">Choose a new password</h1>
      <p className="mt-2 text-center text-sm text-[#63452f]">Your account role and store access will not change.</p>
      {!ready && !error && <p role="status" className="mt-8 text-center text-sm text-[#63452f]">Verifying your secure recovery link…</p>}
      {ready && !message && (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#63452f]">New password</span>
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-stone-300 bg-[#f9f3ee] px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#63452f]">Confirm new password</span>
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-2xl border border-stone-300 bg-[#f9f3ee] px-4 py-3"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[#29221d] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-70"
          >
            {submitting ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
      {error && <p role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      {message && <p role="status" className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">{message}</p>}
      {(error || message) && (
        <Link href={loginUrl} className="mt-5 block text-center text-sm text-[#63452f] underline">
          {message ? "Continue to sign in" : "Back to sign in"}
        </Link>
      )}
    </section>
  );
}
