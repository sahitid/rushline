import { NextResponse } from "next/server";
import { hasLLM, llmJSON } from "@/lib/llm";

type Body = {
  member: { name: string; role?: string; career_tags?: string[] };
  club: { name: string; school: string; category?: string };
  profile: { full_name?: string; school?: string; career_goal?: string };
};

export async function POST(req: Request) {
  const { member, club, profile } = (await req.json()) as Body;
  const firstName = member.name.split(" ")[0];
  const me = profile.full_name || "a student";

  if (hasLLM()) {
    const result = await llmJSON<{
      subject: string;
      body: string;
      tips: string[];
    }>(
      `Write a short, warm, non-cringe coffee-chat outreach email from ${me} (interested in ${
        profile.career_goal ?? "their career"
      } at ${profile.school ?? "school"}) to ${member.name}, who is ${
        member.role ?? "a member"
      } of ${club.name} (${club.category ?? "club"} at ${
        club.school
      }). Keep the body under 120 words, specific, and easy to say yes to. Also give 3 concrete pre-chat tips tailored to this person and club.
Return JSON: {"subject": string, "body": string, "tips": string[]}`,
      "You are an expert at concise, authentic student networking outreach. Avoid clichés and flattery."
    );
    if (result) return NextResponse.json(result);
  }

  // Template fallback
  const subject = `Coffee chat — ${club.name}?`;
  const body = `Hi ${firstName},

I'm ${me}, a student at ${profile.school ?? "school"} exploring ${
    profile.career_goal ?? "my next step"
  }. I came across your work with ${club.name} and would love to hear how you got involved and what the experience has been like.

Would you be open to a 15-minute coffee chat in the next week or two? Happy to work around your schedule.

Thanks so much,
${me}`;
  const tips = [
    `Ask how ${firstName} decided ${club.name} was the right fit over other ${
      club.category ?? "clubs"
    }.`,
    "Have one specific, researched question ready — it signals you did your homework.",
    "Close by asking who else on the team would be worth talking to.",
  ];
  return NextResponse.json({ subject, body, tips });
}
