import { ArrowRight, ChartLineUp, Clock, Eye, FileText, UsersThree } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { PerformanceTable } from "@/components/admin/performance-table";
import { getAdminOverview } from "@/lib/db";

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview();
  const metrics = [
    { label: "Published", value: overview.totals.published, detail: `${overview.totals.content} total pieces`, icon: FileText },
    { label: "Views", value: overview.totals.views, detail: "Across the archive", icon: Eye },
    { label: "Readers", value: overview.totals.visitors, detail: "Daily anonymous count", icon: UsersThree },
    { label: "Engaged", value: `${overview.totals.engagedMinutes}m`, detail: `${overview.totals.averageScroll}% average depth`, icon: Clock },
  ];
  return (
    <>
      <div className="admin-page-header">
        <div><span className="admin-kicker">Dashboard</span><h1>Publication overview</h1><p>See what is live, what readers notice, and where the archive can grow next.</p></div>
        <Link className="button button-secondary" href="/admin/analytics"><ChartLineUp size={16} /> Full analytics</Link>
      </div>
      <section className="metric-grid" aria-label="Publication metrics">
        {metrics.map((metric) => { const Icon = metric.icon; return <article className="metric" key={metric.label}><div className="metric-icon"><Icon size={18} /></div><span>{metric.label}</span><strong>{typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}</strong><small>{metric.detail}</small></article>; })}
      </section>
      <section className="admin-section">
        <div className="admin-section-heading"><div><h2>Content performance</h2><p>Sort by attention, audience, reading time, or completion.</p></div><Link href="/admin/content">Manage content <ArrowRight size={14} /></Link></div>
        <PerformanceTable items={overview.performance} />
      </section>
      <section className="admin-section admin-activity-section">
        <div className="admin-section-heading"><div><h2>Recent reader activity</h2><p>Privacy-safe events from the public reading surface.</p></div></div>
        <div className="activity-list">
          {overview.recentEvents.map((event) => <div className="activity-row" key={event.id}><span>{event.event.replaceAll("_", " ")}</span><strong>{event.path}</strong><time>{new Date(event.createdAt).toLocaleString()}</time></div>)}
          {!overview.recentEvents.length ? <div className="admin-table-empty">The event stream is quiet. Open a publication to test tracking.</div> : null}
        </div>
      </section>
    </>
  );
}
