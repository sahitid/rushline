import { NextResponse } from "next/server";
import { getClubs, getUser } from "@/lib/db";
import { computeMatch } from "@/lib/synthesize";

export async function GET() {
  const user = getUser();
  // Recompute match scores so they stay fresh as the profile changes
  const clubs = getClubs().map((club) => {
    const match = computeMatch(user, `${club.name} ${club.description} ${club.category}`, club.category);
    return { ...club, matchScore: match.score, matchReasons: match.reasons };
  });
  clubs.sort((a, b) => b.matchScore - a.matchScore);
  return NextResponse.json({ clubs });
}
