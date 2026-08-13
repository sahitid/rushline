"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { CareerGoal } from "@/lib/types";
import { useSchool } from "@/components/SchoolProvider";
import { DEFAULT_SCHOOL, SCHOOLS, type School } from "@/lib/school";

const GOALS: { id: CareerGoal; label: string; icon: string; desc: string }[] = [
  { id: "consulting", label: "Consulting", icon: "💼", desc: "MBB, T2 strategy" },
  { id: "big_tech", label: "Big Tech", icon: "💻", desc: "FAANG & top eng" },
  { id: "quant", label: "Quant", icon: "📊", desc: "HF, trading desks" },
  { id: "startups", label: "Startups", icon: "🚀", desc: "Early-stage, VC" },
  { id: "finance", label: "Finance", icon: "🏦", desc: "IB, PE, markets" },
];

const CLUB_TYPES = ["consulting", "finance", "tech", "vc", "design"];

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

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "#8C8C85",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 8,
};

export default function OnboardingPage() {
  const router = useRouter();
  const { school: selectedSchool, setSchool: setSelectedSchool } = useSchool();
  const [fullName, setFullName] = useState("");
  const [school, setSchool] = useState<string>(DEFAULT_SCHOOL);
  const [goal, setGoal] = useState<CareerGoal>("consulting");
  const [linkedin, setLinkedin] = useState("");
  const [targets, setTargets] = useState<string[]>(["consulting"]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSchool(selectedSchool);
  }, [selectedSchool]);

  useEffect(() => {
    getSupabase()
      .auth.getUser()
      .then(({ data }) => {
        if (!data.user) router.push("/login");
      });
  }, [router]);

  function toggleTarget(t: string) {
    setTargets((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  async function save() {
    setSaving(true);
    setError(null);
    const sb = getSupabase();
    const { data: userData } = await sb.auth.getUser();
    const user = userData.user;
    if (!user) {
      router.push("/login");
      return;
    }
    const { error } = await sb.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      school,
      career_goal: goal,
      linkedin_url: linkedin,
      target_clubs: targets,
    });
    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }
    if (school === "Cornell" || school === "UC Berkeley") {
      setSelectedSchool(school);
    }
    router.push("/clubs");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#FAFAF7",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "60px 20px 80px",
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
          maxWidth: 560,
          background: "#FFFFFF",
          borderRadius: 20,
          border: "1px solid #E8E8E3",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          padding: "40px 44px 36px",
          marginTop: 40,
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
          Tell us who you are.
        </h1>
        <p style={{ fontSize: 14, color: "#8C8C85", marginBottom: 32, lineHeight: 1.5 }}>
          rushline uses this to rank clubs and personalize your intel. No long
          quiz — drop your LinkedIn and we build the picture.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Full name</label>
              <input
                style={inputStyle}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Rivera"
                onFocus={(e) => (e.target.style.borderColor = "#3B3BFF")}
                onBlur={(e) => (e.target.style.borderColor = "#E8E8E3")}
              />
            </div>
            <div>
              <label style={labelStyle}>School</label>
              <select
                style={{
                  ...inputStyle,
                  cursor: "pointer",
                  // Native chevrons sit flush to the edge; draw our own inset arrow.
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  paddingRight: 40,
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2.5 4.5L6 8L9.5 4.5' stroke='%238C8C85' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 14px center",
                  backgroundSize: "12px",
                }}
                value={school}
                onChange={(e) => setSchool(e.target.value as School)}
              >
                {SCHOOLS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>What are you recruiting for?</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {GOALS.map((g) => {
                const selected = goal === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: `1.5px solid ${selected ? "#3B3BFF" : "#E8E8E3"}`,
                      background: selected ? "#EBEBFF" : "#FFFFFF",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{g.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: selected ? "#3B3BFF" : "#0F0F0E", lineHeight: 1.3 }}>
                      {g.label}
                    </div>
                    <div style={{ fontSize: 11, color: "#8C8C85", marginTop: 2 }}>{g.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Club types you&apos;re targeting</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CLUB_TYPES.map((t) => {
                const selected = targets.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTarget(t)}
                    style={{
                      padding: "9px 18px",
                      borderRadius: 999,
                      border: `1.5px solid ${selected ? "#3B3BFF" : "#E8E8E3"}`,
                      background: selected ? "#3B3BFF" : "#FFFFFF",
                      color: selected ? "#FFFFFF" : "#4A4A44",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      textTransform: "capitalize",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>LinkedIn profile URL</label>
            <input
              style={inputStyle}
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/you"
              onFocus={(e) => (e.target.style.borderColor = "#3B3BFF")}
              onBlur={(e) => (e.target.style.borderColor = "#E8E8E3")}
            />
            <p style={{ fontSize: 11, color: "#B0B0A8", marginTop: 6 }}>
              We read public data only.
            </p>
          </div>

          {error && <p style={{ fontSize: 13, color: "#DC2626" }}>{error}</p>}

          <button
            onClick={save}
            disabled={saving}
            style={{
              padding: "13px 0",
              borderRadius: 10,
              background: saving ? "#C7C7FF" : "#3B3BFF",
              color: "#FFFFFF",
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? "wait" : "pointer",
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "-0.01em",
            }}
          >
            {saving ? "Saving…" : "Build my feed →"}
          </button>
        </div>
      </div>
    </main>
  );
}
