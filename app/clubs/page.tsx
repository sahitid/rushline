"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import { getSupabase } from "@/lib/supabase";
import { matchReason, scoreClub } from "@/lib/rank";
import type { Club, Profile } from "@/lib/types";

export default function ClubsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrapeInput, setScrapeInput] = useState("");
  const [scraping, setScraping] = useState(false);

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
        score: scoreClub(c, goal, targets),
        reason: matchReason(c, goal, targets),
      }))
      .sort((a, b) => b.score - a.score);
  }, [clubs, profile]);

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

  return (
    <>
      <NavBar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Your matched clubs</h1>
          <p className="text-sm text-muted">
            Ranked against your {profile?.career_goal ?? "career"} goal at{" "}
            {profile?.school ?? "your school"}.
          </p>
        </div>

        <div className="card mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <input
            className="input"
            placeholder="Scrape any club live — e.g. 'Stanford 180 Degrees Consulting'"
            value={scrapeInput}
            onChange={(e) => setScrapeInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runScrape()}
          />
          <button
            onClick={runScrape}
            disabled={scraping}
            className="btn-accent whitespace-nowrap px-5 py-2.5 text-sm disabled:opacity-60"
          >
            {scraping ? "Scraping…" : "Scrape live"}
          </button>
        </div>

        {loading ? (
          <div className="mt-10 text-sm text-muted">Loading clubs…</div>
        ) : (
          <div className="mt-6 grid gap-4">
            {ranked.map(({ club, reason }, i) => (
              <Link
                key={club.id}
                href={`/clubs/${club.id}`}
                className="card group flex items-start justify-between gap-4 p-5 transition hover:border-accent-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    {i === 0 && (
                      <span className="chip border-accent text-accent">
                        Top match
                      </span>
                    )}
                    <span className="chip capitalize">{club.category}</span>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold group-hover:text-accent-2">
                    {club.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted">{club.tagline}</p>
                  <p className="mt-3 text-sm text-foreground/90">{reason}</p>
                </div>
                <span className="mt-1 text-muted transition group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            ))}
            {ranked.length === 0 && (
              <div className="card p-6 text-sm text-muted">
                No clubs seeded yet. Use the live scraper above.
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
