"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import CoffeeChatDrawer from "@/components/CoffeeChatDrawer";
import { getSupabase } from "@/lib/supabase";
import { scoreClubDetailed } from "@/lib/rank";
import { colorFor, initials, monogram } from "@/lib/ui";
import type {
  Club,
  ClubIntel,
  Member,
  Profile,
  RedditPost,
  UserConnection,
} from "@/lib/types";
import { useSchool } from "@/components/SchoolProvider";
import { schoolMatches, schoolShortLabel } from "@/lib/school";

function linkedinConnect(m: Member, club: Club) {
  if (m.linkedin_url) return m.linkedin_url;
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
    `${m.name} ${club.name}`
  )}`;
}
function instagramLink(m: Member) {
  if (!m.instagram) return null;
  const handle = m.instagram.replace(/^@/, "");
  return `https://www.instagram.com/${handle}`;
}

function SectionCard({
  title,
  children,
  accent,
  badge,
  full,
}: {
  title: string;
  children: React.ReactNode;
  accent?: boolean;
  badge?: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div
      style={{
        background: accent ? "#EBEBFF" : "#FFFFFF",
        border: `1px solid ${accent ? "#C7C7FF" : "#E8E8E3"}`,
        borderRadius: 16,
        padding: "22px 24px",
        gridColumn: full ? "1 / -1" : undefined,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
          {title}
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

function SourceChip({ label, url }: { label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: "#F4F4F0",
        border: "1px solid #E8E8E3",
        borderRadius: 6,
        padding: "1px 7px",
        fontSize: 11,
        color: "#4A4A44",
        fontWeight: 500,
        textDecoration: "none",
      }}
    >
      <span style={{ width: 10, height: 10, borderRadius: 2, background: "#3B3BFF", opacity: 0.7 }} />
      {label}
    </a>
  );
}

export default function ClubDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { school, ready } = useSchool();
  const [club, setClub] = useState<Club | null>(null);
  const [intel, setIntel] = useState<ClubIntel | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [reddit, setReddit] = useState<RedditPost[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [active, setActive] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [wrongSchool, setWrongSchool] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const sb = getSupabase();
    (async () => {
      setLoading(true);
      setWrongSchool(false);
      const [{ data: c }, { data: it }, { data: mem }, { data: rp }] =
        await Promise.all([
          sb.from("clubs").select("*").eq("id", id).maybeSingle(),
          sb.from("club_intel").select("*").eq("club_id", id).maybeSingle(),
          sb.from("members").select("*").eq("club_id", id),
          sb.from("reddit_posts").select("*").eq("club_id", id),
        ]);
      const clubRow = c as Club | null;
      if (clubRow && !schoolMatches(clubRow.school, school)) {
        setClub(null);
        setIntel(null);
        setMembers([]);
        setReddit([]);
        setWrongSchool(true);
      } else {
        setClub(clubRow);
        setIntel(it as ClubIntel | null);
        setMembers((mem as Member[]) ?? []);
        setReddit((rp as RedditPost[]) ?? []);
      }
      const { data: userData } = await sb.auth.getUser();
      if (userData.user) {
        const [{ data: prof }, connRes] = await Promise.all([
          sb.from("profiles").select("*").eq("id", userData.user.id).maybeSingle(),
          sb
            .from("user_connections")
            .select("*")
            .eq("user_id", userData.user.id),
        ]);
        setConnections(
          connRes.error ? [] : ((connRes.data as UserConnection[]) ?? [])
        );
        setProfile(prof as Profile | null);
      }
      setLoading(false);
    })();
  }, [id, school, ready]);

  const shell = (content: React.ReactNode) => (
    <div style={{ display: "flex", minHeight: "100vh", background: "#FAFAF7", position: "relative" }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          height: "100vh",
          overflowY: "auto",
          padding: "40px 48px",
          filter: active ? "blur(2px) brightness(0.9)" : "none",
          transition: "filter 0.3s ease",
          pointerEvents: active ? "none" : "auto",
        }}
      >
        {content}
      </main>
      {active && club && (
        <CoffeeChatDrawer
          member={active}
          club={club}
          profile={profile}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );

  if (loading)
    return shell(<div style={{ fontSize: 14, color: "#8C8C85" }}>Loading intel…</div>);

  if (!club)
    return shell(
      <div style={{ fontSize: 14, color: "#8C8C85" }}>
        {wrongSchool
          ? `This club isn’t in ${schoolShortLabel(school)}. Switch schools in the sidebar, or `
          : "Club not found. "}
        <Link href="/clubs" style={{ color: "#3B3BFF" }}>
          Back to clubs
        </Link>
      </div>
    );

  const goalMatched = members.filter((m) =>
    profile?.career_goal ? m.career_tags?.includes(profile.career_goal) : false
  );
  const peopleToMeet = (goalMatched.length ? goalMatched : members).slice(0, 3);
  const match = scoreClubDetailed(club, {
    profile,
    connections,
    members,
  }).score;

  const vibeRows = [
    intel?.vibe?.culture && { label: "Culture", val: intel.vibe.culture },
    intel?.vibe?.selectivity && { label: "Selectivity", val: intel.vibe.selectivity },
    intel?.vibe?.intensity && { label: "Intensity", val: intel.vibe.intensity },
    intel?.vibe?.social_energy && { label: "Social energy", val: intel.vibe.social_energy },
  ].filter(Boolean) as { label: string; val: string }[];

  const interviewSteps = [
    intel?.interview?.rounds !== undefined && {
      label: "Rounds",
      tip: `${intel.interview.rounds} rounds total.`,
    },
    intel?.interview?.technical_round !== undefined && {
      label: "Technical round",
      tip: intel.interview.technical_round
        ? "Yes — expect a technical component."
        : "No technical round.",
    },
    intel?.interview?.case_format && {
      label: "Case format",
      tip: intel.interview.case_format,
    },
    intel?.interview?.difficulty && {
      label: "Difficulty",
      tip: intel.interview.difficulty,
    },
  ].filter(Boolean) as { label: string; tip: string }[];

  const positive = intel?.reddit_sentiment?.vibe === "positive";
  const sentimentLabel =
    intel?.reddit_sentiment?.vibe === "positive"
      ? "Mostly Positive"
      : intel?.reddit_sentiment?.vibe === "negative"
      ? "Mostly Negative"
      : "Mixed";

  return shell(
    <>
      <Link
        href="/clubs"
        style={{
          fontSize: 13,
          color: "#8C8C85",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 20,
        }}
      >
        ← All clubs
      </Link>

      {/* Hero */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E8E8E3",
          borderRadius: 20,
          padding: "28px 32px",
          marginBottom: 24,
          maxWidth: 1100,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 24 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 14,
              background: colorFor(club.name),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.04em",
              flexShrink: 0,
            }}
          >
            {monogram(club.name)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
              <h1
                style={{
                  fontFamily: "'Newsreader', serif",
                  fontSize: 26,
                  fontWeight: 400,
                  color: "#0F0F0E",
                  lineHeight: 1.2,
                  letterSpacing: "-0.02em",
                }}
              >
                {club.name}
              </h1>
              <span
                style={{
                  background: "#EBEBFF",
                  color: "#3B3BFF",
                  borderRadius: 8,
                  padding: "3px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {match} match
              </span>
            </div>
            {club.tagline && (
              <p style={{ fontSize: 13, color: "#8C8C85", marginBottom: 12 }}>{club.tagline}</p>
            )}
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[
                { label: "Category", val: club.category ?? "—" },
                { label: "School", val: club.school },
                { label: "Roster", val: `${members.length} tracked` },
                {
                  label: "Sources",
                  val: `${(intel?.sources?.length ?? 0) + reddit.length} scraped`,
                },
              ].map((stat) => (
                <div key={stat.label}>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#B0B0A8",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      marginBottom: 2,
                    }}
                  >
                    {stat.label}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0F0F0E", textTransform: "capitalize" }}>
                    {stat.val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {peopleToMeet[0] && (
            <button
              onClick={() => setActive(peopleToMeet[0])}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                background: "#3B3BFF",
                color: "#FFFFFF",
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                letterSpacing: "-0.01em",
              }}
            >
              Draft coffee chat
            </button>
          )}
          {club.website && (
            <a
              href={club.website}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                background: "#FFFFFF",
                color: "#4A4A44",
                border: "1.5px solid #E8E8E3",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Website ↗
            </a>
          )}
        </div>
      </div>

      {/* Section grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 1100 }}>
        {intel?.review && (
          <SectionCard title="The Review" full>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "#2A2A24" }}>{intel.review}</p>
            {intel.sources?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                {intel.sources.map((s, i) => (
                  <SourceChip key={i} label={s.label} url={s.url} />
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {intel?.clients && intel.clients.length > 0 && (
          <SectionCard title="Client History">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {intel.clients.map((c) => (
                <div key={c} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: "#F4F4F0",
                      border: "1px solid #E8E8E3",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#8C8C85",
                      flexShrink: 0,
                    }}
                  >
                    {c.charAt(0)}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#0F0F0E" }}>{c}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {intel?.retreats && intel.retreats.length > 0 && (
          <SectionCard title="Retreats & Social">
            <div
              style={{
                height: 88,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${colorFor(club.name)} 0%, #3B3BFF 100%)`,
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "white", fontSize: 13, fontWeight: 600 }}>
                🏔 {intel.retreats[0].place}
              </span>
            </div>
            <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none", padding: 0, margin: 0 }}>
              {intel.retreats.map((r, i) => (
                <li key={i} style={{ fontSize: 13, lineHeight: 1.6, color: "#4A4A44" }}>
                  <span style={{ fontWeight: 600, color: "#0F0F0E" }}>{r.place}</span>
                  {r.note && <span> — {r.note}</span>}
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {(intel?.reddit_sentiment?.summary || reddit.length > 0) && (
          <SectionCard title="Reddit Sentiment">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: "#E8E8E3", overflow: "hidden" }}>
                <div
                  style={{
                    width: positive ? "74%" : "50%",
                    height: "100%",
                    borderRadius: 3,
                    background: positive
                      ? "linear-gradient(90deg, #22C55E 0%, #3B3BFF 100%)"
                      : "linear-gradient(90deg, #F59E0B 0%, #3B3BFF 100%)",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: positive ? "#22C55E" : "#F59E0B",
                }}
              >
                {sentimentLabel}
              </span>
            </div>
            {intel?.reddit_sentiment?.summary && (
              <p style={{ fontSize: 13, lineHeight: 1.6, color: "#4A4A44", marginBottom: 12 }}>
                {intel.reddit_sentiment.summary}
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {reddit.slice(0, 3).map((r) => (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: "#FAFAF7",
                    border: "1px solid #E8E8E3",
                    borderRadius: 10,
                    padding: "12px 14px",
                    textDecoration: "none",
                    display: "block",
                  }}
                >
                  <p style={{ fontSize: 12, lineHeight: 1.6, color: "#4A4A44", marginBottom: 8 }}>
                    {r.title}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#8C8C85" }}>↑ {r.score}</span>
                    {r.subreddit && (
                      <span style={{ fontSize: 11, color: "#3B3BFF", fontWeight: 500 }}>
                        r/{r.subreddit.replace(/^r\//, "")}
                      </span>
                    )}
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "#B0B0A8" }}>↗</span>
                  </div>
                </a>
              ))}
            </div>
          </SectionCard>
        )}

        {intel?.x_sentiment && (intel.x_sentiment.summary || (intel.x_sentiment.posts?.length ?? 0) > 0) && (
          <SectionCard
            title="Live X Chatter"
            badge={
              <span
                style={{
                  background: "#F4F4F0",
                  border: "1px solid #E8E8E3",
                  borderRadius: 6,
                  padding: "1px 8px",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#4A4A44",
                }}
              >
                via Grok x_search
              </span>
            }
          >
            {intel.x_sentiment.summary && (
              <p style={{ fontSize: 13, lineHeight: 1.6, color: "#4A4A44", marginBottom: 12 }}>
                {intel.x_sentiment.summary}
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(intel.x_sentiment.posts ?? []).slice(0, 3).map((p, i) => (
                <div
                  key={i}
                  style={{
                    background: "#FAFAF7",
                    border: "1px solid #E8E8E3",
                    borderRadius: 10,
                    padding: "12px 14px",
                  }}
                >
                  <p style={{ fontSize: 12, lineHeight: 1.6, color: "#4A4A44", marginBottom: p.handle ? 6 : 0 }}>
                    &quot;{p.text}&quot;
                  </p>
                  {p.handle && (
                    <span style={{ fontSize: 11, color: "#3B3BFF", fontWeight: 500 }}>{p.handle}</span>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {intel?.vibe && Object.keys(intel.vibe).length > 0 && (
          <SectionCard
            title="Vibe & Culture"
            accent
            full
            badge={
              <span
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #C7C7FF",
                  borderRadius: 6,
                  padding: "1px 8px",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#3B3BFF",
                }}
              >
                via Grok /stalk · X + Reddit + IG
              </span>
            }
          >
            {intel.vibe.headline && (
              <p
                style={{
                  fontFamily: "'Newsreader', serif",
                  fontSize: 20,
                  fontWeight: 400,
                  color: "#0F0F0E",
                  marginBottom: 14,
                  lineHeight: 1.35,
                }}
              >
                {intel.vibe.headline}
              </p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {vibeRows.map((row) => (
                <div key={row.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#8C8C85",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                    }}
                  >
                    {row.label}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#0F0F0E", lineHeight: 1.5 }}>
                    {row.val}
                  </div>
                </div>
              ))}
            </div>
            {intel.vibe.values && intel.vibe.values.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 16 }}>
                {intel.vibe.values.map((v, i) => (
                  <span
                    key={i}
                    style={{
                      background: "#FFFFFF",
                      color: "#3B3BFF",
                      border: "1px solid #C7C7FF",
                      borderRadius: 6,
                      padding: "2px 10px",
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                  >
                    {v}
                  </span>
                ))}
              </div>
            )}
            {intel.vibe.source_note && (
              <p style={{ fontSize: 11, color: "#8C8C85", marginTop: 12 }}>{intel.vibe.source_note}</p>
            )}
          </SectionCard>
        )}

        {interviewSteps.length > 0 && (
          <SectionCard title="Interview Intel" full>
            {intel?.interview?.technical_round !== undefined && (
              <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
                <span
                  style={{
                    background: intel.interview.technical_round ? "#FFF3CD" : "#E8F8EE",
                    color: intel.interview.technical_round ? "#856404" : "#166534",
                    borderRadius: 6,
                    padding: "3px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Technical round: {intel.interview.technical_round ? "Yes" : "No"}
                </span>
                {intel.interview.difficulty && (
                  <span
                    style={{
                      background: "#FFF3CD",
                      color: "#856404",
                      borderRadius: 6,
                      padding: "3px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "capitalize",
                    }}
                  >
                    Difficulty: {intel.interview.difficulty}
                  </span>
                )}
              </div>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(interviewSteps.length, 4)}, 1fr)`,
                gap: 12,
              }}
            >
              {interviewSteps.map((step, i) => (
                <div key={step.label} style={{ position: "relative" }}>
                  <div
                    style={{
                      background: i === 0 ? "#3B3BFF" : "#FAFAF7",
                      border: `1.5px solid ${i === 0 ? "#3B3BFF" : "#E8E8E3"}`,
                      borderRadius: 12,
                      padding: "14px 16px",
                      height: "100%",
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: i === 0 ? "#FFFFFF" : "#E8E8E3",
                        color: i === 0 ? "#3B3BFF" : "#8C8C85",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        marginBottom: 8,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: i === 0 ? "#FFFFFF" : "#0F0F0E",
                        marginBottom: 6,
                      }}
                    >
                      {step.label}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        lineHeight: 1.5,
                        color: i === 0 ? "rgba(255,255,255,0.85)" : "#8C8C85",
                      }}
                    >
                      {step.tip}
                    </div>
                  </div>
                  {i < interviewSteps.length - 1 && (
                    <div style={{ position: "absolute", top: 20, right: -10, color: "#B0B0A8", fontSize: 12 }}>
                      →
                    </div>
                  )}
                </div>
              ))}
            </div>
            {intel?.interview?.notes && (
              <p style={{ fontSize: 13, lineHeight: 1.6, color: "#4A4A44", marginTop: 16 }}>
                {intel.interview.notes}
              </p>
            )}
          </SectionCard>
        )}

        {peopleToMeet.length > 0 && (
          <SectionCard title="People You Should Meet" full>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(peopleToMeet.length, 3)}, 1fr)`,
                gap: 14,
              }}
            >
              {peopleToMeet.map((m) => {
                const ig = instagramLink(m);
                return (
                  <div
                    key={m.id}
                    style={{
                      background: "#FAFAF7",
                      border: "1px solid #E8E8E3",
                      borderRadius: 14,
                      padding: 18,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: colorFor(m.name),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: 12,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {initials(m.name)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0F0F0E" }}>
                          {m.name}
                          {m.is_alumni && (
                            <span
                              style={{
                                marginLeft: 6,
                                background: "#F4F4F0",
                                color: "#4A4A44",
                                borderRadius: 4,
                                padding: "1px 6px",
                                fontSize: 10,
                                fontWeight: 600,
                              }}
                            >
                              alum
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "#8C8C85" }}>{m.role}</div>
                      </div>
                    </div>
                    {m.relevance && (
                      <p style={{ fontSize: 12, lineHeight: 1.5, color: "#4A4A44", fontStyle: "italic", flex: 1 }}>
                        &quot;{m.relevance}&quot;
                      </p>
                    )}
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => setActive(m)}
                        style={{
                          flex: 1,
                          padding: "8px 0",
                          borderRadius: 8,
                          background: "#3B3BFF",
                          color: "#FFFFFF",
                          border: "none",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        Coffee chat →
                      </button>
                      <a
                        href={linkedinConnect(m, club)}
                        target="_blank"
                        rel="noreferrer"
                        title="LinkedIn"
                        style={{
                          padding: "8px 10px",
                          borderRadius: 8,
                          background: "#0077B5",
                          color: "white",
                          fontSize: 11,
                          fontWeight: 700,
                          textDecoration: "none",
                        }}
                      >
                        in
                      </a>
                      {ig && (
                        <a
                          href={ig}
                          target="_blank"
                          rel="noreferrer"
                          title="Instagram"
                          style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            background:
                              "linear-gradient(135deg, #f09433 0%, #dc2743 50%, #bc1888 100%)",
                            color: "white",
                            fontSize: 11,
                            fontWeight: 700,
                            textDecoration: "none",
                          }}
                        >
                          ig
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {members.length > 0 && (
          <SectionCard title="Member Roster" full>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              {members.map((m) => {
                const ig = instagramLink(m);
                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: "#FAFAF7",
                      borderRadius: 10,
                      padding: "10px 12px",
                      border: "1px solid #E8E8E3",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: colorFor(m.name),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: 10,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {initials(m.name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#0F0F0E",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {m.name}
                      </div>
                      <div style={{ fontSize: 10, color: "#8C8C85" }}>
                        {m.role}
                        {m.is_alumni ? " · alum" : ""}
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                        <a
                          href={linkedinConnect(m, club)}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#0077B5", fontSize: 9, fontWeight: 600, textDecoration: "none" }}
                        >
                          in
                        </a>
                        {ig && (
                          <a
                            href={ig}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#E4405F", fontSize: 9, fontWeight: 600, textDecoration: "none" }}
                          >
                            ig
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}
      </div>

      <div style={{ height: 60 }} />
    </>
  );
}
