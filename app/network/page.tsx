"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import NetworkGraph, {
  type GraphLink,
  type GraphNode,
} from "@/components/NetworkGraph";
import { getSupabase } from "@/lib/supabase";
import { scoreClub } from "@/lib/rank";
import type { Club, Member, Profile } from "@/lib/types";
import { useSchool } from "@/components/SchoolProvider";

export default function NetworkPage() {
  const router = useRouter();
  const { school, ready } = useSchool();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    const sb = getSupabase();
    (async () => {
      setLoading(true);
      const { data: userData } = await sb.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      const [{ data: prof }, { data: clubRows }] = await Promise.all([
        sb.from("profiles").select("*").eq("id", userData.user.id).maybeSingle(),
        sb.from("clubs").select("*").eq("school", school),
      ]);
      const schoolClubs = (clubRows as Club[]) ?? [];
      setProfile(prof as Profile | null);
      setClubs(schoolClubs);
      const ids = schoolClubs.map((c) => c.id);
      if (ids.length) {
        const { data: memRows } = await sb.from("members").select("*").in("club_id", ids);
        setMembers((memRows as Member[]) ?? []);
      } else {
        setMembers([]);
      }
      setLoading(false);
    })();
  }, [router, school, ready]);

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
    <div style={{ display: "flex", minHeight: "100vh", background: "#FAFAF7" }}>
      <Sidebar />
      <main style={{ flex: 1, height: "100vh", overflowY: "auto", padding: "40px 48px" }}>
        <div style={{ marginBottom: 20 }}>
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
            Your web
          </h1>
          <p style={{ fontSize: 14, color: "#8C8C85" }}>
            Who you know, who&apos;s in each club, and the shortest path into
            your top target.
          </p>
        </div>

        {target && path && (
          <div
            style={{
              background: "#EBEBFF",
              border: "1px solid #C7C7FF",
              borderRadius: 14,
              padding: "14px 18px",
              marginBottom: 20,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 6,
              fontSize: 14,
              maxWidth: 900,
            }}
          >
            <span style={{ color: "#8C8C85" }}>Your move:</span>
            <span style={{ fontWeight: 600, color: "#3B3BFF" }}>
              Reach out to {path.name}
            </span>
            <span style={{ color: "#4A4A44" }}>
              ({path.role}
              {path.is_alumni ? ", alum" : ""}) — your strongest path into
            </span>
            <span style={{ fontWeight: 600, color: "#0F0F0E" }}>{target.name}</span>
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 16 }}>
          <Legend color="#3B3BFF" label="You / path in" />
          <Legend color="#1A1A2E" label="Clubs" />
          <Legend color="#0A3D62" label="Members" />
          <Legend color="#7B2D00" label="Alumni" />
        </div>

        <div style={{ maxWidth: 1100 }}>
          {loading ? (
            <div
              style={{
                height: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 20,
                border: "1px solid #E8E8E3",
                background: "#FFFFFF",
                fontSize: 14,
                color: "#8C8C85",
              }}
            >
              Building your graph…
            </div>
          ) : (
            <NetworkGraph nodes={nodes} links={links} />
          )}
        </div>
      </main>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          display: "inline-block",
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: color,
        }}
      />
      <span style={{ fontSize: 12, color: "#8C8C85" }}>{label}</span>
    </span>
  );
}
