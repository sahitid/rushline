import type { ClubIntel, GraphData, UserProfile } from "./types";

export function buildGraph(user: UserProfile | null, clubs: ClubIntel[]): GraphData {
  const nodes: GraphData["nodes"] = [];
  const links: GraphData["links"] = [];
  const nodeIds = new Set<string>();

  const add = (node: GraphData["nodes"][number]) => {
    if (!nodeIds.has(node.id)) {
      nodeIds.add(node.id);
      nodes.push(node);
    }
  };

  add({
    id: "you",
    label: user?.name || "You",
    type: "you",
    meta: user ? `${user.major} · ${user.careerGoal}` : "Complete onboarding",
  });

  if (user?.school) {
    add({ id: "school", label: user.school, type: "school" });
    links.push({ source: "you", target: "school", kind: "attends" });
  }

  for (const club of clubs) {
    const clubId = `club:${club.id}`;
    add({
      id: clubId,
      label: club.name,
      type: "club",
      meta: `${club.matchScore}% match`,
      priority: club.matchScore,
      url: `/clubs/${club.id}`,
    });
    links.push({ source: "you", target: clubId, kind: "interested" });
    if (nodeIds.has("school")) {
      links.push({ source: clubId, target: "school", kind: "part_of" });
    }

    for (const person of club.people.slice(0, 10)) {
      const pid = `person:${person.name.toLowerCase()}`;
      add({
        id: pid,
        label: person.name,
        type: "person",
        meta: `${person.role}${person.isAlumni ? " (alumni)" : ""}`,
        priority: person.contactPriority,
        url: person.linkedinUrl,
      });
      links.push({ source: clubId, target: pid, kind: "member" });
      if (person.contactPriority >= 75) {
        links.push({ source: "you", target: pid, kind: "should_contact" });
      }
    }

    for (const client of club.clients.slice(0, 8)) {
      const cid = `company:${client.toLowerCase()}`;
      add({ id: cid, label: client, type: "company", meta: "Past client" });
      links.push({ source: clubId, target: cid, kind: "client" });
    }
  }

  return { nodes, links };
}
