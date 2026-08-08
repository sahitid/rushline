import type { CareerGoal, Club } from "./types";

const CATEGORY_AFFINITY: Record<string, CareerGoal[]> = {
  consulting: ["consulting", "finance"],
  finance: ["finance", "quant", "consulting"],
  tech: ["big_tech", "startups"],
  vc: ["startups", "finance"],
  design: ["startups", "big_tech"],
};

const GOAL_LABEL: Record<CareerGoal, string> = {
  consulting: "consulting",
  startups: "startups",
  big_tech: "big tech",
  quant: "quant",
  finance: "finance",
};

export function scoreClub(
  club: Club,
  goal: CareerGoal | null,
  targetTypes: string[]
): number {
  let score = 0;
  const cat = (club.category ?? "").toLowerCase();
  if (goal) {
    const affinities = CATEGORY_AFFINITY[cat] ?? [];
    if (affinities[0] === goal) score += 60;
    else if (affinities.includes(goal)) score += 35;
  }
  if (targetTypes.some((t) => cat.includes(t.toLowerCase()) || t.toLowerCase().includes(cat))) {
    score += 30;
  }
  return score;
}

export function matchReason(
  club: Club,
  goal: CareerGoal | null,
  targetTypes: string[]
): string {
  const cat = (club.category ?? "club").toLowerCase();
  const goalLabel = goal ? GOAL_LABEL[goal] : null;
  if (goalLabel && (CATEGORY_AFFINITY[cat] ?? []).includes(goal!)) {
    return `Strong fit for your ${goalLabel} goal — ${club.name} is a ${cat} org with a direct pipeline into ${goalLabel} roles.`;
  }
  if (targetTypes.some((t) => cat.includes(t.toLowerCase()))) {
    return `Matches your target of ${cat} clubs at ${club.school}.`;
  }
  return `A notable ${cat} org at ${club.school} worth a look.`;
}
