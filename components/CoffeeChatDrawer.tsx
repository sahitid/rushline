"use client";

import { useState } from "react";
import type { Club, Member, Profile } from "@/lib/types";

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
  const [subject, setSubject] = useState(
    `Coffee chat — ${club.name}?`
  );
  const [body, setBody] = useState("");
  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  async function draft() {
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
        }),
      });
      const data = await res.json();
      setSubject(data.subject ?? subject);
      setBody(data.body ?? "");
      setTips(data.tips ?? []);
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  }

  const mailto = `mailto:${member.email ?? ""}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;

  const calendar = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    `Coffee chat with ${member.name} (${club.name})`
  )}&details=${encodeURIComponent(body.slice(0, 400))}`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto border-l border-border bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-muted">Coffee-chat outreach</div>
            <h3 className="text-lg font-semibold">{member.name}</h3>
            <div className="text-sm text-muted">
              {member.role} · {club.name}
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            ✕
          </button>
        </div>

        {!generated ? (
          <button
            onClick={draft}
            disabled={loading}
            className="btn-accent mt-6 w-full py-2.5 text-sm disabled:opacity-60"
          >
            {loading ? "Drafting…" : "Draft a personalized email"}
          </button>
        ) : (
          <div className="mt-6 space-y-4">
            {tips.length > 0 && (
              <div className="card p-4">
                <div className="text-xs font-semibold text-accent-2">
                  Pre-chat tips
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted">
                  {tips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs text-muted">Subject</label>
              <input
                className="input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Body</label>
              <textarea
                className="input min-h-[220px] resize-y"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <a href={mailto} className="btn-accent flex-1 py-2.5 text-center text-sm">
                Send email
              </a>
              <a
                href={calendar}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost flex-1 py-2.5 text-center text-sm"
              >
                Add to calendar
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
