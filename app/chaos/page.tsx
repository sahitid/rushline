"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getSupabase } from "@/lib/supabase";
import { colorFor, initials } from "@/lib/ui";
import type { Club, Member } from "@/lib/types";

function igUrl(handle: string | null) {
  if (!handle) return null;
  return `https://www.instagram.com/${handle.replace(/^@/, "")}`;
}

function linkedinUrl(m: Member, club: Club) {
  if (m.linkedin_url) return m.linkedin_url;
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
    `${m.name} ${club.name}`
  )}`;
}

const WARNINGS = [
  "⚠️ your laptop fan just applied to MBB",
  "🚨 Chrome is writing its will",
  "💀 LinkedIn servers: \"please no\"",
  "🔥 this is how networking wars start",
  "🤡 professionalism has left the chat",
  "📈 soft skills: maximized. RAM: deceased",
];

const FLOATIES = ["👋", "☕", "💼", "🔥", "📱", "🫠", "🚀", "👀", "🤝", "💥", "🤡", "⚡"];

export default function ChaosPage() {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [clubId, setClubId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [firing, setFiring] = useState(false);
  const [opened, setOpened] = useState(0);
  const [done, setDone] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [warnIdx, setWarnIdx] = useState(0);
  const [hoverBtn, setHoverBtn] = useState(false);
  const [shake, setShake] = useState(false);
  const [currentName, setCurrentName] = useState("");

  useEffect(() => {
    const sb = getSupabase();
    (async () => {
      const { data: userData } = await sb.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      const [{ data: clubRows }, { data: memRows }] = await Promise.all([
        sb.from("clubs").select("*").order("name"),
        sb.from("members").select("*"),
      ]);
      const list = (clubRows as Club[]) ?? [];
      setClubs(list);
      setMembers((memRows as Member[]) ?? []);
      // Prefer the fat demo roster
      const bc = list.find((c) => c.slug === "berkeley-consulting");
      setClubId(bc?.id ?? list[0]?.id ?? "");
      setLoading(false);
    })();
  }, [router]);

  useEffect(() => {
    if (!firing) return;
    const t = setInterval(() => setWarnIdx((i) => (i + 1) % WARNINGS.length), 700);
    return () => clearInterval(t);
  }, [firing]);

  const club = clubs.find((c) => c.id === clubId) ?? null;
  const roster = useMemo(
    () => members.filter((m) => m.club_id === clubId),
    [members, clubId]
  );

  const targets = useMemo(() => {
    if (!club) return [] as { name: string; kind: "ig" | "li"; url: string }[];
    const out: { name: string; kind: "ig" | "li"; url: string }[] = [];
    for (const m of roster) {
      const ig = igUrl(m.instagram);
      if (ig) out.push({ name: m.name, kind: "ig", url: ig });
      out.push({ name: m.name, kind: "li", url: linkedinUrl(m, club) });
    }
    return out;
  }, [roster, club]);

  const estimatedGuilt = roster.length * 2.4;
  const estimatedCringe = Math.min(99, 40 + roster.length);

  async function followEveryone() {
    if (!targets.length || firing) return;
    if (!agreed) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setFiring(true);
    setDone(false);
    setOpened(0);

    for (let c = 3; c >= 1; c--) {
      setCountdown(c);
      await new Promise((r) => setTimeout(r, 450));
    }
    setCountdown(null);

    for (let i = 0; i < targets.length; i++) {
      setCurrentName(targets[i].name);
      window.open(targets[i].url, "_blank", "noopener,noreferrer");
      setOpened(i + 1);
      await new Promise((r) => setTimeout(r, 120));
    }

    setFiring(false);
    setDone(true);
    setCurrentName("");
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: firing
          ? "linear-gradient(135deg, #FFE5E5 0%, #EBEBFF 40%, #FFF3CD 100%)"
          : "repeating-linear-gradient(45deg, #FAFAF7, #FAFAF7 12px, #F4F4F0 12px, #F4F4F0 24px)",
        transition: "background 0.3s",
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-2deg) scale(1); }
          50% { transform: rotate(2deg) scale(1.02); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px) rotate(-1deg); }
          40% { transform: translateX(8px) rotate(1deg); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220,38,38,0.5); }
          50% { transform: scale(1.04); box-shadow: 0 0 0 14px rgba(220,38,38,0); }
        }
        @keyframes floaty {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.9; }
          100% { transform: translateY(-120vh) rotate(720deg); opacity: 0; }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes blink { 50% { opacity: 0; } }
        .chaos-btn:not(:disabled):hover { animation: pulse 0.8s ease infinite; }
        .chaos-shake { animation: shake 0.45s ease; }
        .chaos-wiggle { animation: wiggle 1.2s ease-in-out infinite; }
        .chaos-spin { animation: spin 1.2s linear infinite; display: inline-block; }
      `}</style>

      <Sidebar />
      <main
        style={{
          flex: 1,
          height: "100vh",
          overflowY: "auto",
          padding: "32px 40px 60px",
          position: "relative",
        }}
      >
        {/* Floating emoji storm while firing */}
        {firing &&
          FLOATIES.map((e, i) => (
            <span
              key={`${e}-${i}-${opened}`}
              style={{
                position: "fixed",
                left: `${8 + ((i * 17) % 84)}%`,
                bottom: -40,
                fontSize: 28 + (i % 3) * 8,
                pointerEvents: "none",
                zIndex: 60,
                animation: `floaty ${2.2 + (i % 4) * 0.4}s linear ${i * 0.12}s infinite`,
              }}
            >
              {e}
            </span>
          ))}

        {/* Scrolling warning ticker */}
        <div
          style={{
            overflow: "hidden",
            background: "#DC2626",
            color: "white",
            borderRadius: 10,
            marginBottom: 24,
            whiteSpace: "nowrap",
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "10px 0",
              animation: "marquee 14s linear infinite",
            }}
          >
            {[0, 1].map((k) => (
              <span key={k}>
                🚨 THIS IS A BAD IDEA · DO NOT DO THIS IN REAL LIFE · YOUR
                RECRUITER IS WATCHING · NETWORKING SHOULD HURT A LITTLE · POPUPS
                INCOMING ·{" "}
              </span>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 760, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <span
              className="chaos-wiggle"
              style={{
                background: "#FEE2E2",
                color: "#B91C1C",
                borderRadius: 999,
                padding: "4px 12px",
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              🤡 joke feature / not HR approved
            </span>
            <span
              style={{
                background: "#EBEBFF",
                color: "#3B3BFF",
                borderRadius: 999,
                padding: "4px 12px",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              weaponized networking
            </span>
            <span
              style={{
                background: "#FFF3CD",
                color: "#856404",
                borderRadius: 999,
                padding: "4px 12px",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              may summon 70+ tabs
            </span>
          </div>

          <h1
            className={firing ? "chaos-wiggle" : undefined}
            style={{
              fontFamily: "'Newsreader', serif",
              fontSize: 42,
              fontWeight: 400,
              color: "#0F0F0E",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: 10,
            }}
          >
            Follow.{" "}
            <span style={{ color: "#DC2626", fontStyle: "italic" }}>Everyone.</span>{" "}
            Immediately.
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "#4A4A44",
              marginBottom: 8,
              lineHeight: 1.55,
              maxWidth: 560,
            }}
          >
            Why coffee chat one person when you can emotionally overwhelm an
            entire consulting club in 8 seconds?
          </p>
          <p
            style={{
              fontSize: 13,
              color: "#8C8C85",
              marginBottom: 28,
              fontStyle: "italic",
            }}
          >
            (opens every IG + LinkedIn in a tab apocalypse. allow popups. become
            the villain.)
          </p>

          {loading ? (
            <div style={{ fontSize: 14, color: "#8C8C85" }}>
              Gathering victims<span style={{ animation: "blink 1s step-end infinite" }}>…</span>
            </div>
          ) : (
            <>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#DC2626",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 8,
                }}
              >
                Choose your victims
              </label>
              <select
                value={clubId}
                onChange={(e) => {
                  setClubId(e.target.value);
                  setDone(false);
                  setOpened(0);
                  setAgreed(false);
                }}
                style={{
                  width: "100%",
                  maxWidth: 480,
                  padding: "13px 14px",
                  borderRadius: 12,
                  border: "2px solid #0F0F0E",
                  background: "#FFFFFF",
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                  color: "#0F0F0E",
                  marginBottom: 16,
                  outline: "none",
                  transform: "rotate(-0.4deg)",
                }}
              >
                {clubs.map((c) => {
                  const n = members.filter((m) => m.club_id === c.id).length;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} — {n} unsuspecting humans
                    </option>
                  );
                })}
              </select>

              {/* Fake danger stats */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 10,
                  maxWidth: 480,
                  marginBottom: 18,
                }}
              >
                {[
                  { label: "tabs of doom", val: String(targets.length) },
                  { label: "guilt index", val: estimatedGuilt.toFixed(1) },
                  { label: "cringe %", val: `${estimatedCringe}%` },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: "#0F0F0E",
                      color: "#FAFAF7",
                      borderRadius: 12,
                      padding: "12px 14px",
                      transform: `rotate(${s.label === "guilt index" ? 1 : -1}deg)`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#B0B0A8",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {s.label}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Newsreader', serif",
                        fontSize: 28,
                        fontWeight: 400,
                        color: "#FF5A3C",
                        lineHeight: 1.1,
                        marginTop: 2,
                      }}
                    >
                      {s.val}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  background: "#FFFFFF",
                  border: "3px dashed #DC2626",
                  borderRadius: 16,
                  padding: "18px 20px",
                  marginBottom: 16,
                  maxWidth: 640,
                  transform: "rotate(0.3deg)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#DC2626",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    🧨 hit list ({roster.length})
                  </div>
                  <div style={{ fontSize: 12, color: "#8C8C85", fontWeight: 600 }}>
                    estimated browser death: high
                  </div>
                </div>

                {roster.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#8C8C85" }}>
                    Nobody to annoy. Pick a juicier club.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: 8,
                      maxHeight: 260,
                      overflowY: "auto",
                    }}
                  >
                    {roster.map((m, i) => (
                      <div
                        key={m.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 10px",
                          borderRadius: 10,
                          background: i % 2 === 0 ? "#FFF5F5" : "#F5F5FF",
                          border: "1px solid #E8E8E3",
                          transform: `rotate(${i % 2 === 0 ? -0.5 : 0.5}deg)`,
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: colorFor(m.name),
                            color: "white",
                            fontSize: 10,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {initials(m.name)}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#0F0F0E",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {m.name}
                          </div>
                          <div style={{ fontSize: 10, color: "#8C8C85" }}>
                            about to get followed 😈
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fake liability waiver */}
              <button
                type="button"
                onClick={() => setAgreed((a) => !a)}
                className={shake ? "chaos-shake" : undefined}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  width: "100%",
                  maxWidth: 640,
                  textAlign: "left",
                  background: agreed ? "#F0FFF4" : "#FFF8F0",
                  border: `2px solid ${agreed ? "#22C55E" : "#F59E0B"}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  marginBottom: 16,
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    border: `2px solid ${agreed ? "#22C55E" : "#D4D4CE"}`,
                    background: agreed ? "#22C55E" : "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                    color: "white",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {agreed ? "✓" : ""}
                </span>
                <span style={{ fontSize: 13, color: "#4A4A44", lineHeight: 1.5 }}>
                  I understand this will open approximately{" "}
                  <strong>{targets.length} tabs</strong>, that my friends will
                  judge me, and that &quot;building a personal brand&quot; is not a
                  legal defense.
                </span>
              </button>

              <button
                onClick={followEveryone}
                disabled={!targets.length || firing}
                className={!targets.length || firing ? undefined : "chaos-btn"}
                onMouseEnter={() => setHoverBtn(true)}
                onMouseLeave={() => setHoverBtn(false)}
                style={{
                  width: "100%",
                  maxWidth: 480,
                  padding: "18px 22px",
                  borderRadius: 14,
                  border: "3px solid #0F0F0E",
                  background: !targets.length || firing
                    ? "#9CA3AF"
                    : hoverBtn
                    ? "#B91C1C"
                    : "#DC2626",
                  color: "#FFFFFF",
                  fontSize: 18,
                  fontWeight: 900,
                  cursor: !targets.length || firing ? "not-allowed" : "pointer",
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                  transform: hoverBtn && !firing ? "rotate(-1deg) scale(1.02)" : "rotate(-0.5deg)",
                  transition: "background 0.15s, transform 0.15s",
                }}
              >
                {countdown !== null
                  ? `💥 ${countdown}…`
                  : firing
                  ? `YEETING ${opened}/${targets.length}`
                  : done
                  ? `🧹 mop up ${targets.length} tabs`
                  : hoverBtn
                  ? `unleash ${roster.length} follows 😈`
                  : `nuke follow ${roster.length} people`}
              </button>

              {(firing || done || countdown !== null) && (
                <div
                  style={{
                    marginTop: 16,
                    maxWidth: 480,
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "#0F0F0E",
                    color: "#FAFAF7",
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: 1.5,
                  }}
                >
                  {countdown !== null && (
                    <span>
                      Brace for impact… Chrome is whispering a prayer.
                    </span>
                  )}
                  {firing && countdown === null && (
                    <span>
                      <span className="chaos-spin">🌀</span>{" "}
                      {WARNINGS[warnIdx]}
                      {currentName ? (
                        <>
                          <br />
                          currently bothering: <em>{currentName}</em>
                        </>
                      ) : null}
                    </span>
                  )}
                  {done && !firing && (
                    <span>
                      It&apos;s done. You&apos;re either a legend or unemployed.
                      Hit Follow on the tabs if you&apos;re committed to the bit.
                      {targets.length > 40
                        ? " Also maybe restart Chrome."
                        : " Your laptop has trust issues now."}
                    </span>
                  )}
                </div>
              )}

              {!agreed && shake && (
                <p
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    color: "#DC2626",
                    fontWeight: 700,
                  }}
                >
                  nuh uh — check the silly waiver first
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
