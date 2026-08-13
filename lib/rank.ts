import type {
  CareerGoal,
  Club,
  LinkedInExperience,
  MatchBreakdown,
  Member,
  Profile,
  UserConnection,
} from "./types";
import { linkedinSlug } from "./linkedin";
import { clubPrestige } from "./prestige";

const CATEGORY_AFFINITY: Record<string, CareerGoal[]> = {
  consulting: ["consulting", "finance"],
  finance: ["finance", "quant", "consulting"],
  tech: ["big_tech", "startups"],
  vc: ["startups", "finance"],
  design: ["startups", "big_tech"],
};

const GOAL_KEYWORDS: Record<CareerGoal, string[]> = {
  big_tech: [
    "app",
    "software",
    "data",
    "ai",
    "ml",
    "robot",
    "hack",
    "product",
    "digital",
    "computing",
    "code",
    "silicon",
    "drone",
    "autonomous",
    "web",
    "mobile",
  ],
  consulting: ["consult", "strategy", "case", "advisory"],
  finance: ["finance", "invest", "capital", "equity", "banking", "trading", "wall street"],
  quant: ["quant", "trading", "math", "statistics", "data science", "algo"],
  startups: ["startup", "venture", "entrepreneur", "founder", "eship"],
};

const GOAL_LABEL: Record<CareerGoal, string> = {
  consulting: "consulting",
  startups: "startups",
  big_tech: "big tech",
  quant: "quant",
  finance: "finance",
};

export type RankContext = {
  profile: Profile | null;
  connections: UserConnection[];
  members: Member[];
  /** club_id → scraped placement firms from club sites */
  placementsByClubId?: Record<string, { firm: string; source?: string }[]>;
};

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function categoryAffinity(
  club: Club,
  goal: CareerGoal | null,
  targetTypes: string[]
): number {
  const cat = (club.category ?? "").toLowerCase();
  let score = 0;
  if (goal) {
    const affinities = CATEGORY_AFFINITY[cat] ?? [];
    // Primary career goal is the main category signal
    if (affinities[0] === goal) score = 1;
    else if (affinities.includes(goal)) score = 0.45;
    else score = 0.08; // off-goal categories stay low
  }
  // Target club types are a light nudge only — never override the career goal
  if (
    targetTypes.some(
      (t) => cat.includes(t.toLowerCase()) || t.toLowerCase().includes(cat)
    )
  ) {
    score = Math.min(1, score + 0.12);
  }
  return score;
}

function connectionWeight(m: Member): number {
  return m.is_alumni ? 0.5 : 1;
}

function clubMembers(clubId: string, members: Member[]): Member[] {
  return members.filter((m) => m.club_id === clubId);
}

function degreeHits(
  clubMembersList: Member[],
  connections: UserConnection[],
  degree: 1 | 2
): { weighted: number; names: string[] } {
  const bySlug = new Map<string, UserConnection>();
  for (const c of connections) {
    if (c.degree !== degree) continue;
    bySlug.set(c.connected_linkedin_slug.toLowerCase(), c);
  }
  let weighted = 0;
  const names: string[] = [];
  for (const m of clubMembersList) {
    const slug = linkedinSlug(m.linkedin_url);
    if (!slug || !bySlug.has(slug)) continue;
    weighted += connectionWeight(m);
    names.push(m.name + (m.is_alumni ? " (alum)" : ""));
  }
  return { weighted, names };
}

function profileExperiences(profile: Profile | null): LinkedInExperience[] {
  return profile?.linkedin_experiences ?? [];
}

function keywordHits(club: Club, goal: CareerGoal | null): number {
  if (!goal) return 0;
  const blob = norm(`${club.name} ${club.slug} ${club.tagline ?? ""} ${club.category ?? ""}`);
  let hits = 0;
  for (const k of GOAL_KEYWORDS[goal] ?? []) {
    if (blob.includes(k)) hits += 1;
  }
  return hits;
}

function goalTagSet(profile: Profile): Set<string> {
  const tags = new Set<string>([
    ...(profile.career_goal ? [profile.career_goal] : []),
    ...(profile.target_clubs ?? []),
  ]);
  if (tags.has("tech")) {
    tags.add("big_tech");
    tags.add("startups");
  }
  if (tags.has("big_tech")) tags.add("tech");
  return tags;
}

function alumniPenaltyPoints(members: Member[]): number {
  if (members.length < 3) return 0;
  const alum = members.filter((m) => m.is_alumni).length;
  const ratio = alum / members.length;
  if (ratio >= 0.7) return 4;
  if (ratio >= 0.5) return 2;
  return 0;
}

type InterestBundle = {
  value: number;
  basePoints: number;
  prestigePoints: number;
  tagHits: number;
  poolSize: number;
  density: number;
  keywordHits: number;
  orgHit: boolean;
  prestigeSummary: string | null;
  prestigeBest: string | null;
};

function interestBundle(
  club: Club,
  profile: Profile | null,
  members: Member[],
  scrapedPlacements: { firm: string; source?: string }[] = []
): InterestBundle {
  if (!profile) {
    return {
      value: 0,
      basePoints: 0,
      prestigePoints: 0,
      tagHits: 0,
      poolSize: 0,
      density: 0,
      keywordHits: 0,
      orgHit: false,
      prestigeSummary: null,
      prestigeBest: null,
    };
  }

  const goal = profile.career_goal;
  const targets = profile.target_clubs ?? [];
  const cat = categoryAffinity(club, goal, targets);
  const kw = keywordHits(club, goal);
  const tags = goalTagSet(profile);

  const current = members.filter((m) => !m.is_alumni);
  const pool = current.length ? current : members;
  let tagHits = 0;
  for (const m of pool) {
    if ((m.career_tags ?? []).some((t) => tags.has(t))) tagHits += 1;
  }
  const density = pool.length ? tagHits / pool.length : 0;

  const clubNorm = norm(club.name);
  const slugNorm = norm(club.slug.replace(/-/g, " "));
  let orgHit = false;
  for (const e of profileExperiences(profile)) {
    const org = norm(e.org ?? "");
    const title = norm(e.title ?? "");
    if (
      (org && (org.includes(clubNorm) || clubNorm.includes(org) || org.includes(slugNorm))) ||
      (title && (title.includes(clubNorm) || title.includes(slugNorm)))
    ) {
      orgHit = true;
      break;
    }
  }

  const prestige = clubPrestige(
    pool,
    goal,
    targets,
    scrapedPlacements,
    club
  );

  // Base interest deliberately capped so prestige + name signal can separate clubs.
  // Category alone must NOT pin every on-goal club at the same score.
  let base = 6;
  base += Math.round(10 * cat); // +0–10 (was 14 — leave room for roster/name)
  // Tag hits: log scale so 2 vs 20 members both matter, but don't saturate.
  base += Math.min(14, Math.round(6 * Math.log2(1 + tagHits)));
  // Density helps, but all-tagged rosters get dampened (common in seed data).
  const densityScore = density >= 0.9 ? 4 : Math.round(10 * density);
  base += densityScore;
  // Name/mission keywords are the main differentiator without placements.
  base += Math.min(16, kw * 3);
  if (orgHit) base += 8;
  // Tiny roster-size bump; prefer quality over headcount.
  base += Math.min(4, Math.floor(Math.sqrt(pool.length)));
  // Sparse/empty rosters shouldn't look like strong matches.
  if (pool.length === 0) base = Math.min(base, 12);
  else if (pool.length < 3) base = Math.min(base, base - 2 + pool.length);

  const prestigePoints = prestige.points; // 0–40
  const total = base + prestigePoints;
  const value = Math.max(0, Math.min(1, total / 90));

  return {
    value,
    basePoints: base,
    prestigePoints,
    tagHits,
    poolSize: pool.length,
    density,
    keywordHits: kw,
    orgHit,
    prestigeSummary: prestige.summary,
    prestigeBest: prestige.best?.firm ?? null,
  };
}

export function scoreClubDetailed(
  club: Club,
  ctx: RankContext
): { score: number; breakdown: MatchBreakdown } {
  const goal = ctx.profile?.career_goal ?? null;
  const targets = ctx.profile?.target_clubs ?? [];
  const roster = clubMembers(club.id, ctx.members);
  const scraped = ctx.placementsByClubId?.[club.id] ?? [];

  const d1 = degreeHits(roster, ctx.connections, 1);
  const d2 = degreeHits(roster, ctx.connections, 2);
  const interest = interestBundle(club, ctx.profile, roster, scraped);
  const cat = categoryAffinity(club, goal, targets);
  const pen = alumniPenaltyPoints(roster);

  let score: number;
  if (d1.weighted >= 1 || d2.weighted >= 1) {
    const d1Steps = Math.min(4, Math.floor(d1.weighted));
    const d2Steps = Math.min(2, Math.floor(d2.weighted / 3));
    const interestBump = Math.min(4, Math.round(interest.value * 4));
    score = 88 + 2 * d1Steps + d2Steps + interestBump - pen;
  } else {
    // Interest + prestige; hard cap under network tier
    score = Math.max(0, Math.min(86, interest.basePoints + interest.prestigePoints - pen));
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    breakdown: {
      d1: d1.weighted,
      d2: d2.weighted,
      overlap: interest.value,
      cat,
      alumniPenalty: pen / 100,
      d1Names: d1.names,
    },
  };
}

export function scoreClub(
  club: Club,
  goal: CareerGoal | null,
  targetTypes: string[],
  ctx?: RankContext
): number {
  if (ctx) return scoreClubDetailed(club, ctx).score;
  return scoreClubDetailed(club, {
    profile: {
      id: "",
      full_name: null,
      school: null,
      career_goal: goal,
      linkedin_url: null,
      target_clubs: targetTypes,
    },
    connections: [],
    members: [],
  }).score;
}

export function matchReason(
  club: Club,
  goal: CareerGoal | null,
  targetTypes: string[],
  ctx?: RankContext
): string {
  const full = ctx ?? {
    profile: {
      id: "",
      full_name: null,
      school: null,
      career_goal: goal,
      linkedin_url: null,
      target_clubs: targetTypes,
    },
    connections: [],
    members: [],
  };
  const roster = clubMembers(club.id, full.members);
  const scraped = full.placementsByClubId?.[club.id] ?? [];
  const { breakdown } = scoreClubDetailed(club, full);
  const interest = interestBundle(club, full.profile, roster, scraped);
  const goalLabel = goal ? GOAL_LABEL[goal] : null;
  const cat = (club.category ?? "club").toLowerCase();

  if (breakdown.d1 >= 1) {
    const who = breakdown.d1Names.slice(0, 2).join(", ");
    const extra =
      breakdown.d1Names.length > 2 ? ` +${breakdown.d1Names.length - 2}` : "";
    return `${Math.round(breakdown.d1)} first-degree connection${breakdown.d1 === 1 ? "" : "s"} in this club${who ? ` (incl. ${who}${extra})` : ""}`;
  }

  if (breakdown.d2 >= 1) {
    return `${Math.round(breakdown.d2)} second-degree path${breakdown.d2 === 1 ? "" : "s"} into this club`;
  }

  if (interest.prestigeSummary) {
    return `Placement signal: ${interest.prestigeSummary}`;
  }

  if (interest.orgHit) {
    return `Listed on your LinkedIn / experience history`;
  }

  if (interest.keywordHits >= 2 && goalLabel) {
    return `Name & mission match ${goalLabel} (${interest.tagHits}/${interest.poolSize} roster tagged)`;
  }

  if (interest.tagHits >= 1 && goalLabel) {
    const pct = interest.poolSize ? Math.round(100 * interest.density) : 0;
    return `${interest.tagHits}/${interest.poolSize || "?"} members align with ${goalLabel}${pct ? ` (${pct}%)` : ""} — no elite placement text yet`;
  }

  if (breakdown.cat >= 0.7 && goalLabel) {
    return `${cat} category fit for ${goalLabel}`;
  }

  return `Limited interest signal for ${club.name}`;
}

export function matchSubline(
  breakdown: MatchBreakdown,
  hasLinkedIn: boolean
): string | null {
  const bits: string[] = [];
  if (breakdown.d1 > 0) bits.push(`${Math.round(breakdown.d1)} first`);
  if (breakdown.d2 > 0) bits.push(`${Math.round(breakdown.d2)} second`);
  if (breakdown.overlap >= 0.55) bits.push("strong interest");
  else if (breakdown.overlap >= 0.3) bits.push("interest fit");
  if (!bits.length && !hasLinkedIn) {
    return "Goals + placements · LinkedIn unlocks network scores";
  }
  if (!bits.length) return null;
  return bits.join(" · ");
}
