import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#FAFAF7",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 24px 80px",
      }}
    >
      {/* Logo top-left */}
      <div style={{ position: "fixed", top: 24, left: 32, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 26, height: 26, background: "#3B3BFF", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
          </svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#0F0F0E", letterSpacing: "-0.02em" }}>
          rushline
        </span>
      </div>

      <div
        style={{
          maxWidth: 780,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          paddingTop: 140,
        }}
      >
        <span
          style={{
            background: "#EBEBFF",
            color: "#3B3BFF",
            borderRadius: 999,
            padding: "4px 14px",
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 28,
          }}
        >
          UC Berkeley · consulting clubs · live demo
        </span>
        <h1
          style={{
            fontFamily: "'Newsreader', serif",
            fontSize: 58,
            fontWeight: 400,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "#0F0F0E",
          }}
        >
          Recruit with an <span style={{ color: "#3B3BFF", fontStyle: "italic" }}>insider&apos;s edge</span>.
        </h1>
        <p style={{ marginTop: 24, maxWidth: 620, fontSize: 17, lineHeight: 1.6, color: "#8C8C85" }}>
          Club recruiting is won on information asymmetry. rushline aggregates
          real scraped signals — club sites, Reddit, live X chatter, member
          profiles — into personalized club pages built from ground truth, not
          self-reported blurbs.
        </p>
        <div style={{ marginTop: 40, display: "flex", gap: 12 }}>
          <Link
            href="/login"
            style={{
              padding: "13px 28px",
              borderRadius: 10,
              background: "#3B3BFF",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              letterSpacing: "-0.01em",
            }}
          >
            Get started
          </Link>
          <Link
            href="/clubs"
            style={{
              padding: "13px 28px",
              borderRadius: 10,
              background: "#FFFFFF",
              border: "1.5px solid #E8E8E3",
              color: "#4A4A44",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Browse Berkeley clubs
          </Link>
        </div>
      </div>

      <div
        style={{
          marginTop: 90,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          width: "100%",
          maxWidth: 900,
        }}
      >
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
          <div
            key={f.t}
            style={{
              background: "#FFFFFF",
              border: "1px solid #E8E8E3",
              borderRadius: 16,
              padding: "22px 24px",
              textAlign: "left",
              boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0F0F0E" }}>{f.t}</div>
            <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: "#8C8C85" }}>{f.d}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
