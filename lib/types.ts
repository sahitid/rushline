export type CareerGoal = "consulting" | "startups" | "big_tech" | "quant" | "finance";

export type Profile = {
  id: string;
  full_name: string | null;
  school: string | null;
  career_goal: CareerGoal | null;
  linkedin_url: string | null;
  target_clubs: string[];
};

export type Club = {
  id: string;
  school: string;
  name: string;
  slug: string;
  category: string | null;
  website: string | null;
  tagline: string | null;
};

export type InterviewIntel = {
  rounds?: number;
  technical_round?: boolean;
  case_format?: string;
  notes?: string;
  difficulty?: string;
};

export type RedditSentiment = {
  summary?: string;
  vibe?: "positive" | "mixed" | "negative";
  quotes?: { text: string; url?: string }[];
};

export type VibeRead = {
  headline?: string;
  culture?: string;
  selectivity?: string;
  intensity?: string;
  social_energy?: string;
  values?: string[];
  source_note?: string;
};

export type XSentiment = {
  summary?: string;
  posts?: { text: string; handle?: string; url?: string }[];
};

export type ClubIntel = {
  club_id: string;
  review: string | null;
  clients: string[];
  retreats: { place: string; note?: string }[];
  interview: InterviewIntel;
  reddit_sentiment: RedditSentiment;
  vibe: VibeRead;
  x_sentiment: XSentiment;
  sources: { label: string; url: string }[];
};

export type Member = {
  id: string;
  club_id: string;
  name: string;
  role: string | null;
  linkedin_url: string | null;
  instagram: string | null;
  email: string | null;
  career_tags: string[];
  relevance: string | null;
  is_alumni: boolean;
};

export type RedditPost = {
  id: string;
  club_id: string;
  title: string;
  url: string;
  snippet: string | null;
  score: number;
  subreddit: string | null;
};

export type ClubWithIntel = Club & {
  intel: ClubIntel | null;
  members: Member[];
};
