"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getSupabase } from "@/lib/supabase";
import { matchReason, scoreClub } from "@/lib/rank";
import { colorFor, displayScore, monogram } from "@/lib/ui";
import type { Club, Profile } from "@/lib/types";

const FILTERS = ["All", "Consulting", "Finance", "Tech", "VC", "Design"];

function ScoreRing({ score }: { score: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 85 ? "#3B3BFF" : score >= 70 ? "#22C55E" : "#F59E0B";

  return (
    <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
      <svg width="48" height="48" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="24" cy="24" r={r} fill="none" stroke="#E8E8E3" strokeWidth="3" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          color,
        }}
      >
        {score}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        background: "#F4F4F0",
        borderRadius: 6,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 500,
        color: "#4A4A44",
        textTransform: "capitalize",
      }}
    >
      {children}
    </span>
  );
}

export default function ClubsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrapeInput, setScrapeInput] = useState("");
  const [scraping, setScraping] = useState(false);
  const [filter, setFilter] = useState("All");
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    (async () => {
      const { data: userData } = await sb.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      const [{ data: prof }, { data: clubRows }] = await Promise.all([
        sb.from("profiles").select("*").eq("id", userData.user.id).maybeSingle(),
        sb.from("clubs").select("*"),
      ]);
      setProfile(prof as Profile | null);
      setClubs((clubRows as Club[]) ?? []);
      setLoading(false);
    })();
  }, [router]);

  const ranked = useMemo(() => {
    const goal = profile?.career_goal ?? null;
    const targets = profile?.target_clubs ?? [];
    return [...clubs]
      .map((c) => ({
        club: c,
        score: displayScore(scoreClub(c, goal, targets)),
        reason: matchReason(c, goal, targets),
      }))
      .sort((a, b) => b.score - a.score);
  }, [clubs, profile]);

  const filtered = ranked.filter(
    ({ club }) =>
      filter === "All" ||
      (club.category ?? "").toLowerCase() === filter.toLowerCase()
  );

  async function runScrape() {
    if (!scrapeInput.trim()) return;
    setScraping(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: scrapeInput, school: profile?.school }),
      });
      const data = await res.json();
      if (data.clubId) router.push(`/clubs/${data.clubId}`);
    } finally {
      setScraping(false);
    }
  }

  const goalLabel = (profile?.career_goal ?? "").replace("_", " ");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#FAFAF7" }}>
      <Sidebar />
      <main style={{ flex: 1, height: "100vh", overflowY: "auto", padding: "40px 48px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontFamily: "'Newsreader', serif",
              fontSize: 34,
              fontWeight: 400,
              color: "#0F0F0E",
              lineHeight: 1.2,
              marginBottom: 6,
              letterSpacing: "-0.02em",
            }}
          >
            Your matches
          </h1>
          <p style={{ fontSize: 14, color: "#8C8C85" }}>
            Ranked for:
            {Array.from(
              new Set(
                [goalLabel || "your goals", ...(profile?.target_clubs ?? [])]
                  .filter(Boolean)
                  .map((g) => g.toLowerCase())
              )
            )
              .slice(0, 4)
              .map((g) => (
                <span
                  key={g}
                  style={{
                    display: "inline-block",
                    background: "#EBEBFF",
                    color: "#3B3BFF",
                    borderRadius: 6,
                    padding: "1px 8px",
                    fontSize: 12,
                    fontWeight: 500,
                    marginLeft: 6,
                    textTransform: "capitalize",
                  }}
                >
                  {g}
                </span>
              ))}
            {profile?.school && (
              <span style={{ marginLeft: 8 }}>at {profile.school}</span>
            )}
          </p>
        </div>

        {/* Filters + live scrape */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "1.5px solid",
                  borderColor: filter === f ? "#3B3BFF" : "#E8E8E3",
                  background: filter === f ? "#3B3BFF" : "#FFFFFF",
                  color: filter === f ? "#FFFFFF" : "#4A4A44",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <div style={{ position: "relative", flex: 1, minWidth: 240, maxWidth: 340 }}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#B0B0A8"
              strokeWidth="2"
              strokeLinecap="round"
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Add any club — we'll scrape it live"
              value={scrapeInput}
              onChange={(e) => setScrapeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runScrape()}
              style={{
                width: "100%",
                padding: "8px 12px 8px 34px",
                borderRadius: 8,
                border: "1.5px solid #E8E8E3",
                fontSize: 13,
                outline: "none",
                background: "#FFFFFF",
                color: "#0F0F0E",
                fontFamily: "'Inter', sans-serif",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3B3BFF")}
              onBlur={(e) => (e.target.style.borderColor = "#E8E8E3")}
            />
          </div>
          <button
            onClick={runScrape}
            disabled={scraping}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: scraping ? "#C7C7FF" : "#3B3BFF",
              color: "#FFFFFF",
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              cursor: scraping ? "wait" : "pointer",
              fontFamily: "'Inter', sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            {scraping ? "Scraping…" : "Scrape live"}
          </button>
          <span style={{ fontSize: 12, color: "#B0B0A8" }}>{filtered.length} clubs</span>
        </div>

        {/* Club cards */}
        {loading ? (
          <div style={{ fontSize: 14, color: "#8C8C85", marginTop: 40 }}>Loading clubs…</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 980 }}>
            {filtered.map(({ club, score, reason }) => (
              <Link
                key={club.id}
                href={`/clubs/${club.id}`}
                onMouseEnter={() => setHovered(club.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid",
                  borderColor: hovered === club.id ? "#C7C7FF" : "#E8E8E3",
                  borderRadius: 16,
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  boxShadow:
                    hovered === club.id
                      ? "0 4px 16px rgba(59,59,255,0.06)"
                      : "0 1px 4px rgba(0,0,0,0.03)",
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                {/* Monogram */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: colorFor(club.name),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    flexShrink: 0,
                  }}
                >
                  {monogram(club.name)}
                </div>

                {/* Main info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#0F0F0E" }}>{club.name}</span>
                    {club.category && (
                      <span
                        style={{
                          background: "#F4F4F0",
                          color: "#4A4A44",
                          borderRadius: 6,
                          padding: "1px 8px",
                          fontSize: 11,
                          fontWeight: 500,
                          textTransform: "capitalize",
                        }}
                      >
                        {club.category}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                    <Tag>{club.school}</Tag>
                    {club.tagline && (
                      <span style={{ fontSize: 12, color: "#8C8C85", alignSelf: "center" }}>
                        {club.tagline}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#3B3BFF" />
                    </svg>
                    <span style={{ fontSize: 13, color: "#4A4A44", fontStyle: "italic", lineHeight: 1.4 }}>
                      {reason}
                    </span>
                  </div>
                </div>

                {/* Score + CTA */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                  <div style={{ textAlign: "center" }}>
                    <ScoreRing score={score} />
                    <div style={{ fontSize: 10, color: "#8C8C85", marginTop: 4, fontWeight: 500 }}>match</div>
                  </div>
                  <span
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: "1.5px solid #3B3BFF",
                      background: hovered === club.id ? "#EBEBFF" : "transparent",
                      color: "#3B3BFF",
                      fontSize: 13,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      transition: "background 0.15s",
                    }}
                  >
                    View intel →
                  </span>
                </div>
              </Link>
            ))}
            {filtered.length === 0 && (
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E8E8E3",
                  borderRadius: 16,
                  padding: 24,
                  fontSize: 14,
                  color: "#8C8C85",
                }}
              >
                No clubs here yet. Use the live scraper above.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
