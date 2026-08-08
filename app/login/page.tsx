"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabase } from "@/lib/supabase";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 10,
  border: "1.5px solid #E8E8E3",
  fontSize: 14,
  outline: "none",
  background: "#FAFAF7",
  color: "#0F0F0E",
  fontFamily: "'Inter', sans-serif",
};

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
    <main
      style={{
        minHeight: "100vh",
        background: "#FAFAF7",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      {/* Logo top-left */}
      <div style={{ position: "fixed", top: 24, left: 32, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 26, height: 26, background: "#3B3BFF", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
          </svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#0F0F0E", letterSpacing: "-0.02em" }}>
          rushline
        </span>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#FFFFFF",
          borderRadius: 20,
          border: "1px solid #E8E8E3",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          padding: "40px 44px 36px",
        }}
      >
        <h1
          style={{
            fontFamily: "'Newsreader', serif",
            fontSize: 30,
            fontWeight: 400,
            color: "#0F0F0E",
            marginBottom: 6,
            lineHeight: 1.2,
          }}
        >
          {mode === "signup" ? "Create your account." : "Welcome back."}
        </h1>
        <p style={{ fontSize: 14, color: "#8C8C85", marginBottom: 28, lineHeight: 1.5 }}>
          {mode === "signup"
            ? "Build your recruiting edge in under a minute."
            : "Sign in to pick up where you left off."}
        </p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8C8C85", marginBottom: 6 }}>
              Email
            </label>
            <input
              style={inputStyle}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@berkeley.edu"
              onFocus={(e) => (e.target.style.borderColor = "#3B3BFF")}
              onBlur={(e) => (e.target.style.borderColor = "#E8E8E3")}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8C8C85", marginBottom: 6 }}>
              Password
            </label>
            <input
              style={inputStyle}
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onFocus={(e) => (e.target.style.borderColor = "#3B3BFF")}
              onBlur={(e) => (e.target.style.borderColor = "#E8E8E3")}
            />
          </div>
          {error && <p style={{ fontSize: 13, color: "#DC2626" }}>{error}</p>}
          <button
            disabled={loading}
            style={{
              padding: "12px 0",
              borderRadius: 10,
              background: loading ? "#C7C7FF" : "#3B3BFF",
              color: "#FFFFFF",
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "-0.01em",
              marginTop: 4,
            }}
          >
            {loading ? "…" : mode === "signup" ? "Create account →" : "Sign in →"}
          </button>
        </form>
      </div>

      <button
        onClick={() => setMode(mode === "signup" ? "login" : "signup")}
        style={{
          marginTop: 20,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 13,
          color: "#8C8C85",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {mode === "signup" ? (
          <>Already have an account? <span style={{ color: "#3B3BFF" }}>Sign in →</span></>
        ) : (
          <>New here? <span style={{ color: "#3B3BFF" }}>Create an account →</span></>
        )}
      </button>
    </main>
  );
}
