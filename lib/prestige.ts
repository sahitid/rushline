import type { CareerGoal, Club, Member } from "./types";

/** Higher = more prestigious for ranking. */
export type PrestigeHit = {
  firm: string;
  tier: number;
  points: number;
  memberName: string;
  track: PrestigeTrack;
};

export type PrestigeTrack = "tech" | "quant" | "finance" | "consulting";

type FirmEntry = {
  name: string;
  aliases: string[];
  tier: number;
  points: number;
  track: PrestigeTrack;
};

const TECH_T1: FirmEntry[] = [
  { name: "Jane Street", aliases: ["jane street"], tier: 1, points: 40, track: "quant" },
  { name: "Citadel", aliases: ["citadel securities", "citadel"], tier: 1, points: 40, track: "quant" },
  { name: "HRT", aliases: ["hudson river trading", "hrt"], tier: 1, points: 40, track: "quant" },
  { name: "Jump Trading", aliases: ["jump trading"], tier: 1, points: 40, track: "quant" },
  { name: "Two Sigma", aliases: ["two sigma"], tier: 1, points: 38, track: "quant" },
  { name: "D.E. Shaw", aliases: ["d.e. shaw", "de shaw", "deshaw"], tier: 1, points: 38, track: "quant" },
  { name: "Optiver", aliases: ["optiver"], tier: 1, points: 36, track: "quant" },
  { name: "IMC", aliases: ["imc trading", "imc"], tier: 1, points: 36, track: "quant" },
  { name: "SIG", aliases: ["susquehanna"], tier: 1, points: 36, track: "quant" },
  { name: "Five Rings", aliases: ["five rings"], tier: 1, points: 36, track: "quant" },
  { name: "Peak6", aliases: ["peak6"], tier: 1, points: 32, track: "quant" },
  { name: "OpenAI", aliases: ["openai"], tier: 1, points: 40, track: "tech" },
  { name: "Anthropic", aliases: ["anthropic"], tier: 1, points: 40, track: "tech" },
  { name: "Cursor", aliases: ["cursor", "anysphere"], tier: 1, points: 38, track: "tech" },
  { name: "Renaissance", aliases: ["renaissance technologies", "rentech"], tier: 1, points: 40, track: "quant" },
];

const TECH_T2: FirmEntry[] = [
  { name: "NVIDIA", aliases: ["nvidia"], tier: 2, points: 28, track: "tech" },
  { name: "Stripe", aliases: ["stripe"], tier: 2, points: 28, track: "tech" },
  { name: "Databricks", aliases: ["databricks"], tier: 2, points: 28, track: "tech" },
  { name: "Datadog", aliases: ["datadog"], tier: 2, points: 26, track: "tech" },
  { name: "Ramp", aliases: ["ramp"], tier: 2, points: 28, track: "tech" },
  { name: "SpaceX", aliases: ["spacex"], tier: 2, points: 30, track: "tech" },
  { name: "Netflix", aliases: ["netflix"], tier: 2, points: 24, track: "tech" },
  { name: "Snowflake", aliases: ["snowflake"], tier: 2, points: 24, track: "tech" },
  { name: "Palantir", aliases: ["palantir"], tier: 2, points: 28, track: "tech" },
  { name: "YC", aliases: ["y combinator", "yc batch"], tier: 2, points: 26, track: "tech" },
];

const TECH_T3: FirmEntry[] = [
  { name: "Google", aliases: ["google", "alphabet", "youtube"], tier: 3, points: 20, track: "tech" },
  { name: "Meta", aliases: ["meta", "facebook"], tier: 3, points: 20, track: "tech" },
  { name: "Apple", aliases: ["apple"], tier: 3, points: 20, track: "tech" },
  { name: "Microsoft", aliases: ["microsoft", "azure"], tier: 3, points: 18, track: "tech" },
  { name: "Amazon", aliases: ["amazon", "aws"], tier: 3, points: 16, track: "tech" },
  { name: "Uber", aliases: ["uber"], tier: 3, points: 14, track: "tech" },
  { name: "Airbnb", aliases: ["airbnb"], tier: 3, points: 14, track: "tech" },
  { name: "Roblox", aliases: ["roblox"], tier: 3, points: 14, track: "tech" },
  { name: "Tesla", aliases: ["tesla"], tier: 3, points: 16, track: "tech" },
  { name: "Bloomberg", aliases: ["bloomberg"], tier: 3, points: 14, track: "tech" },
  { name: "Visa", aliases: ["visa"], tier: 3, points: 14, track: "tech" },
  { name: "PayPal", aliases: ["paypal"], tier: 3, points: 12, track: "tech" },
  { name: "LinkedIn", aliases: ["linkedin"], tier: 3, points: 12, track: "tech" },
  { name: "Spotify", aliases: ["spotify"], tier: 3, points: 12, track: "tech" },
  { name: "IBM", aliases: ["ibm"], tier: 3, points: 10, track: "tech" },
];

const IB_FIRMS: FirmEntry[] = [
  { name: "Goldman Sachs", aliases: ["goldman sachs", "goldman"], tier: 1, points: 40, track: "finance" },
  { name: "J.P. Morgan", aliases: ["j.p. morgan", "jp morgan", "jpmorgan", "jpm"], tier: 1, points: 40, track: "finance" },
  { name: "Morgan Stanley", aliases: ["morgan stanley"], tier: 1, points: 38, track: "finance" },
  { name: "Citi", aliases: ["citigroup", "citi ib"], tier: 1, points: 34, track: "finance" },
  { name: "Bank of America", aliases: ["bank of america", "bofa", "merrill"], tier: 1, points: 34, track: "finance" },
  { name: "Barclays", aliases: ["barclays"], tier: 1, points: 30, track: "finance" },
  { name: "Deutsche Bank", aliases: ["deutsche bank"], tier: 1, points: 28, track: "finance" },
  { name: "UBS", aliases: ["ubs"], tier: 1, points: 28, track: "finance" },
  { name: "Wells Fargo", aliases: ["wells fargo"], tier: 1, points: 26, track: "finance" },
  { name: "Evercore", aliases: ["evercore"], tier: 1, points: 40, track: "finance" },
  { name: "Centerview", aliases: ["centerview partners", "centerview"], tier: 1, points: 40, track: "finance" },
  { name: "Lazard", aliases: ["lazard"], tier: 1, points: 36, track: "finance" },
  { name: "Qatalyst", aliases: ["qatalyst"], tier: 1, points: 38, track: "finance" },
  { name: "PJT", aliases: ["pjt partners", "pjt"], tier: 1, points: 36, track: "finance" },
  { name: "Moelis", aliases: ["moelis"], tier: 1, points: 34, track: "finance" },
  { name: "Jefferies", aliases: ["jefferies"], tier: 2, points: 28, track: "finance" },
  { name: "Piper Sandler", aliases: ["piper sandler"], tier: 2, points: 24, track: "finance" },
  { name: "William Blair", aliases: ["william blair"], tier: 2, points: 24, track: "finance" },
  { name: "Blackstone", aliases: ["blackstone"], tier: 1, points: 34, track: "finance" },
  { name: "KKR", aliases: ["kkr"], tier: 1, points: 32, track: "finance" },
];

const CONSULTING_FIRMS: FirmEntry[] = [
  { name: "McKinsey", aliases: ["mckinsey"], tier: 1, points: 40, track: "consulting" },
  { name: "Bain", aliases: ["bain & company", "bain company", "bain aci", "bain"], tier: 1, points: 40, track: "consulting" },
  { name: "BCG", aliases: ["boston consulting", "bcg"], tier: 1, points: 40, track: "consulting" },
  { name: "Deloitte", aliases: ["deloitte", "monitor deloitte"], tier: 2, points: 26, track: "consulting" },
  { name: "EY", aliases: ["ey-parthenon", "ey parthenon", "ernst & young", "ernst young"], tier: 2, points: 24, track: "consulting" },
  { name: "PwC", aliases: ["pwc"], tier: 2, points: 24, track: "consulting" },
  { name: "KPMG", aliases: ["kpmg"], tier: 2, points: 22, track: "consulting" },
  { name: "Oliver Wyman", aliases: ["oliver wyman"], tier: 3, points: 20, track: "consulting" },
  { name: "Kearney", aliases: ["a.t. kearney", "at kearney", "kearney"], tier: 3, points: 18, track: "consulting" },
  { name: "L.E.K.", aliases: ["l.e.k", "lek consulting"], tier: 3, points: 18, track: "consulting" },
  { name: "Accenture", aliases: ["accenture"], tier: 3, points: 14, track: "consulting" },
];

const ALL_FIRMS: FirmEntry[] = [
  ...TECH_T1,
  ...TECH_T2,
  ...TECH_T3,
  ...IB_FIRMS,
  ...CONSULTING_FIRMS,
];

/** Exported for scrapers — canonical firm names + aliases to match in page text. */
export const KNOWN_FIRM_ALIASES: { name: string; aliases: string[] }[] = ALL_FIRMS.map(
  (f) => ({ name: f.name, aliases: f.aliases })
);

function trackWeight(track: PrestigeTrack, goal: CareerGoal | null, targets: string[]): number {
  const t = new Set((targets ?? []).map((x) => x.toLowerCase()));
  if (goal === "big_tech" || goal === "startups") {
    if (track === "tech") return 1;
    if (track === "quant") return 0.85;
    if (track === "finance") return 0.2;
    if (track === "consulting") return t.has("consulting") ? 0.22 : 0.08;
  }
  if (goal === "quant") {
    if (track === "quant") return 1;
    if (track === "tech") return 0.55;
    if (track === "finance") return 0.45;
    return 0.12;
  }
  if (goal === "finance") {
    if (track === "finance") return 1;
    if (track === "quant") return 0.7;
    if (track === "tech") return 0.25;
    return 0.12;
  }
  if (goal === "consulting") {
    if (track === "consulting") return 1;
    if (track === "tech") return t.has("tech") ? 0.28 : 0.12;
    if (track === "finance") return 0.22;
    return 0.18;
  }
  return 0.5;
}

function findFirmsInText(text: string): FirmEntry[] {
  const hits: FirmEntry[] = [];
  const lower = text.toLowerCase();
  for (const f of ALL_FIRMS) {
    const matched = f.aliases.some((a) => {
      const alias = a.toLowerCase().trim();
      if (alias.length <= 3) {
        return new RegExp(
          `(?:^|[^a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:[^a-z0-9]|$)`
        ).test(lower);
      }
      return lower.includes(alias);
    });
    if (matched) hits.push(f);
  }
  return hits;
}

function resolveFirmName(name: string): FirmEntry | null {
  const lower = name.toLowerCase().trim();
  if (lower === "aws") return ALL_FIRMS.find((f) => f.name === "Amazon") ?? null;
  return (
    ALL_FIRMS.find(
      (f) =>
        f.name.toLowerCase() === lower ||
        f.aliases.some((a) => a.toLowerCase() === lower)
    ) ??
    findFirmsInText(name)[0] ??
    null
  );
}

function memberBlob(m: Member): string {
  return `${m.relevance ?? ""} ${m.role ?? ""} ${(m.talking_points ?? []).join(" ")}`.toLowerCase();
}

export type ClubPlacement = { firm: string; source?: string };

/**
 * Prestige from (1) member bios and (2) scraped club-site placements in DB.
 * No hardcoded per-club lists — scrapers fill `placements`.
 */
export function clubPrestige(
  members: Member[],
  goal: CareerGoal | null,
  targets: string[],
  scrapedPlacements: ClubPlacement[] = [],
  _club?: Pick<Club, "slug" | "name"> | null
) {
  const hits: PrestigeHit[] = [];

  for (const m of members) {
    const text = memberBlob(m);
    if (text.length < 4) continue;
    const found = findFirmsInText(text);
    found.sort(
      (a, b) =>
        b.points * trackWeight(b.track, goal, targets) -
        a.points * trackWeight(a.track, goal, targets)
    );
    const f = found[0];
    if (!f) continue;
    const w = trackWeight(f.track, goal, targets) * (m.is_alumni ? 0.9 : 1);
    if (w < 0.12) continue;
    hits.push({
      firm: f.name,
      tier: f.tier,
      points: f.points * w,
      memberName: m.name,
      track: f.track,
    });
  }

  for (const p of scrapedPlacements) {
    const f = resolveFirmName(p.firm);
    if (!f) continue;
    const w = trackWeight(f.track, goal, targets);
    if (w < 0.12) continue;
    if (hits.some((h) => h.firm === f.name)) continue;
    hits.push({
      firm: f.name,
      tier: f.tier,
      points: f.points * w * 0.95,
      memberName: "site placements",
      track: f.track,
    });
  }

  hits.sort((a, b) => b.points - a.points);
  const top = hits.slice(0, 6);
  let score = 0;
  top.forEach((h, i) => {
    score += h.points * (i === 0 ? 1 : i === 1 ? 0.5 : i === 2 ? 0.35 : 0.2);
  });
  const points = Math.min(40, Math.round(score * 0.5));
  const best = top[0] ?? null;
  const goalAligned = top.filter((h) => trackWeight(h.track, goal, targets) >= 0.7);

  return {
    points,
    hits: top,
    best,
    hitCount: hits.length,
    summary: best
      ? `${best.firm}${
          goalAligned.length > 1
            ? ` +${goalAligned.length - 1} ${goal ?? "career"}-aligned`
            : hits.length > 1
              ? ` +${hits.length - 1} placement signals`
              : ""
        }`
      : null,
  };
}
