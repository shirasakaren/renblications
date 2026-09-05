export const CONTENT_KINDS = [
  "article",
  "blog",
  "paper",
  "publication",
  "research",
  "essay",
  "note",
  "talk",
] as const;

export type ContentKind = (typeof CONTENT_KINDS)[number];
export type ContentStatus = "draft" | "scheduled" | "published" | "archived";
export type ThemeMode = "light" | "dark" | "system";

export interface NavItem {
  label: string;
  href: string;
}

export interface SiteSettings {
  name: string;
  shortName: string;
  description: string;
  heroTitle: string;
  heroSubtitle: string;
  featuredContentId: string | null;
  navigation: NavItem[];
  footerNote: string;
  defaultOgImage: string;
  siteUrl: string;
}

export interface AuthorLink {
  label: string;
  url: string;
}

export interface AuthorProfile {
  name: string;
  bio: string;
  location: string;
  avatarUrl: string;
  gravatarEmail: string;
  links: AuthorLink[];
}

export interface AppearanceSettings {
  themeId: string;
  mode: ThemeMode;
  allowVisitorMode: boolean;
  showGrain: boolean;
  motionLevel: "reduced" | "standard" | "expressive";
}

export interface AnalyticsSettings {
  enabled: boolean;
  privacyMode: "strict" | "balanced";
  respectDoNotTrack: boolean;
  retentionDays: number;
}

export interface SeoFields {
  title: string;
  description: string;
  canonicalUrl: string;
}

export interface ContentItem {
  id: string;
  slug: string;
  type: ContentKind;
  status: ContentStatus;
  title: string;
  subtitle: string;
  excerpt: string;
  mdx: string;
  coverUrl: string;
  documentUrl: string;
  tags: string[];
  featured: boolean;
  featureRank: number;
  seo: SeoFields;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  readingMinutes: number;
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  alt: string;
  createdAt: string;
}

export type AnalyticsEventName =
  | "page_view"
  | "engagement"
  | "scroll_depth"
  | "outbound_click"
  | "media_play"
  | "media_complete"
  | "copy_code"
  | "recommendation_click"
  | "search";

export interface AnalyticsEventInput {
  event: AnalyticsEventName;
  contentId?: string | null;
  path: string;
  referrer?: string;
  sessionId?: string;
  visitorId?: string;
  properties?: Record<string, unknown>;
  client?: {
    locale?: string;
    timezone?: string;
    screen?: string;
    viewport?: string;
    colorScheme?: string;
    connection?: string;
  };
}

export interface ContentPerformance {
  id: string;
  title: string;
  type: ContentKind;
  status: ContentStatus;
  views: number;
  visitors: number;
  engagedSeconds: number;
  averageScroll: number;
  attentionScore: number;
  updatedAt: string;
}

export interface AdminOverview {
  totals: {
    content: number;
    published: number;
    views: number;
    visitors: number;
    engagedMinutes: number;
    averageScroll: number;
  };
  performance: ContentPerformance[];
  recentEvents: Array<{
    id: string;
    event: AnalyticsEventName;
    path: string;
    createdAt: string;
  }>;
}

export interface PublicConfig {
  onboarded: boolean;
  site: SiteSettings;
  profile: AuthorProfile;
  appearance: AppearanceSettings;
  analytics: AnalyticsSettings;
}

export interface ContentDraft
  extends Omit<ContentItem, "id" | "createdAt" | "updatedAt" | "readingMinutes"> {
  id?: string;
}
