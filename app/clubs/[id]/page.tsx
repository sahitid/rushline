"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import CoffeeChatDrawer from "@/components/CoffeeChatDrawer";
import { getSupabase } from "@/lib/supabase";
import type { Club, ClubIntel, Member, Profile, RedditPost } from "@/lib/types";

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

export default function ClubDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [club, setClub] = useState<Club | null>(null);
  const [intel, setIntel] = useState<ClubIntel | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [reddit, setReddit] = useState<RedditPost[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [active, setActive] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabase();
    (async () => {
      const [{ data: c }, { data: it }, { data: mem }, { data: rp }] =
        await Promise.all([
          sb.from("clubs").select("*").eq("id", id).maybeSingle(),
          sb.from("club_intel").select("*").eq("club_id", id).maybeSingle(),
          sb.from("members").select("*").eq("club_id", id),
          sb.from("reddit_posts").select("*").eq("club_id", id),
        ]);
      setClub(c as Club | null);
      setIntel(it as ClubIntel | null);
      setMembers((mem as Member[]) ?? []);
      setReddit((rp as RedditPost[]) ?? []);
      const { data: userData } = await sb.auth.getUser();
      if (userData.user) {
        const { data: prof } = await sb
          .from("profiles")
          .select("*")
          .eq("id", userData.user.id)
          .maybeSingle();
        setProfile(prof as Profile | null);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading)
    return (
      <>
        <NavBar />
        <main className="mx-auto max-w-4xl px-5 py-10 text-sm text-muted">
          Loading intel…
        </main>
      </>
    );

  if (!club)
    return (
      <>
        <NavBar />
        <main className="mx-auto max-w-4xl px-5 py-10 text-sm text-muted">
          Club not found.{" "}
          <Link href="/clubs" className="text-accent-2">
            Back to clubs
          </Link>
        </main>
      </>
    );

  const goalMatched = members.filter((m) =>
    profile?.career_goal
      ? m.career_tags?.includes(profile.career_goal)
      : false
  );
  const peopleToMeet = (goalMatched.length ? goalMatched : members).slice(0, 4);

  return (
    <>
      <NavBar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">
        <Link href="/clubs" className="text-sm text-muted hover:text-foreground">
          ← All clubs
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="chip capitalize">{club.category}</span>
          <span className="chip">{club.school}</span>
          {club.website && (
            <a
              href={club.website}
              target="_blank"
              rel="noreferrer"
              className="chip hover:text-foreground"
            >
              Website ↗
            </a>
          )}
        </div>
        <h1 className="mt-3 text-3xl font-bold">{club.name}</h1>
        <p className="mt-1 text-muted">{club.tagline}</p>

        {/* Review */}
        {intel?.review && (
          <section className="card mt-8 p-6">
            <h2 className="text-sm font-semibold text-accent-2">The rundown</h2>
            <p className="mt-3 leading-relaxed text-foreground/90">
              {intel.review}
            </p>
            {intel.sources?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {intel.sources.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="chip hover:text-foreground"
                  >
                    {s.label} ↗
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Vibe & Culture — the Grok /stalk moment */}
        {intel?.vibe && Object.keys(intel.vibe).length > 0 && (
          <section className="card mt-6 border-accent-2/40 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-accent-2">
                Vibe &amp; Culture
              </h2>
              <span className="chip">via Grok /stalk · X + Reddit + IG</span>
            </div>
            {intel.vibe.headline && (
              <p className="mt-3 text-lg font-medium">{intel.vibe.headline}</p>
            )}
            {intel.vibe.culture && (
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                {intel.vibe.culture}
              </p>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {intel.vibe.selectivity && (
                <div className="rounded-xl bg-surface-2 p-3">
                  <div className="text-xs text-muted">Selectivity</div>
                  <div className="mt-1 text-sm">{intel.vibe.selectivity}</div>
                </div>
              )}
              {intel.vibe.intensity && (
                <div className="rounded-xl bg-surface-2 p-3">
                  <div className="text-xs text-muted">Intensity</div>
                  <div className="mt-1 text-sm">{intel.vibe.intensity}</div>
                </div>
              )}
              {intel.vibe.social_energy && (
                <div className="rounded-xl bg-surface-2 p-3">
                  <div className="text-xs text-muted">Social energy</div>
                  <div className="mt-1 text-sm">{intel.vibe.social_energy}</div>
                </div>
              )}
            </div>
            {intel.vibe.values && intel.vibe.values.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {intel.vibe.values.map((v, i) => (
                  <span key={i} className="chip">
                    {v}
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {/* Clients */}
          {intel?.clients && intel.clients.length > 0 && (
            <section className="card p-6">
              <h2 className="text-sm font-semibold text-accent-2">
                Client history
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {intel.clients.map((c, i) => (
                  <span key={i} className="chip">
                    {c}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Retreats */}
          {intel?.retreats && intel.retreats.length > 0 && (
            <section className="card p-6">
              <h2 className="text-sm font-semibold text-accent-2">Retreats</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {intel.retreats.map((r, i) => (
                  <li key={i}>
                    <span className="font-medium">{r.place}</span>
                    {r.note && <span className="text-muted"> — {r.note}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Interview intel */}
        {intel?.interview && Object.keys(intel.interview).length > 0 && (
          <section className="card mt-6 p-6">
            <h2 className="text-sm font-semibold text-accent-2">
              Interview intel
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <Stat label="Rounds" value={intel.interview.rounds?.toString()} />
              <Stat
                label="Technical round"
                value={
                  intel.interview.technical_round === undefined
                    ? undefined
                    : intel.interview.technical_round
                    ? "Yes"
                    : "No"
                }
              />
              <Stat label="Case format" value={intel.interview.case_format} />
              <Stat label="Difficulty" value={intel.interview.difficulty} />
            </div>
            {intel.interview.notes && (
              <p className="mt-4 text-sm text-muted">{intel.interview.notes}</p>
            )}
          </section>
        )}

        {/* Reddit sentiment */}
        {(intel?.reddit_sentiment?.summary || reddit.length > 0) && (
          <section className="card mt-6 p-6">
            <h2 className="text-sm font-semibold text-accent-2">
              Reddit sentiment
            </h2>
            {intel?.reddit_sentiment?.summary && (
              <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                {intel.reddit_sentiment.summary}
              </p>
            )}
            {reddit.length > 0 && (
              <ul className="mt-4 space-y-3">
                {reddit.slice(0, 5).map((r) => (
                  <li key={r.id}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium hover:text-accent-2"
                    >
                      {r.title} ↗
                    </a>
                    {r.snippet && (
                      <p className="text-xs text-muted">{r.snippet}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* People you should meet */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold">People you should meet</h2>
          <p className="text-sm text-muted">
            Ranked to your {profile?.career_goal ?? "career"} goal.
          </p>
          <div className="mt-4 grid gap-4">
            {peopleToMeet.map((m) => {
              const ig = instagramLink(m);
              return (
                <div key={m.id} className="card flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">
                        {m.name}
                        {m.is_alumni && (
                          <span className="chip ml-2">alum</span>
                        )}
                      </div>
                      <div className="text-sm text-muted">{m.role}</div>
                      {m.relevance && (
                        <p className="mt-2 text-sm text-foreground/90">
                          {m.relevance}
                        </p>
                      )}
                      {m.career_tags?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {m.career_tags.map((t) => (
                            <span key={t} className="chip capitalize">
                              {t.replace("_", " ")}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActive(m)}
                      className="btn-accent px-4 py-2 text-sm"
                    >
                      Draft coffee chat
                    </button>
                    <a
                      href={linkedinConnect(m, club)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost px-4 py-2 text-sm"
                    >
                      Connect on LinkedIn
                    </a>
                    {ig && (
                      <a
                        href={ig}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-ghost px-4 py-2 text-sm"
                      >
                        Follow on IG
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Full roster */}
        {members.length > peopleToMeet.length && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold">Full roster</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border border-border px-4 py-2 text-sm"
                >
                  <span>
                    {m.name}
                    <span className="text-muted"> · {m.role}</span>
                  </span>
                  <a
                    href={linkedinConnect(m, club)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted hover:text-accent-2"
                  >
                    in ↗
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {active && (
        <CoffeeChatDrawer
          member={active}
          club={club}
          profile={profile}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-sm font-medium">{value ?? "—"}</div>
    </div>
  );
}
