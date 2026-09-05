import { notFound } from "next/navigation";
import { ContentManager } from "@/components/admin/content-manager";
import { PerformanceTable } from "@/components/admin/performance-table";
import { getAdminOverview, listContent } from "@/lib/db";
import type { ContentKind } from "@/lib/types";

const contentSections: Record<string, { type?: ContentKind; title: string }> = {
  content: { title: "All content" },
  articles: { type: "article", title: "Articles" },
  blogs: { type: "blog", title: "Blogs" },
  papers: { type: "paper", title: "Papers" },
  publications: { type: "publication", title: "Publications" },
  research: { type: "research", title: "Research" },
  essays: { type: "essay", title: "Essays" },
  notes: { type: "note", title: "Notes" },
  talks: { type: "talk", title: "Talks" },
};

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const contentSection = contentSections[section];
  if (contentSection) {
    const items = await listContent({ type: contentSection.type, limit: 500 });
    return <ContentManager items={items} type={contentSection.type} title={contentSection.title} />;
  }
  if (section === "analytics") {
    const overview = await getAdminOverview();
    return (
      <>
        <div className="admin-page-header"><div><span className="admin-kicker">Insights</span><h1>Reader analytics</h1><p>First-party attention signals with daily visitor anonymization and no cross-site fingerprinting.</p></div></div>
        <section className="metric-grid"><article className="metric"><span>Total views</span><strong>{overview.totals.views.toLocaleString()}</strong><small>All public pages</small></article><article className="metric"><span>Unique readers</span><strong>{overview.totals.visitors.toLocaleString()}</strong><small>Daily anonymous count</small></article><article className="metric"><span>Engaged time</span><strong>{overview.totals.engagedMinutes}m</strong><small>Active visible reading</small></article><article className="metric"><span>Average depth</span><strong>{overview.totals.averageScroll}%</strong><small>Across tracked milestones</small></article></section>
        <section className="admin-section"><div className="admin-section-heading"><div><h2>Attention by content</h2><p>The score combines views, unique readers, active time, and scroll depth.</p></div></div><PerformanceTable items={overview.performance} /></section>
      </>
    );
  }
  notFound();
}
