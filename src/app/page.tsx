import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Analytics } from "@/components/analytics";
import { AuthorCard } from "@/components/author-card";
import { PublicationCard, contentHref } from "@/components/publication-card";
import { Reveal } from "@/components/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicConfig, listContent } from "@/lib/db";

const categoryLinks = [
  ["Articles", "/articles"],
  ["Blogs", "/blogs"],
  ["Papers", "/papers"],
  ["Research", "/research"],
  ["Essays", "/essays"],
  ["Notes", "/notes"],
  ["Talks", "/talks"],
  ["Publications", "/publications"],
] as const;

export default async function HomePage() {
  const [config, content] = await Promise.all([
    getPublicConfig(),
    listContent({ status: "published", limit: 24 }),
  ]);
  if (!config.onboarded) redirect("/onboarding");
  const featured =
    content.find((item) => item.id === config.site.featuredContentId) ??
    content.find((item) => item.featured) ??
    content[0];

  return (
    <>
      <SiteHeader
        name={config.site.name}
        shortName={config.site.shortName}
        navigation={config.site.navigation}
      />
      <main>
        <section className="site-shell hero">
          <Reveal className="hero-copy">
            <p className="eyebrow">Independent publications</p>
            <h1>{config.site.heroTitle}</h1>
            <p className="hero-description">{config.site.heroSubtitle}</p>
            {featured ? (
              <div className="hero-actions">
                <Link className="button button-primary" href={contentHref(featured)}>
                  Read featured <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            ) : null}
          </Reveal>
          <Reveal className="hero-visual-wrap" delay={0.12}>
            <div className="hero-visual">
              <Image
                src={config.site.defaultOgImage || "/images/archive-hero.png"}
                alt="Layered research papers, recording media, and a glass prism on a dark studio surface"
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 58vw"
              />
            </div>
            {featured ? (
              <Link className="hero-feature" href={contentHref(featured)}>
                <span className="hero-feature-kicker">Featured {featured.type}</span>
                <h2>{featured.title}</h2>
                <p>{featured.excerpt}</p>
              </Link>
            ) : null}
          </Reveal>
        </section>

        <section className="site-shell section-compact" aria-label="Browse by format">
          <div className="category-rail">
            {categoryLinks.map(([label, href]) => (
              <Link className="category-link" href={href} key={href}>
                {label} <ArrowRight size={13} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>

        <section className="site-shell section">
          <Reveal className="section-heading">
            <h2>The archive, in motion.</h2>
            <p>Published work and current thinking, ordered for discovery rather than chronology alone.</p>
          </Reveal>
          <div className="archive-grid">
            {content.map((item, index) => (
              <Reveal className="publication-slot" delay={Math.min(index, 5) * 0.045} key={item.id}>
                <PublicationCard item={item} />
              </Reveal>
            ))}
            {!content.length ? (
              <div className="empty-state">
                <h2>The archive is ready.</h2>
                <p>Publish the first piece from the admin dashboard.</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="site-shell section">
          <Reveal>
            <AuthorCard profile={config.profile} />
          </Reveal>
        </section>
      </main>
      <SiteFooter name={config.site.name} note={config.site.footerNote} />
      {config.analytics.enabled ? <Analytics /> : null}
    </>
  );
}
