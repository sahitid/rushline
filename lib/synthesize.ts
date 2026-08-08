import type {
  ClubIntel,
  InterviewIntel,
  Person,
  RedditPost,
  UserProfile,
} from "./types";

const KEYWORD_BUCKETS: Record<string, string[]> = {
  consulting: ["consulting", "consultant", "case", "strategy", "client", "advisory", "deloitte", "mckinsey", "bain", "bcg"],
  bigtech: ["software", "engineer", "swe", "google", "meta", "amazon", "cs", "computer science", "intern", "tech"],
  quant: ["quant", "trading", "jane street", "citadel", "hrt", "two sigma", "math", "probability", "finance"],
  startup: ["startup", "founder", "yc", "combinator", "entrepreneur", "venture", "vc", "product"],
  finance: ["finance", "banking", "investment", "ib", "goldman", "jpmorgan", "private equity", "hedge fund"],
  data: ["data", "analytics", "machine learning", "ml", "ai"],
  design: ["design", "ux", "ui", "figma", "product design"],
  marketing: ["marketing", "brand", "growth", "social media"],
};

export function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const [bucket, words] of Object.entries(KEYWORD_BUCKETS)) {
    if (words.some((w) => lower.includes(w))) found.add(bucket);
  }
  return [...found];
}

export function computeMatch(
  user: UserProfile | null,
  clubText: string,
  category: string
): { score: number; reasons: string[] } {
  if (!user) return { score: 50, reasons: ["Complete onboarding to get a personalized match score"] };
  const reasons: string[] = [];
  let score = 40;
  const clubLower = clubText.toLowerCase();

  if (user.careerGoal && (clubLower.includes(user.careerGoal) || category === user.careerGoal)) {
    score += 30;
    reasons.push(`Directly aligned with your ${user.careerGoal} career goal`);
  }
  const clubKeywords = extractKeywords(clubText);
  const overlap = user.keywords.filter((k) => clubKeywords.includes(k));
  if (overlap.length > 0) {
    score += Math.min(25, overlap.length * 12);
    reasons.push(`Overlaps with your background in ${overlap.join(", ")}`);
  }
  const goalWords = (user.clubGoals + " " + user.linkedinBlurb)
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 4);
  const hits = new Set(goalWords.filter((w) => clubLower.includes(w)));
  if (hits.size >= 3) {
    score += 10;
    reasons.push("Club materials echo language from your own goals and experience");
  }
  if (reasons.length === 0) {
    reasons.push("Adjacent to your interests — worth a look if you want range");
  }
  return { score: Math.min(98, score), reasons };
}

export function extractInterviewIntel(
  posts: RedditPost[],
  siteText: string
): InterviewIntel {
  const corpus = (
    posts.map((p) => p.title + " " + p.snippet).join(" ") + " " + siteText
  ).toLowerCase();

  const intel: InterviewIntel = {
    hasCaseRound: /case (interview|round|study)|casing/.test(corpus),
    hasTechnicalRound: /technical (interview|round)|coding (challenge|round)|leetcode/.test(corpus),
    hasBehavioralRound: /behavioral|fit interview|group interview/.test(corpus),
    hasCoffeeChats: /coffee chat/.test(corpus),
    hasWrittenApp: /written app|application form|essay|short answer|resume drop/.test(corpus),
    roundsDescription: [],
    tips: [],
    acceptanceSignal: null,
  };

  if (/(super )?competitive|hard to get in|low acceptance|single digit|(\d+%? acceptance)/.test(corpus)) {
    const m = corpus.match(/(\d{1,2})\s?% acceptance/);
    intel.acceptanceSignal = m
      ? `Reddit mentions roughly ${m[1]}% acceptance`
      : "Described as highly competitive in Reddit threads";
  }

  // Pull sentences from Reddit that describe the process
  const processRe = /[^.!?\n]*\b(round|interview|application|coffee chat|deliberat|invite)\b[^.!?\n]*[.!?]/gi;
  const seen = new Set<string>();
  for (const p of posts) {
    let m: RegExpExecArray | null;
    const text = p.title + ". " + p.snippet;
    while ((m = processRe.exec(text)) && intel.roundsDescription.length < 6) {
      const s = m[0].trim();
      if (s.length > 30 && s.length < 280 && !seen.has(s.toLowerCase())) {
        seen.add(s.toLowerCase());
        intel.roundsDescription.push(s);
      }
    }
  }

  if (intel.hasCoffeeChats)
    intel.tips.push("Coffee chats are part of the funnel — treat every one as a soft interview. Members compare notes during deliberations.");
  if (intel.hasCaseRound)
    intel.tips.push("Expect a case round. Practice 2-3 market-sizing and profitability cases out loud before the interview; structure matters more than the number.");
  if (intel.hasTechnicalRound)
    intel.tips.push("There is a technical component. Ask your coffee chat contact what format it takes (live coding vs. take-home) — that question alone signals preparation.");
  if (intel.hasBehavioralRound)
    intel.tips.push("Prepare 3 stories (leadership, failure, teamwork) you can adapt. Name-drop specific club projects you found — it shows you did real research.");
  if (intel.hasWrittenApp)
    intel.tips.push("Written application first — mirror the club's own language from its website in your answers, and mention a specific client project.");
  if (intel.tips.length === 0)
    intel.tips.push("No detailed process intel found publicly — this is exactly what to ask in a coffee chat. Members respect direct process questions.");

  return intel;
}

export function generateCoffeeChatTips(
  clubName: string,
  clients: string[],
  people: Person[],
  intel: InterviewIntel
): string[] {
  const tips: string[] = [];
  if (clients.length > 0) {
    tips.push(
      `Reference their client work: "I saw you worked with ${clients.slice(0, 2).join(" and ")} — what did that engagement actually look like week to week?"`
    );
  }
  const leader = people.find((p) => p.contactPriority >= 90);
  if (leader) {
    tips.push(
      `${leader.name} (${leader.role}) is the highest-leverage contact — but chat with 1-2 regular members first so you have informed questions by the time you reach leadership.`
    );
  }
  tips.push(
    "Send the email Tuesday-Thursday morning. Keep it under 120 words, name one specific thing about the club, and propose two concrete times."
  );
  tips.push(
    "End every chat with: \"Is there anyone else in the club you think I should talk to?\" — it converts one contact into a chain."
  );
  if (intel.hasCoffeeChats) {
    tips.push(
      "This club formally weighs coffee chats in admissions. Log who you met and mention them by name in your application."
    );
  }
  return tips;
}

export function generateEmailDraft(
  user: UserProfile | null,
  clubName: string,
  person: Person | null,
  clients: string[]
): { subject: string; body: string } {
  const firstName = person ? person.name.split(" ")[0] : "there";
  const you = user?.name || "[Your name]";
  const major = user?.major || "[your major]";
  const year = user?.gradYear || "[year]";
  const hook =
    clients.length > 0
      ? `I came across the ${clients[0]} project on your site and would love to hear what that engagement was actually like.`
      : `I've been reading up on ${clubName} and would love to hear what the experience is really like from the inside.`;

  return {
    subject: `Coffee chat? ${major} student interested in ${clubName}`,
    body: `Hi ${firstName},

I'm ${you}, a ${major} student (class of ${year}). ${hook}

Would you be open to a 15-minute coffee chat this week? I'm free Tuesday or Thursday morning, but happy to work around your schedule.

Thanks so much,
${you}`,
  };
}

export function inferCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/consult/.test(lower)) return "consulting";
  if (/venture|startup|entrepreneur/.test(lower)) return "startup";
  if (/invest|finance|banking|trading/.test(lower)) return "finance";
  if (/engineer|software|tech|data|robotics/.test(lower)) return "tech";
  if (/business|marketing|product/.test(lower)) return "business";
  return "other";
}

export type { ClubIntel };
