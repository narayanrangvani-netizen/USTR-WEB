"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

type StoreUser = { id: string; email: string; fullName: string | null; role: "customer" | "owner" };

export function AccountPanel({ ownerOnly = false }: { ownerOnly?: boolean }) {
  const router = useRouter();
  const [user, setUser] = useState<StoreUser | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timeout = window.setTimeout(() => setResendCooldown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timeout);
  }, [resendCooldown]);

  async function loadUser(): Promise<StoreUser | null> {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Could not check your account.");
    const currentUser = body.user as StoreUser | null;
    setUser(currentUser);
    return currentUser;
  }

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Could not check your account.");
        setUser(body.user);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not check your account."))
      .finally(() => setLoading(false));
  }, []);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, mode, ownerLogin: ownerOnly }),
      });
      const body = await response.json();
      if (!response.ok) {
        if (response.status === 429) setResendCooldown(60);
        throw new Error(body.error ?? "Could not send a sign-in code.");
      }
      setStep("verify");
      setToken("");
      setResendCooldown(60);
      setMessage(body.message ?? "If this email can sign in here, a one-time code will be sent. Check your inbox and spam folder.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not send a sign-in code.");
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, ownerLogin: ownerOnly }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not verify the code.");
      const currentUser = await loadUser();
      if (!currentUser) {
        throw new Error("The code was accepted, but the signed-in account could not be verified. Try again.");
      }
      if (ownerOnly && currentUser.role !== "owner") {
        setUser(null);
        throw new Error("This account does not have owner access. The store administrator must authorize its owner role in Supabase.");
      }
      router.push(ownerOnly ? "/admin" : "/");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not verify the code.");
    } finally {
      setSubmitting(false);
    }
  }

  async function resendCode() {
    if (resendCooldown > 0 || submitting) return;
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, mode, ownerLogin: ownerOnly }),
      });
      const body = await response.json();
      if (!response.ok) {
        if (response.status === 429) setResendCooldown(60);
        throw new Error(body.error ?? "Could not resend a sign-in code.");
      }
      setToken("");
      setResendCooldown(60);
      setMessage(body.message ?? "If this email can sign in here, a one-time code will be sent. Check your inbox and spam folder.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not resend a sign-in code.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not sign out.");
      setUser(null);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign out.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="p-8 text-center text-[#63452f]">Checking your account…</p>;

  if (user && (!ownerOnly || user.role === "owner")) {
    return (
      <div className="rounded-[28px] border border-stone-200 bg-[#f9f3ee] p-8 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Signed in</p>
        <h1 className="mt-4 text-3xl font-semibold uppercase text-[#29221d]">{user.fullName || user.email}</h1>
        <p className="mt-2 text-[#63452f]">{user.email}</p>
        {user.role === "owner" && <Link href="/admin" className="mt-6 inline-block rounded-full bg-[#29221d] px-6 py-3 text-sm font-semibold uppercase text-white">Owner dashboard</Link>}
        {!ownerOnly && <Link href="/cart" className="mt-6 inline-block rounded-full bg-[#29221d] px-6 py-3 text-sm font-semibold uppercase text-white">Go to cart</Link>}
        <button onClick={() => void handleLogout()} disabled={submitting} className="mt-6 block w-full rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold uppercase text-[#29221d]">Sign out</button>
        {error && <p role="alert" className="mt-4 text-sm text-red-800">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-stone-200 bg-white p-8 shadow-lg shadow-stone-200/30">
      <div className="text-center">
        <div className="text-xl font-black uppercase tracking-[0.24em] text-[#29221d]">USTR SUITS</div>
        <h1 className="mt-4 text-3xl font-semibold uppercase tracking-tight text-[#29221d]">{ownerOnly ? "Owner access" : mode === "signup" ? "Create account" : "Your account"}</h1>
        <p className="mt-2 text-sm text-[#63452f]">{step === "verify" ? `Enter the one-time code sent to ${email}.` : ownerOnly ? "Enter the email address for your authorized owner account." : "Sign in or create an account using a one-time email code."}</p>
      </div>
      {step === "request" ? (
      <form onSubmit={requestCode} className="mt-8 space-y-5">
        {mode === "signup" && !ownerOnly && <label className="block"><span className="mb-2 block text-sm font-medium text-[#63452f]">Full name</span><input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" className="w-full rounded-2xl border border-stone-300 bg-[#f9f3ee] px-4 py-3" minLength={2} maxLength={120} required /></label>}
        <label className="block"><span className="mb-2 block text-sm font-medium text-[#63452f]">Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="w-full rounded-2xl border border-stone-300 bg-[#f9f3ee] px-4 py-3" maxLength={320} required /></label>
        {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        {message && <p role="status" className="rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">{message}</p>}
        <button type="submit" disabled={submitting} className="w-full rounded-full bg-[#29221d] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-70">{submitting ? "Sending code…" : mode === "signup" && !ownerOnly ? "Create account with email code" : "Send sign-in code"}</button>
      </form>
      ) : (
      <form onSubmit={verifyCode} className="mt-8 space-y-5">
        <label className="block"><span className="mb-2 block text-sm font-medium text-[#63452f]">6-digit email code</span><input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={token} onChange={(event) => setToken(event.target.value.replace(/\D/g, "").slice(0, 6))} className="w-full rounded-2xl border border-stone-300 bg-[#f9f3ee] px-4 py-3 text-center text-2xl tracking-[0.5em]" required /></label>
        {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        {message && <p role="status" className="rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">{message}</p>}
        <button type="submit" disabled={submitting || token.length !== 6} className="w-full rounded-full bg-[#29221d] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-70">{submitting ? "Verifying…" : "Verify code"}</button>
        <button type="button" onClick={() => void resendCode()} disabled={submitting || resendCooldown > 0} className="w-full text-center text-sm text-[#63452f] underline disabled:opacity-60">{resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}</button>
        <button type="button" onClick={() => { setStep("request"); setToken(""); setError(""); setMessage(""); }} className="w-full text-center text-sm text-[#63452f] underline">Change email address</button>
      </form>
      )}
      {!ownerOnly && step === "request" && <button onClick={() => { setError(""); setMessage(""); setMode(mode === "login" ? "signup" : "login"); }} className="mt-5 w-full text-center text-sm text-[#63452f] underline">{mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}</button>}
      {!ownerOnly && <Link href="/men" className="mt-5 block text-center text-sm text-[#63452f]">Continue shopping</Link>}
    </div>
  );
}
