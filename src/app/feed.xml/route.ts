import { contentPath } from "@/lib/collections";
import { getPublicConfig, listContent } from "@/lib/db";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET(request: Request) {
  const [config, content] = await Promise.all([
    getPublicConfig(),
    listContent({ status: "published", limit: 100 }),
  ]);
  const origin = new URL(config.site.siteUrl || process.env.SITE_URL || request.url).origin;
  const items = content.map((item) => {
    const url = new URL(contentPath(item), origin).toString();
    return `<item><title>${escapeXml(item.title)}</title><description>${escapeXml(item.excerpt)}</description><link>${escapeXml(url)}</link><guid isPermaLink="true">${escapeXml(url)}</guid><pubDate>${new Date(item.publishedAt || item.updatedAt).toUTCString()}</pubDate><category>${escapeXml(item.type)}</category></item>`;
  }).join("");
  const feed = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml(config.site.name)}</title><description>${escapeXml(config.site.description)}</description><link>${escapeXml(origin)}</link><language>en</language><lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}</channel></rss>`;
  return new Response(feed, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
