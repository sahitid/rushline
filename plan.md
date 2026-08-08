# rushline — Build Plan

**Hackathon MVP · August 8, 2026**

---

## 1. Overview & Pitch

Club recruiting at top schools is opaque, and it is consistently won on information asymmetry. At places like UC Berkeley, competitive campus organizations — consulting clubs, project teams, business fraternities, social frats — admit a small fraction of applicants, and the students who get in are rarely the ones with the best raw credentials. They are the ones who knew which clubs actually fit their goals, what the interview process looked like, and which current members to coffee-chat before applications opened. Today that intel lives in scattered Reddit threads, member LinkedIn profiles, and word of mouth passed down through friend groups. If you don't already know someone on the inside, you're applying blind.

**rushline** closes that gap. It aggregates real, scraped signals — club websites, LinkedIn profiles of current members and alumni, Instagram accounts, and Reddit threads — into personalized club pages built from ground truth rather than self-reported club blurbs. Each page combines reviews, interview intel, a roster of people worth meeting, and outreach tools for booking coffee chats, so any student can recruit with the same information advantage as a well-connected insider.

The demo targets **UC Berkeley consulting clubs**, with real-time scraping kicking in whenever a user enters any school + club combination. Berkeley gives us a dense, high-signal test bed; the pipeline itself is school-agnostic.

## 2. Core Features (MVP Scope for Today)

### 2.1 Onboarding & Login

A lightweight flow that captures who the student is and what they're recruiting for:

- The user's **school**, their **club recruiting goals**, and their **general career goals** (startups, big tech, quant, consulting).
- Instead of a long quiz, rushline understands the student through their **LinkedIn profile** — pulling experience, coursework, and existing connections to build a picture of where they stand and what they need.

### 2.2 Clubs Page

A personalized feed of **club matches** ranked against the user's stated goals. A student targeting consulting sees Berkeley's consulting clubs surfaced first, with match reasoning tied to their profile rather than generic popularity.

### 2.3 Club Detail Pages

The core intel product. Each club gets a comprehensive, link-rich page assembled from scraped sources:

- **Full club review** with links out to primary sources.
- **Client history** — for consulting clubs, which clients they've actually worked with.
- **Retreats** — where the club goes, as a proxy for culture and budget.
- **Reddit sentiment** — scraped threads from the school subreddit, summarized so students see what people really say about the club.
- **Current member roster** — who's in the club right now, sourced from member/team pages and LinkedIn.
- **People you should meet** — the members and alumni most relevant to the user's goals.
- **Coffee-chat outreach** — draft and schedule coffee-chat emails directly from the page, with pre-chat tips on what to ask and how to come across well.
- **Social actions** — one-click LinkedIn connect and Instagram follow-request flows for members.
- **Interview intel per club** — whether they run a technical round, how many rounds to expect, and the case interview format, so applicants prepare for the right process.

### 2.4 Social Web Page

An interactive **knowledge-graph visualization** of the user's network: who they know, which alumni and current members they're connected to, and — critically — who they need to contact to build a path into a target club. This is the **visual centerpiece of the demo**: a living map that turns "networking" from an abstract chore into a navigable graph with obvious next moves.

### 2.5 Real-Time Scraper Pipeline

Given any school + club name, the pipeline:

- Scrapes the **club website** — about pages, client lists, retreat mentions, member/team pages, and contact emails.
- Pulls **Reddit** discussion via the public JSON API for the school's subreddit.
- Surfaces **LinkedIn and Instagram profiles** for members via web search.

The demo pre-targets Berkeley consulting clubs so the flow is fast and reliable on stage, but the same pipeline runs live for any input.

## 3. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Fast full-stack iteration; API routes for the scraper pipeline |
| Styling | Tailwind CSS | Polished UI on a hackathon clock |
| Storage | SQLite | Zero-ops persistence for scraped club data and user profiles |
| Graph | react-force-graph | Interactive force-directed knowledge graph for the social web page |
| Scraping | cheerio + Reddit public JSON API | Lightweight HTML parsing; no auth needed for Reddit's `.json` endpoints |

## 4. Demo Flow

1. **Sign in** and complete onboarding (school, goals, LinkedIn).
2. **Enter goals** — e.g., consulting at Berkeley.
3. **See matched clubs** — a personalized list of Berkeley consulting clubs.
4. **Open a club page** — scraped intel: clients, retreats, Reddit sentiment, roster, interview format.
5. **Draft a coffee-chat email** to a recommended member, with pre-chat tips.
6. **Show the social web graph** — the user's network, their paths into the club, and who to contact next.

## 5. Timeline for Today

| Step | Status |
|---|---|
| Scaffold Next.js + TypeScript + Tailwind app | **Done** |
| Scraper pipeline (club sites, Reddit, profile search) | Up next |
| Onboarding & login flow | Today |
| Clubs page + club detail pages | Today |
| Knowledge graph (social web page) | Today |
| Live scrape of Berkeley consulting clubs for seed data | Today |
| End-to-end demo run | End of day |
