import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Analytics } from "@/components/analytics";
import { PublicationCard } from "@/components/publication-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicConfig, listContent } from "@/lib/db";
import type { ContentKind } from "@/lib/types";

const collections: Record<string, { type: ContentKind; title: string; description: string }> = {
  articles: { type: "article", title: "Articles", description: "Structured writing on design, technology, systems, and culture." },
  blogs: { type: "blog", title: "Blogs", description: "Shorter observations, project journals, and practical notes from ongoing work." },
  papers: { type: "paper", title: "Papers", description: "Formal arguments, manuscripts, and downloadable research documents." },
  publications: { type: "publication", title: "Publications", description: "Books, reports, collected editions, and longer published work." },
  research: { type: "research", title: "Research", description: "Open questions, methods, evidence, and findings still taking shape." },
  essays: { type: "essay", title: "Essays", description: "Long-form ideas developed through reflection and careful argument." },
  notes: { type: "note", title: "Notes", description: "Compact observations intended to remain useful and easy to revisit." },
  talks: { type: "talk", title: "Talks", description: "Recordings, transcripts, decks, and references from public conversations." },
};

export async function generateMetadata({ params }: { params: Promise<{ collection: string }> }): Promise<Metadata> {
  const { collection } = await params;
  const entry = collections[collection];
  return entry ? { title: entry.title, description: entry.description } : {};
}

export default async function CollectionPage({ params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params;
  const entry = collections[collection];
  if (!entry) notFound();
  const [config, content] = await Promise.all([
    getPublicConfig(),
    listContent({ status: "published", type: entry.type, limit: 200 }),
  ]);
  if (!config.onboarded) redirect("/onboarding");
  return (
    <>
      <SiteHeader name={config.site.name} shortName={config.site.shortName} navigation={config.site.navigation} />
      <main className="site-shell">
        <header className="collection-header">
          <span className="collection-count">{content.length} published</span>
          <h1>{entry.title}</h1>
          <p>{entry.description}</p>
        </header>
        <section className="collection-list" aria-label={`${entry.title} archive`}>
          {content.map((item) => <PublicationCard item={item} key={item.id} />)}
          {!content.length ? (
            <div className="empty-state">
              <h2>Nothing published here yet.</h2>
              <p>The first {entry.type} will appear as soon as it is published.</p>
            </div>
          ) : null}
        </section>
      </main>
      <SiteFooter name={config.site.name} note={config.site.footerNote} />
      {config.analytics.enabled ? <Analytics /> : null}
    </>
  );
}
