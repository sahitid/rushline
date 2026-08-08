"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import NetworkGraph, {
  type GraphLink,
  type GraphNode,
} from "@/components/NetworkGraph";
import { getSupabase } from "@/lib/supabase";
import { scoreClub } from "@/lib/rank";
import type { Club, Member, Profile } from "@/lib/types";

export default function NetworkPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabase();
    (async () => {
      const { data: userData } = await sb.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      const [{ data: prof }, { data: clubRows }, { data: memRows }] =
        await Promise.all([
          sb.from("profiles").select("*").eq("id", userData.user.id).maybeSingle(),
          sb.from("clubs").select("*"),
          sb.from("members").select("*"),
        ]);
      setProfile(prof as Profile | null);
      setClubs((clubRows as Club[]) ?? []);
      setMembers((memRows as Member[]) ?? []);
      setLoading(false);
    })();
  }, [router]);

  const { nodes, links, target, path } = useMemo(() => {
    const goal = profile?.career_goal ?? null;
    const targets = profile?.target_clubs ?? [];
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    const youId = "you";
    nodes.push({
      id: youId,
      label: profile?.full_name || "You",
      kind: "you",
      onPath: true,
    });

    const rankedClubs = [...clubs].sort(
      (a, b) => scoreClub(b, goal, targets) - scoreClub(a, goal, targets)
    );
    const target = rankedClubs[0];

    // Pick the strongest connector into the target club for the highlighted path.
    let pathMember: Member | null = null;
    if (target) {
      const targetMembers = members.filter((m) => m.club_id === target.id);
      pathMember =
        targetMembers.find((m) =>
          goal ? m.career_tags?.includes(goal) : false
        ) ??
        targetMembers.find((m) => m.is_alumni) ??
        targetMembers[0] ??
        null;
    }

    rankedClubs.slice(0, 5).forEach((club) => {
      const isTarget = target && club.id === target.id;
      nodes.push({
        id: club.id,
        label: club.name,
        kind: "club",
        onPath: Boolean(isTarget),
      });
      const clubMembers = members.filter((m) => m.club_id === club.id).slice(0, 5);
      clubMembers.forEach((m) => {
        const onPath = pathMember?.id === m.id;
        nodes.push({
          id: m.id,
          label: m.name,
          kind: m.is_alumni ? "alum" : "member",
          onPath,
        });
        links.push({ source: club.id, target: m.id, onPath });
        // Simulate an existing connection: alumni you're "linked" to feed back to you.
        if (m.is_alumni || onPath) {
          links.push({ source: youId, target: m.id, onPath });
        }
      });
      // You are exploring every ranked club.
      links.push({ source: youId, target: club.id, onPath: Boolean(isTarget) });
    });

    return { nodes, links, target, path: pathMember };
  }, [clubs, members, profile]);

  return (
    <>
      <NavBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        <h1 className="text-2xl font-bold">Your social web</h1>
        <p className="mt-1 text-sm text-muted">
          Who you know, who&apos;s in each club, and the shortest path into your
          top target.
        </p>

        {target && path && (
          <div className="card mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 p-4 text-sm">
            <span className="text-muted">Your move:</span>
            <span className="font-medium text-accent">
              Reach out to {path.name}
            </span>
            <span className="text-muted">
              ({path.role}
              {path.is_alumni ? ", alum" : ""}) — your strongest path into
            </span>
            <span className="font-medium text-accent-2">{target.name}</span>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3 text-xs text-muted">
          <Legend color="#ff5a3c" label="You / path in" />
          <Legend color="#7c5cff" label="Clubs" />
          <Legend color="#4ea8ff" label="Members" />
          <Legend color="#59d499" label="Alumni" />
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="flex h-[600px] items-center justify-center rounded-2xl border border-border text-sm text-muted">
              Building your graph…
            </div>
          ) : (
            <NetworkGraph nodes={nodes} links={links} />
          )}
        </div>
      </main>
    </>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
