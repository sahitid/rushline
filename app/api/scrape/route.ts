import { NextResponse } from "next/server";
import { scrapeClub } from "@/lib/scrape/pipeline";
import { saveClub } from "@/lib/db";

export const maxDuration = 120;

export async function POST(req: Request) {
  const { school, clubName } = await req.json();
  if (!school || !clubName) {
    return NextResponse.json({ error: "school and clubName are required" }, { status: 400 });
  }
  try {
    const intel = await scrapeClub(String(school).trim(), String(clubName).trim());
    const saved = saveClub(intel);
    return NextResponse.json({ club: saved });
  } catch (err) {
    console.error("scrape failed", err);
    return NextResponse.json({ error: "Scrape failed. Try again." }, { status: 500 });
  }
}
