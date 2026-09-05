import type { ContentItem, ContentKind } from "./types";

export const COLLECTIONS: Record<string, { type: ContentKind; title: string; description: string }> = {
  articles: { type: "article", title: "Articles", description: "Structured writing on design, technology, systems, and culture." },
  blogs: { type: "blog", title: "Blogs", description: "Shorter observations, project journals, and practical notes from ongoing work." },
  papers: { type: "paper", title: "Papers", description: "Formal arguments, manuscripts, and downloadable research documents." },
  publications: { type: "publication", title: "Publications", description: "Books, reports, collected editions, and longer published work." },
  research: { type: "research", title: "Research", description: "Open questions, methods, evidence, and findings still taking shape." },
  essays: { type: "essay", title: "Essays", description: "Long-form ideas developed through reflection and careful argument." },
  notes: { type: "note", title: "Notes", description: "Compact observations intended to remain useful and easy to revisit." },
  talks: { type: "talk", title: "Talks", description: "Recordings, transcripts, decks, and references from public conversations." },
};

const collectionByType = Object.fromEntries(
  Object.entries(COLLECTIONS).map(([collection, value]) => [value.type, collection]),
) as Record<ContentKind, string>;

export function collectionForType(type: ContentKind): string {
  return collectionByType[type];
}

const blockedPrefixes = new Set(["admin", "api", "onboarding", "_next"]);
const blockedFiles = new Set(["feed.xml", "sitemap.xml", "robots.txt", "manifest.webmanifest", "icon.svg", "favicon.ico"]);

export function isAvailableContentPath(value: string): boolean {
  const path = value.replace(/^\/+|\/+$/g, "");
  const segments = path.split("/");
  if (!path || blockedPrefixes.has(segments[0]) || blockedFiles.has(path)) return false;
  return segments.length > 1 || !COLLECTIONS[path];
}

export function contentPath(item: Pick<ContentItem, "slug">): string {
  return `/${item.slug}`;
}
