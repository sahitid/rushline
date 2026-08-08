export interface UserProfile {
  id: number;
  name: string;
  school: string;
  major: string;
  gradYear: string;
  careerGoal: string; // consulting | bigtech | quant | startup | finance
  clubGoals: string; // free text
  linkedinBlurb: string; // pasted LinkedIn about/experience text
  keywords: string[]; // extracted interest keywords
}

export interface Person {
  name: string;
  role: string; // e.g. "President", "Consultant", "Alumni"
  linkedinUrl?: string;
  source: string; // where we found them
  isAlumni: boolean;
  contactPriority: number; // 0-100, why you should talk to them
  reason: string; // "runs recruitment", "works at Bain now", etc.
}

export interface RedditPost {
  title: string;
  url: string;
  subreddit: string;
  snippet: string;
  score: number;
  createdUtc: number;
}

export interface InterviewIntel {
  hasCaseRound: boolean;
  hasTechnicalRound: boolean;
  hasBehavioralRound: boolean;
  hasCoffeeChats: boolean;
  hasWrittenApp: boolean;
  roundsDescription: string[];
  tips: string[];
  acceptanceSignal: string | null; // e.g. "described as very competitive on Reddit"
}

export interface ClubIntel {
  id: number;
  school: string;
  name: string;
  websiteUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  applicationUrl: string | null;
  contactEmail: string | null;
  description: string;
  category: string; // consulting | tech | business | social
  clients: string[];
  retreats: string[];
  people: Person[];
  redditPosts: RedditPost[];
  interview: InterviewIntel;
  emailDraft: { subject: string; body: string } | null;
  coffeeChatTips: string[];
  matchScore: number;
  matchReasons: string[];
  scrapedAt: number;
  scrapeLog: string[];
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: "you" | "club" | "person" | "company" | "school";
  meta?: string;
  priority?: number;
  url?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  kind: "member" | "client" | "interested" | "should_contact" | "attends" | "part_of";
}
