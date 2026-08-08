import { NextResponse } from "next/server";
import { getUser, saveUser } from "@/lib/db";
import { extractKeywords } from "@/lib/synthesize";

export async function GET() {
  return NextResponse.json({ user: getUser() });
}

export async function POST(req: Request) {
  const body = await req.json();
  const keywords = extractKeywords(
    [body.linkedinBlurb, body.clubGoals, body.careerGoal, body.major].filter(Boolean).join(" ")
  );
  const user = saveUser({
    name: body.name ?? "",
    school: body.school ?? "",
    major: body.major ?? "",
    gradYear: body.gradYear ?? "",
    careerGoal: body.careerGoal ?? "",
    clubGoals: body.clubGoals ?? "",
    linkedinBlurb: body.linkedinBlurb ?? "",
    keywords,
  });
  return NextResponse.json({ user });
}
