import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Analytics } from "@/components/analytics";
import { AuthorCard } from "@/components/author-card";
import { contentHref, PublicationCard } from "@/components/publication-card";
import { SafeMdx } from "@/components/safe-mdx";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { COLLECTIONS, contentPath } from "@/lib/collections";
import { getContentBySlug, getPublicConfig, getRecommendations, listContent } from "@/lib/db";

interface PageParams {
  path: string[];
}

function formatDate(value: string | null): string {
  if (!value) return "Unscheduled";
  return new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(value));
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { path } = await params;
  const routePath = path.join("/");
  const collection = path.length === 1 ? COLLECTIONS[routePath] : undefined;
  if (collection) return { title: collection.title, description: collection.description };
  const [item, config] = await Promise.all([getContentBySlug(routePath), getPublicConfig()]);
  if (!item || item.status !== "published") return {};
  return {
    title: item.seo.title || item.title,
    description: item.seo.description || item.excerpt,
    authors: [{ name: config.profile.name }],
    keywords: item.tags,
    alternates: { canonical: item.seo.canonicalUrl || contentPath(item) },
    openGraph: {
      type: "article",
      title: item.seo.title || item.title,
      description: item.seo.description || item.excerpt,
      publishedTime: item.publishedAt ?? undefined,
      modifiedTime: item.updatedAt,
      images: item.coverUrl ? [item.coverUrl] : [],
    },
    twitter: {
      card: item.coverUrl ? "summary_large_image" : "summary",
      title: item.seo.title || item.title,
      description: item.seo.description || item.excerpt,
      images: item.coverUrl ? [item.coverUrl] : [],
    },
  };
}

async function CollectionArchive({ collectionKey }: { collectionKey: string }) {
  const entry = COLLECTIONS[collectionKey];
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
          {!content.length ? <div className="empty-state"><h2>Nothing published here yet.</h2><p>The first {entry.type} will appear as soon as it is published.</p></div> : null}
        </section>
      </main>
      <SiteFooter name={config.site.name} note={config.site.footerNote} />
      {config.analytics.enabled ? <Analytics /> : null}
    </>
  );
}

async function Publication({ routePath }: { routePath: string }) {
  const [config, item] = await Promise.all([getPublicConfig(), getContentBySlug(routePath)]);
  if (!config.onboarded) redirect("/onboarding");
  if (!item || item.status !== "published") notFound();
  const recommendations = await getRecommendations(item);
  const siteOrigin = config.site.siteUrl || process.env.SITE_URL;
  const canonicalUrl = item.seo.canonicalUrl || (siteOrigin ? new URL(contentPath(item), siteOrigin).toString() : undefined);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": item.type === "paper" || item.type === "research" ? "ScholarlyArticle" : "Article",
    headline: item.title,
    description: item.seo.description || item.excerpt,
    datePublished: item.publishedAt,
    dateModified: item.updatedAt,
    mainEntityOfPage: canonicalUrl,
    author: { "@type": "Person", name: config.profile.name },
    image: item.coverUrl || config.site.defaultOgImage || undefined,
    keywords: item.tags.join(", "),
  };
  return (
    <>
      <SiteHeader name={config.site.name} shortName={config.site.shortName} navigation={config.site.navigation} />
      <main>
        <article className="site-shell">
          <header className="article-header">
            <div>
              <div className="article-meta"><span>{item.type}</span><span>{formatDate(item.publishedAt)}</span></div>
              <h1>{item.title}</h1>
              {item.subtitle ? <p className="article-subtitle">{item.subtitle}</p> : null}
            </div>
            <aside className="article-aside"><dl><div><dt>Reading</dt><dd>{item.readingMinutes} minutes</dd></div><div><dt>Updated</dt><dd>{formatDate(item.updatedAt)}</dd></div><div><dt>Author</dt><dd>{config.profile.name}</dd></div><div><dt>Topics</dt><dd>{item.tags.join(", ") || "General"}</dd></div></dl></aside>
          </header>
          {item.coverUrl ? <div className="article-cover"><Image src={item.coverUrl} alt="" fill sizes="100vw" priority /></div> : null}
          <div className="article-layout"><aside className="article-rail"><strong>{config.site.name}</strong>{item.excerpt}</aside><SafeMdx source={item.mdx} title={item.title} /><div aria-hidden="true" /></div>
          {item.documentUrl ? <section className="document-viewer" aria-label="Attached document"><div className="document-toolbar"><span>Attached document</span><a href={item.documentUrl} target="_blank" rel="noreferrer">Open separately <ArrowSquareOut size={15} aria-hidden="true" /></a></div><object data={item.documentUrl} aria-label={`${item.title} document`}><a href={item.documentUrl}>Download the attached document</a></object></section> : null}
          <AuthorCard profile={config.profile} />
          {recommendations.length ? <section className="recommendations"><h2>Continue reading</h2><div className="recommendation-grid">{recommendations.map((recommendation) => <Link className="recommendation-card" href={contentHref(recommendation)} key={recommendation.id}><div className="recommendation-meta"><span>{recommendation.type}</span><span>{recommendation.readingMinutes} min</span></div><h3>{recommendation.title}</h3></Link>)}</div></section> : null}
        </article>
      </main>
      <SiteFooter name={config.site.name} note={config.site.footerNote} />
      {config.analytics.enabled ? <Analytics contentId={item.id} /> : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }} />
    </>
  );
}

export default async function PublicPathPage({ params }: { params: Promise<PageParams> }) {
  const { path } = await params;
  const routePath = path.join("/");
  if (path.length === 1 && COLLECTIONS[routePath]) return <CollectionArchive collectionKey={routePath} />;
  return <Publication routePath={routePath} />;
}
