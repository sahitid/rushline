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

export default function ChaosPage() {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [clubId, setClubId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [firing, setFiring] = useState(false);
  const [opened, setOpened] = useState(0);
  const [done, setDone] = useState(false);

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
      if (list[0]) setClubId(list[0].id);
      setLoading(false);
    })();
  }, [router]);

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

  async function followEveryone() {
    if (!targets.length || firing) return;
    setFiring(true);
    setDone(false);
    setOpened(0);

    // Stagger opens so the browser doesn't hard-block the popup storm.
    for (let i = 0; i < targets.length; i++) {
      window.open(targets[i].url, "_blank", "noopener,noreferrer");
      setOpened(i + 1);
      await new Promise((r) => setTimeout(r, 180));
    }

    setFiring(false);
    setDone(true);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#FAFAF7" }}>
      <Sidebar />
      <main style={{ flex: 1, height: "100vh", overflowY: "auto", padding: "40px 48px" }}>
        <div style={{ maxWidth: 720 }}>
          <span
            style={{
              display: "inline-block",
              background: "#FFF3CD",
              color: "#856404",
              borderRadius: 999,
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Chaos mode
          </span>
          <h1
            style={{
              fontFamily: "'Newsreader', serif",
              fontSize: 34,
              fontWeight: 400,
              color: "#0F0F0E",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              marginBottom: 8,
            }}
          >
            Follow everyone at once.
          </h1>
          <p style={{ fontSize: 14, color: "#8C8C85", marginBottom: 28, lineHeight: 1.55, maxWidth: 520 }}>
            Pick a club. One click opens every member&apos;s Instagram + LinkedIn
            in a tab storm. Allow popups if your browser asks — that&apos;s the
            whole joke.
          </p>

          {loading ? (
            <div style={{ fontSize: 14, color: "#8C8C85" }}>Loading clubs…</div>
          ) : (
            <>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#8C8C85",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                }}
              >
                Club
              </label>
              <select
                value={clubId}
                onChange={(e) => {
                  setClubId(e.target.value);
                  setDone(false);
                  setOpened(0);
                }}
                style={{
                  width: "100%",
                  maxWidth: 420,
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1.5px solid #E8E8E3",
                  background: "#FFFFFF",
                  fontSize: 14,
                  fontFamily: "'Inter', sans-serif",
                  color: "#0F0F0E",
                  marginBottom: 20,
                  outline: "none",
                }}
              >
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({members.filter((m) => m.club_id === c.id).length} people)
                  </option>
                ))}
              </select>

              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E8E8E3",
                  borderRadius: 16,
                  padding: "18px 20px",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#8C8C85",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Blast list
                  </div>
                  <div style={{ fontSize: 12, color: "#8C8C85" }}>
                    {roster.length} members · {targets.length} tabs
                  </div>
                </div>

                {roster.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#8C8C85" }}>No members seeded for this club.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
                    {roster.map((m) => (
                      <div
                        key={m.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 10px",
                          borderRadius: 10,
                          background: "#FAFAF7",
                          border: "1px solid #E8E8E3",
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
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#0F0F0E" }}>{m.name}</div>
                          <div style={{ fontSize: 11, color: "#8C8C85" }}>{m.role}</div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {m.instagram && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: "#E4405F",
                                background: "#FFF0F3",
                                borderRadius: 5,
                                padding: "2px 6px",
                              }}
                            >
                              ig
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#0077B5",
                              background: "#EAF4FB",
                              borderRadius: 5,
                              padding: "2px 6px",
                            }}
                          >
                            in
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={followEveryone}
                disabled={!targets.length || firing}
                style={{
                  width: "100%",
                  maxWidth: 420,
                  padding: "16px 20px",
                  borderRadius: 12,
                  border: "none",
                  background: !targets.length || firing ? "#C7C7FF" : "#3B3BFF",
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: !targets.length || firing ? "not-allowed" : "pointer",
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: "-0.01em",
                  boxShadow: firing ? "none" : "0 8px 24px rgba(59,59,255,0.25)",
                }}
              >
                {firing
                  ? `Opening ${opened}/${targets.length}…`
                  : done
                  ? `Chaos complete — ${targets.length} tabs`
                  : `Follow all ${roster.length} people →`}
              </button>

              {(firing || done) && (
                <p style={{ marginTop: 12, fontSize: 12, color: "#8C8C85", maxWidth: 420 }}>
                  {firing
                    ? "Tab storm in progress. Hit Follow on each if you really mean it."
                    : "Allow popups next time if some tabs got blocked. Networking, weaponized."}
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
