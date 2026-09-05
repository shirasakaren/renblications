import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getPublicConfig } from "@/lib/db";
import { getTheme, themeStyle } from "@/lib/themes";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getPublicConfig();
  const base = site.siteUrl || process.env.SITE_URL;
  return {
    metadataBase: base ? new URL(base) : undefined,
    title: { default: site.name, template: `%s | ${site.name}` },
    description: site.description,
    openGraph: {
      type: "website",
      siteName: site.name,
      title: site.name,
      description: site.description,
      images: site.defaultOgImage ? [site.defaultOgImage] : [],
    },
    alternates: { types: { "application/rss+xml": "/feed.xml" } },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { appearance } = await getPublicConfig();
  const initialMode = appearance.mode === "dark" ? "dark" : "light";
  const theme = getTheme(appearance.themeId);
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} ${initialMode === "dark" ? "dark" : ""}`}
      data-theme={theme.id}
      data-mode={appearance.mode}
      style={themeStyle(theme.id)}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content={theme[initialMode].bg} />
      </head>
      <body className={appearance.showGrain ? "grain" : ""}>
        <ThemeProvider appearance={appearance}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
