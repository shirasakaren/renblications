import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { COLLECTIONS, contentPath } from "@/lib/collections";
import { getPublicConfig, listContent } from "@/lib/db";

async function requestOrigin(configured: string): Promise<string | null> {
  if (configured) return new URL(configured).origin;
  if (process.env.SITE_URL) return new URL(process.env.SITE_URL).origin;
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host")?.split(",")[0]?.trim() || incoming.get("host");
  if (!host) return null;
  const protocol = incoming.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  return `${protocol}://${host}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [config, content] = await Promise.all([
    getPublicConfig(),
    listContent({ status: "published", limit: 500 }),
  ]);
  const origin = await requestOrigin(config.site.siteUrl);
  if (!origin) return [];
  const collectionEntries: MetadataRoute.Sitemap = Object.keys(COLLECTIONS).map((collection) => ({
    url: new URL(`/${collection}`, origin).toString(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));
  return [
    { url: origin, changeFrequency: "weekly", priority: 1 },
    ...collectionEntries,
    ...content.map((item) => ({
      url: new URL(contentPath(item), origin).toString(),
      lastModified: new Date(item.updatedAt),
      changeFrequency: "monthly" as const,
      priority: item.featured ? 0.9 : 0.8,
    })),
  ];
}
