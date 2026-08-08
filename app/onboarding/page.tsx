"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { CareerGoal } from "@/lib/types";

const GOALS: { id: CareerGoal; label: string; emoji: string }[] = [
  { id: "consulting", label: "Consulting", emoji: "📊" },
  { id: "startups", label: "Startups", emoji: "🚀" },
  { id: "big_tech", label: "Big Tech", emoji: "💻" },
  { id: "quant", label: "Quant", emoji: "📈" },
  { id: "finance", label: "Finance", emoji: "🏦" },
];

const CLUB_TYPES = ["consulting", "finance", "tech", "vc", "design"];

export default function OnboardingPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [school, setSchool] = useState("UC Berkeley");
  const [goal, setGoal] = useState<CareerGoal>("consulting");
  const [linkedin, setLinkedin] = useState("");
  const [targets, setTargets] = useState<string[]>(["consulting"]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    router.push("/clubs");
  }

  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col px-6 py-14">
      <h1 className="text-2xl font-bold">Tell us who you are</h1>
      <p className="mt-2 text-sm text-muted">
        rushline uses this to rank clubs and personalize your intel. No long quiz
        — drop your LinkedIn and we build the picture.
      </p>

      <div className="card mt-8 space-y-6 p-6">
        <div>
          <label className="mb-1 block text-xs text-muted">Full name</label>
          <input
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Alex Rivera"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted">School</label>
          <input
            className="input"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs text-muted">Career goal</label>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <button
                key={g.id}
                onClick={() => setGoal(g.id)}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  goal === g.id
                    ? "border-accent bg-surface-2"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                <span className="mr-1">{g.emoji}</span>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs text-muted">
            Club types you&apos;re targeting
          </label>
          <div className="flex flex-wrap gap-2">
            {CLUB_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => toggleTarget(t)}
                className={`rounded-full border px-3 py-1.5 text-sm capitalize ${
                  targets.includes(t)
                    ? "border-accent-2 bg-surface-2"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted">
            LinkedIn profile URL
          </label>
          <input
            className="input"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="https://linkedin.com/in/you"
          />
        </div>

        {error && <p className="text-sm text-accent">{error}</p>}

        <button
          onClick={save}
          disabled={saving}
          className="btn-accent w-full py-2.5 text-sm disabled:opacity-60"
        >
          {saving ? "Saving…" : "See my matched clubs"}
        </button>
      </div>
    </main>
  );
}
