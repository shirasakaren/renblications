import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Analytics } from "@/components/analytics";
import { AuthorCard } from "@/components/author-card";
import { contentHref } from "@/components/publication-card";
import { SafeMdx } from "@/components/safe-mdx";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { collectionForType, contentPath } from "@/lib/collections";
import { getContentBySlug, getPublicConfig, getRecommendations } from "@/lib/db";

function formatDate(value: string | null): string {
  if (!value) return "Unscheduled";
  return new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(value));
}

export async function generateMetadata({ params }: { params: Promise<{ collection: string; slug: string }> }): Promise<Metadata> {
  const { collection, slug } = await params;
  const [item, config] = await Promise.all([getContentBySlug(slug), getPublicConfig()]);
  if (!item || item.status !== "published" || collectionForType(item.type) !== collection) return {};
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

export default async function ContentPage({ params }: { params: Promise<{ collection: string; slug: string }> }) {
  const { collection, slug } = await params;
  const [config, item] = await Promise.all([getPublicConfig(), getContentBySlug(slug)]);
  if (!config.onboarded) redirect("/onboarding");
  if (!item || item.status !== "published" || collectionForType(item.type) !== collection) notFound();
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
              <div className="article-meta">
                <span>{item.type}</span>
                <span>{formatDate(item.publishedAt)}</span>
              </div>
              <h1>{item.title}</h1>
              {item.subtitle ? <p className="article-subtitle">{item.subtitle}</p> : null}
            </div>
            <aside className="article-aside">
              <dl>
                <div><dt>Reading</dt><dd>{item.readingMinutes} minutes</dd></div>
                <div><dt>Updated</dt><dd>{formatDate(item.updatedAt)}</dd></div>
                <div><dt>Author</dt><dd>{config.profile.name}</dd></div>
                <div><dt>Topics</dt><dd>{item.tags.join(", ") || "General"}</dd></div>
              </dl>
            </aside>
          </header>
          {item.coverUrl ? (
            <div className="article-cover">
              <Image src={item.coverUrl} alt="" fill sizes="100vw" priority />
            </div>
          ) : null}
          <div className="article-layout">
            <aside className="article-rail">
              <strong>{config.site.name}</strong>
              {item.excerpt}
            </aside>
            <SafeMdx source={item.mdx} />
            <div aria-hidden="true" />
          </div>
          {item.documentUrl ? (
            <section className="document-viewer" aria-label="Attached document">
              <div className="document-toolbar">
                <span>Attached document</span>
                <a href={item.documentUrl} target="_blank" rel="noreferrer">
                  Open separately <ArrowSquareOut size={15} aria-hidden="true" />
                </a>
              </div>
              <object data={item.documentUrl} aria-label={`${item.title} document`}>
                <a href={item.documentUrl}>Download the attached document</a>
              </object>
            </section>
          ) : null}
          <AuthorCard profile={config.profile} />
          {recommendations.length ? (
            <section className="recommendations">
              <h2>Continue reading</h2>
              <div className="recommendation-grid">
                {recommendations.map((recommendation) => (
                  <Link className="recommendation-card" href={contentHref(recommendation)} key={recommendation.id}>
                    <div className="recommendation-meta">
                      <span>{recommendation.type}</span>
                      <span>{recommendation.readingMinutes} min</span>
                    </div>
                    <h3>{recommendation.title}</h3>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </article>
      </main>
      <SiteFooter name={config.site.name} note={config.site.footerNote} />
      {config.analytics.enabled ? <Analytics contentId={item.id} /> : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }}
      />
    </>
  );
}
