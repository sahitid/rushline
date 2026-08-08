import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-5xl flex-1 flex-col items-center px-6 py-20 text-center">
      <span className="chip mb-6">UC Berkeley · consulting clubs · live demo</span>
      <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
        Recruit with an{" "}
        <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
          insider&apos;s edge
        </span>
        .
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-muted">
        Club recruiting is won on information asymmetry. rushline aggregates real
        scraped signals — club sites, Reddit, live X chatter, member profiles —
        into personalized club pages built from ground truth, not self-reported
        blurbs.
      </p>
      <div className="mt-10 flex gap-3">
        <Link href="/login" className="btn-accent px-6 py-3 text-sm">
          Get started
        </Link>
        <Link href="/clubs" className="btn-ghost px-6 py-3 text-sm">
          Browse Berkeley clubs
        </Link>
      </div>

      <div className="mt-20 grid w-full gap-4 text-left sm:grid-cols-3">
        {[
          {
            t: "Real intel, not blurbs",
            d: "Clients, retreats, interview format, and Reddit + X sentiment scraped from primary sources.",
          },
          {
            t: "People you should meet",
            d: "A roster of current members and alumni ranked to your goals, with one-click outreach.",
          },
          {
            t: "Your social web",
            d: "An interactive graph of who you know and the shortest path into any target club.",
          },
        ].map((f) => (
          <div key={f.t} className="card p-5">
            <div className="text-sm font-semibold">{f.t}</div>
            <div className="mt-2 text-sm text-muted">{f.d}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
