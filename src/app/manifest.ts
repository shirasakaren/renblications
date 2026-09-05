import type { MetadataRoute } from "next";
import { getPublicConfig } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { site, appearance } = await getPublicConfig();
  return {
    name: site.name,
    short_name: site.shortName,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#111110",
    theme_color: "#111110",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
    categories: ["books", "education", "productivity"],
    orientation: "any",
    id: `ren-publications-${appearance.themeId}`,
  };
}
