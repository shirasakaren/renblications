import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getPublicConfig } from "@/lib/db";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { site } = await getPublicConfig();
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host")?.split(",")[0]?.trim() || incoming.get("host");
  const protocol = incoming.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  const configured = site.siteUrl || process.env.SITE_URL;
  const origin = configured ? new URL(configured).origin : host ? `${protocol}://${host}` : null;
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/onboarding", "/api/admin"],
    },
    ...(origin ? { sitemap: new URL("/sitemap.xml", origin).toString() } : {}),
  };
}
