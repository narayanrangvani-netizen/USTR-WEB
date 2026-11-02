"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export function PasswordRecoveryRequest({ ownerLogin = false }: { ownerLogin?: boolean }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/auth/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ownerLogin }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not request password recovery.");
      setMessage(body.message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not request password recovery.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-stone-200 bg-white p-8 shadow-lg shadow-stone-200/30">
      <p className="text-center text-xl font-black uppercase tracking-[0.24em] text-[#29221d]">USTR SUITS</p>
      <h1 className="mt-4 text-center text-3xl font-semibold uppercase tracking-tight text-[#29221d]">Reset password</h1>
      <p className="mt-2 text-center text-sm text-[#63452f]">Enter your account email and we&apos;ll send a secure recovery link.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#63452f]">Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-stone-300 bg-[#f9f3ee] px-4 py-3"
          />
        </label>
        {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        {message && <p role="status" className="rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">{message}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-[#29221d] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-70"
        >
          {submitting ? "Sending…" : "Send recovery link"}
        </button>
      </form>
      <Link href={ownerLogin ? "/admin/login" : "/account"} className="mt-5 block text-center text-sm text-[#63452f] underline">
        Back to sign in
      </Link>
    </section>
  );
}
