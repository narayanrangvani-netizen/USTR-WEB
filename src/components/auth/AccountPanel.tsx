"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

type StoreUser = { id: string; email: string; fullName: string | null; role: "customer" | "owner" };

export function AccountPanel({ ownerOnly = false }: { ownerOnly?: boolean }) {
  const router = useRouter();
  const [user, setUser] = useState<StoreUser | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadUser() {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Could not check your account.");
    setUser(body.user);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/auth/${mode === "signup" ? "signup" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Account request failed.");
      if (body.needsEmailConfirmation) {
        setMessage(body.message);
        setMode("login");
        return;
      }
      if (mode === "signup") setMessage(body.message);
      await loadUser();
      const sessionResponse = await fetch("/api/auth/me", { cache: "no-store" });
      const sessionBody = await sessionResponse.json();
      if (ownerOnly && sessionBody.user?.role !== "owner") {
        setUser(null);
        throw new Error("This account is not an owner account. Ask the store owner to grant owner access in Supabase.");
      }
      router.push(ownerOnly ? "/admin" : "/");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Account request failed.");
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
        <p className="mt-2 text-sm text-[#63452f]">{ownerOnly ? "Sign in with the store owner account." : "Sign in to place orders and keep your details ready."}</p>
      </div>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {mode === "signup" && !ownerOnly && <label className="block"><span className="mb-2 block text-sm font-medium text-[#63452f]">Full name</span><input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" className="w-full rounded-2xl border border-stone-300 bg-[#f9f3ee] px-4 py-3" minLength={2} required /></label>}
        <label className="block"><span className="mb-2 block text-sm font-medium text-[#63452f]">Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="w-full rounded-2xl border border-stone-300 bg-[#f9f3ee] px-4 py-3" required /></label>
        <label className="block"><span className="mb-2 block text-sm font-medium text-[#63452f]">Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} className="w-full rounded-2xl border border-stone-300 bg-[#f9f3ee] px-4 py-3" minLength={mode === "signup" ? 8 : undefined} required /></label>
        {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        {message && <p role="status" className="rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">{message}</p>}
        <button type="submit" disabled={submitting} className="w-full rounded-full bg-[#29221d] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-70">{submitting ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}</button>
      </form>
      {mode === "login" && <Link href={ownerOnly ? "/account/forgot-password?next=admin" : "/account/forgot-password"} className="mt-4 block text-center text-sm text-[#63452f] underline">Forgot your password?</Link>}
      {!ownerOnly && <button onClick={() => { setError(""); setMessage(""); setMode(mode === "login" ? "signup" : "login"); }} className="mt-5 w-full text-center text-sm text-[#63452f] underline">{mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}</button>}
      {!ownerOnly && <Link href="/men" className="mt-5 block text-center text-sm text-[#63452f]">Continue shopping</Link>}
    </div>
  );
}
