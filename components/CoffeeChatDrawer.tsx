"use client";

import { useCallback, useEffect, useState } from "react";
import { colorFor, initials } from "@/lib/ui";
import type { Club, Member, Profile } from "@/lib/types";

function linkedinConnect(m: Member, club: Club) {
  if (m.linkedin_url) return m.linkedin_url;
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
    `${m.name} ${club.name}`
  )}`;
}
function instagramLink(m: Member) {
  if (!m.instagram) return null;
  return `https://www.instagram.com/${m.instagram.replace(/^@/, "")}`;
}

export default function CoffeeChatDrawer({
  member,
  club,
  profile,
  onClose,
}: {
  member: Member;
  club: Club;
  profile: Profile | null;
  onClose: () => void;
}) {
  const [tone, setTone] = useState<"casual" | "formal">("formal");
  const [subject, setSubject] = useState(`Coffee chat — ${club.name}?`);
  const [body, setBody] = useState("");
  const [tips, setTips] = useState<string[]>([]);
  const [checked, setChecked] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const draft = useCallback(
    async (selectedTone: "casual" | "formal") => {
      setLoading(true);
      try {
        const res = await fetch("/api/draft-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            member,
            club,
            profile: {
              full_name: profile?.full_name,
              school: profile?.school,
              career_goal: profile?.career_goal,
            },
            tone: selectedTone,
          }),
        });
        const data = await res.json();
        setSubject(data.subject ?? `Coffee chat — ${club.name}?`);
        setBody(data.body ?? "");
        setTips(data.tips ?? []);
        setChecked(new Array((data.tips ?? []).length).fill(false));
      } finally {
        setLoading(false);
      }
    },
    [member, club, profile]
  );

  useEffect(() => {
    draft(tone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.id]);

  function setToneAndDraft(t: "casual" | "formal") {
    setTone(t);
    draft(t);
  }

  function toggleTip(i: number) {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  }

  function handleCopy() {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const mailto = `mailto:${member.email ?? ""}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;

  const calendar = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    `Coffee chat with ${member.name} (${club.name})`
  )}&details=${encodeURIComponent(body.slice(0, 400))}`;

  const ig = instagramLink(member);

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 40, cursor: "pointer" }}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "min(480px, 100vw)",
          height: "100vh",
          background: "#FFFFFF",
          borderLeft: "1px solid #E8E8E3",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #E8E8E3",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F0F0E", letterSpacing: "-0.01em" }}>
            Coffee Chat Draft
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#8C8C85",
              fontSize: 18,
              lineHeight: 1,
              padding: "4px 6px",
              borderRadius: 6,
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Member mini-profile */}
          <div
            style={{
              background: "#FAFAF7",
              border: "1px solid #E8E8E3",
              borderRadius: 14,
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: colorFor(member.name),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 14,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {initials(member.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0F0F0E", marginBottom: 2 }}>
                {member.name}
              </div>
              <div style={{ fontSize: 12, color: "#8C8C85", marginBottom: 8 }}>
                {member.role} · {club.name}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a
                  href={linkedinConnect(member, club)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: "#0077B5",
                    color: "white",
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  LinkedIn
                </a>
                {ig && (
                  <a
                    href={ig}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      background:
                        "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                      color: "white",
                      borderRadius: 6,
                      padding: "4px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    Instagram
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* AI Email */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
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
                AI-drafted email
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", background: "#F4F4F0", borderRadius: 7, padding: 2, gap: 2 }}>
                  {(["casual", "formal"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setToneAndDraft(t)}
                      style={{
                        padding: "3px 10px",
                        borderRadius: 5,
                        border: "none",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        background: tone === t ? "#FFFFFF" : "transparent",
                        color: tone === t ? "#0F0F0E" : "#8C8C85",
                        boxShadow: tone === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                        transition: "all 0.15s",
                        fontFamily: "'Inter', sans-serif",
                        textTransform: "capitalize",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => draft(tone)}
                  disabled={loading}
                  title="Regenerate email"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    border: "1.5px solid #E8E8E3",
                    background: loading ? "#EBEBFF" : "#FFFFFF",
                    cursor: loading ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#3B3BFF",
                    padding: 0,
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{
                      transform: loading ? "rotate(360deg)" : "none",
                      transition: loading ? "transform 0.6s linear" : "none",
                    }}
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                </button>
              </div>
            </div>

            <div
              style={{
                background: "#FAFAF7",
                border: "1px solid #E8E8E3",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  borderBottom: "1px solid #E8E8E3",
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 11, color: "#8C8C85", fontWeight: 600, flexShrink: 0 }}>
                  Subject
                </span>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{
                    flex: 1,
                    fontSize: 12,
                    color: "#0F0F0E",
                    fontWeight: 500,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
              </div>
              <textarea
                value={loading && !body ? "Drafting a personalized email…" : body}
                onChange={(e) => setBody(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 210,
                  padding: 14,
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: loading && !body ? "#B0B0A8" : "#2A2A24",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "'Inter', sans-serif",
                }}
              />
            </div>
          </div>

          {/* Pre-chat tips */}
          {tips.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#8C8C85",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 10,
                }}
              >
                Pre-chat tips
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {tips.map((tip, i) => (
                  <button
                    key={i}
                    onClick={() => toggleTip(i)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      background: checked[i] ? "#F0FFF4" : "#FAFAF7",
                      border: `1px solid ${checked[i] ? "#A3E8B0" : "#E8E8E3"}`,
                      borderRadius: 10,
                      padding: "12px 14px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                      width: "100%",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 5,
                        border: `1.5px solid ${checked[i] ? "#22C55E" : "#D4D4CE"}`,
                        background: checked[i] ? "#22C55E" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1,
                        transition: "all 0.15s",
                      }}
                    >
                      {checked[i] && (
                        <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                          <polyline
                            points="2,6 5,9 10,3"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span style={{ fontSize: 12, lineHeight: 1.6, color: checked[i] ? "#166534" : "#4A4A44" }}>
                      {tip}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #E8E8E3",
            background: "#FFFFFF",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <a
            href={mailto}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 10,
              borderRadius: 10,
              background: "#3B3BFF",
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              gap: 6,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Send email
          </a>
          <a
            href={calendar}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "#FFFFFF",
              color: "#4A4A44",
              border: "1.5px solid #E8E8E3",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 5,
              whiteSpace: "nowrap",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Calendar
          </a>
          <button
            onClick={handleCopy}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: copied ? "#F0FFF4" : "#FFFFFF",
              color: copied ? "#166534" : "#4A4A44",
              border: `1.5px solid ${copied ? "#A3E8B0" : "#E8E8E3"}`,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              transition: "all 0.15s",
            }}
          >
            {copied ? "✓" : "Copy"}
          </button>
        </div>
      </div>
    </>
  );
}
