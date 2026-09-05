import Link from "next/link";

export default function NotFound() {
  return (
    <main className="site-shell" style={{ display: "grid", minHeight: "100dvh", placeItems: "center" }}>
      <div className="empty-state" style={{ width: "min(100%, 680px)" }}>
        <h1 style={{ margin: 0, fontSize: "clamp(54px, 12vw, 120px)", letterSpacing: "-0.08em" }}>404</h1>
        <h2>This page is not in the archive.</h2>
        <p>It may have moved, returned to draft, or never existed.</p>
        <Link className="button button-primary" href="/" style={{ marginTop: 24 }}>
          Return home
        </Link>
      </div>
    </main>
  );
}
