import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Analytics } from "@/components/analytics";
import { PublicationCard } from "@/components/publication-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { COLLECTIONS } from "@/lib/collections";
import { getPublicConfig, listContent } from "@/lib/db";

export async function generateMetadata({ params }: { params: Promise<{ collection: string }> }): Promise<Metadata> {
  const { collection } = await params;
  const entry = COLLECTIONS[collection];
  return entry ? { title: entry.title, description: entry.description } : {};
}

export default async function CollectionPage({ params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params;
  const entry = COLLECTIONS[collection];
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
