import type {
  AnalyticsSettings,
  AppearanceSettings,
  AuthorProfile,
  SiteSettings,
} from "./types";

export const DEFAULT_SITE: SiteSettings = {
  name: "Ren Publications",
  shortName: "RP",
  description: "Papers, research, essays, and working ideas by Ren.",
  heroTitle: "Ideas worth returning to.",
  heroSubtitle: "Research, writing, and experiments gathered in one considered archive.",
  featuredContentId: null,
  navigation: [
    { label: "Home", href: "/" },
    { label: "Articles", href: "/articles" },
    { label: "Papers", href: "/papers" },
    { label: "Research", href: "/research" },
    { label: "Notes", href: "/notes" },
  ],
  footerNote: "A living archive of published and unfinished thought.",
  defaultOgImage: "/images/archive-hero.png",
  siteUrl: "",
};

export const DEFAULT_PROFILE: AuthorProfile = {
  name: "Ren",
  bio: "Independent researcher and writer working across technology, systems, and culture.",
  location: "",
  avatarUrl: "",
  gravatarEmail: "",
  links: [],
};

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  themeId: "vermilion",
  mode: "system",
  allowVisitorMode: true,
  showGrain: true,
  motionLevel: "expressive",
};

export const DEFAULT_ANALYTICS: AnalyticsSettings = {
  enabled: true,
  privacyMode: "balanced",
  respectDoNotTrack: true,
  retentionDays: 365,
};

export const DEFAULT_ONBOARDING_PASSPHRASE = "RenCantik@321";
