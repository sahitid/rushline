"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const sb = getSupabase();
    try {
      if (mode === "signup") {
        const { error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        // In case email confirmation is on, also sign in immediately for the demo.
        await sb.auth.signInWithPassword({ email, password });
        router.push("/onboarding");
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/clubs");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-6 py-16">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 text-lg font-semibold">
          <span className="inline-block h-3 w-3 rounded-full bg-accent" />
          rushline
        </div>
        <p className="mt-2 text-sm text-muted">
          {mode === "signup"
            ? "Create an account to build your recruiting edge."
            : "Welcome back."}
        </p>
      </div>

      <form onSubmit={submit} className="card space-y-4 p-6">
        <div>
          <label className="mb-1 block text-xs text-muted">Email</label>
          <input
            className="input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@berkeley.edu"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Password</label>
          <input
            className="input"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-sm text-accent">{error}</p>}
        <button
          disabled={loading}
          className="btn-accent w-full py-2.5 text-sm disabled:opacity-60"
        >
          {loading ? "…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === "signup" ? "login" : "signup")}
        className="mt-4 text-center text-sm text-muted hover:text-foreground"
      >
        {mode === "signup"
          ? "Already have an account? Sign in"
          : "New here? Create an account"}
      </button>
    </main>
  );
}
