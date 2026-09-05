import { z } from "zod";
import { CONTENT_KINDS } from "../lib/types";

const safeUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (!value || value.startsWith("/")) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "Enter a valid HTTP URL or site-relative path.");

const mode = z.enum(["light", "dark", "system"]);

export const onboardingSchema = z.object({
  passphrase: z.string().min(10).max(256),
  siteName: z.string().trim().min(2).max(80),
  siteDescription: z.string().trim().min(10).max(240),
  authorName: z.string().trim().min(1).max(80),
  authorBio: z.string().trim().max(480),
  themeId: z.string().trim().min(1).max(40),
  mode,
  includeStarterContent: z.boolean().default(true),
});

export const loginSchema = z.object({
  passphrase: z.string().min(1).max(256),
});

export const contentSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().max(96).default(""),
  type: z.enum(CONTENT_KINDS),
  status: z.enum(["draft", "scheduled", "published", "archived"]),
  title: z.string().trim().min(1).max(180),
  subtitle: z.string().trim().max(220).default(""),
  excerpt: z.string().trim().max(500).default(""),
  mdx: z.string().max(1_500_000).default(""),
  coverUrl: safeUrl.default(""),
  documentUrl: safeUrl.default(""),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  featured: z.boolean().default(false),
  featureRank: z.number().int().min(0).max(1000).default(0),
  seo: z
    .object({
      title: z.string().trim().max(70).default(""),
      description: z.string().trim().max(180).default(""),
      canonicalUrl: safeUrl.default(""),
    })
    .default({ title: "", description: "", canonicalUrl: "" }),
  publishedAt: z.string().datetime().nullable().default(null),
  scheduledAt: z.string().datetime().nullable().default(null),
});

export const siteSettingsSchema = z.object({
  name: z.string().trim().min(2).max(80),
  shortName: z.string().trim().min(1).max(12),
  description: z.string().trim().min(10).max(240),
  heroTitle: z.string().trim().min(3).max(100),
  heroSubtitle: z.string().trim().min(10).max(180),
  featuredContentId: z.string().uuid().nullable(),
  navigation: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(32),
        href: z.string().trim().startsWith("/").max(128),
      }),
    )
    .max(8),
  footerNote: z.string().trim().max(180),
  defaultOgImage: safeUrl,
  siteUrl: safeUrl,
});

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  bio: z.string().trim().max(480),
  location: z.string().trim().max(120),
  avatarUrl: safeUrl,
  gravatarEmail: z.union([z.literal(""), z.string().email()]),
  links: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(32),
        url: safeUrl.refine((value) => value.startsWith("http"), "Use an absolute URL."),
      }),
    )
    .max(12),
});

export const appearanceSchema = z.object({
  themeId: z.string().trim().min(1).max(40),
  mode,
  allowVisitorMode: z.boolean(),
  showGrain: z.boolean(),
  motionLevel: z.enum(["reduced", "standard", "expressive"]),
});

export const analyticsSettingsSchema = z.object({
  enabled: z.boolean(),
  privacyMode: z.enum(["strict", "balanced"]),
  respectDoNotTrack: z.boolean(),
  retentionDays: z.number().int().min(7).max(730),
});

export const analyticsEventSchema = z.object({
  event: z.enum([
    "page_view",
    "engagement",
    "scroll_depth",
    "outbound_click",
    "media_play",
    "media_complete",
    "copy_code",
    "recommendation_click",
    "search",
  ]),
  contentId: z.string().uuid().nullable().optional(),
  path: z.string().trim().startsWith("/").max(512),
  referrer: z.string().max(1024).optional(),
  sessionId: z.string().max(128).optional(),
  visitorId: z.string().max(128).optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
  client: z
    .object({
      locale: z.string().max(40).optional(),
      timezone: z.string().max(80).optional(),
      screen: z.string().max(32).optional(),
      viewport: z.string().max(32).optional(),
      colorScheme: z.string().max(16).optional(),
      connection: z.string().max(32).optional(),
    })
    .optional(),
});

export const passphraseSchema = z
  .object({
    currentPassphrase: z.string().min(1).max(256),
    nextPassphrase: z.string().min(10).max(256),
  })
  .refine((value) => value.currentPassphrase !== value.nextPassphrase, {
    path: ["nextPassphrase"],
    message: "Choose a different passphrase.",
  });
