import express, { type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import {
  ContentPathConflictError,
  completeOnboarding,
  createSession,
  deleteContent,
  deleteSession,
  ensureSchema,
  getAdminHash,
  getAdminOverview,
  getContentById,
  getContentBySlug,
  getMediaById,
  getPublicConfig,
  getRecommendations,
  hasSession,
  isOnboarded,
  listContent,
  listMedia,
  saveContent,
  saveMedia,
  setSetting,
  trackEvent,
  updatePassphrase,
} from "../lib/db";
import {
  DEFAULT_ANALYTICS,
  DEFAULT_APPEARANCE,
  DEFAULT_PROFILE,
  DEFAULT_SITE,
} from "../lib/defaults";
import { createStarterContent } from "../lib/seed";
import { ADMIN_COOKIE } from "../lib/constants";
import {
  anonymizeVisitor,
  createSessionToken,
  hashPassphrase,
  hashToken,
  parseCookieHeader,
  verifyPassphrase,
} from "../lib/security";
import { getTheme } from "../lib/themes";
import type {
  AnalyticsSettings,
  AppearanceSettings,
  AuthorProfile,
  ContentKind,
  MediaItem,
  SiteSettings,
} from "../lib/types";
import {
  analyticsEventSchema,
  analyticsSettingsSchema,
  appearanceSchema,
  contentSchema,
  loginSchema,
  onboardingSchema,
  passphraseSchema,
  profileSchema,
  siteSettingsSchema,
} from "./validation";
import { isAllowedUpload, loadFile, MAX_UPLOAD_BYTES, storeFile } from "./storage";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

router.use(express.json({ limit: "2mb", strict: true }));

router.use((_request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

function requestOrigin(request: Request): string {
  const configured = process.env.SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const forwardedHost = request.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.get("host") || "localhost";
  const protocol = request.get("x-forwarded-proto")?.split(",")[0]?.trim() || request.protocol;
  return `${protocol}://${host}`;
}

function requireSameOrigin(request: Request, response: Response, next: NextFunction): void {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return next();
  if (request.get("sec-fetch-site") === "cross-site") {
    response.status(403).json({ error: "Cross-site requests are not allowed." });
    return;
  }
  const origin = request.get("origin");
  if (origin && origin.replace(/\/$/, "") !== requestOrigin(request)) {
    response.status(403).json({ error: "Request origin did not match this site." });
    return;
  }
  next();
}

router.use(requireSameOrigin);

function readAdminToken(request: Request): string | null {
  return parseCookieHeader(request.headers.cookie)[ADMIN_COOKIE] ?? null;
}

async function authenticated(request: Request): Promise<boolean> {
  const token = readAdminToken(request);
  return token ? hasSession(hashToken(token)) : false;
}

async function requireAdmin(request: Request, response: Response, next: NextFunction) {
  try {
    if (!(await authenticated(request))) {
      response.status(401).json({ error: "Admin authentication required." });
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
}

function setSessionCookie(request: Request, response: Response, token: string, expires: Date): void {
  response.cookie(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: request.secure || process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
    priority: "high",
  });
}

async function startAdminSession(request: Request, response: Response): Promise<void> {
  const token = createSessionToken();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await createSession(hashToken(token), expires);
  setSessionCookie(request, response, token, expires);
}

function rateLimitKey(request: Request): string {
  return request.ip || request.socket.remoteAddress || "unknown";
}

function loginRateLimited(request: Request): boolean {
  const key = rateLimitKey(request);
  const now = Date.now();
  const current = loginAttempts.get(key);
  if (!current || current.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 8;
}

function clearLoginLimit(request: Request): void {
  loginAttempts.delete(rateLimitKey(request));
}

router.get("/health", async (_request, response, next) => {
  try {
    await ensureSchema();
    response.json({ status: "ok", database: process.env.DATABASE_URL ? "postgres" : "local" });
  } catch (error) {
    next(error);
  }
});

router.get("/public/config", async (_request, response, next) => {
  try {
    response.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=300");
    response.json(await getPublicConfig());
  } catch (error) {
    next(error);
  }
});

router.get("/public/content", async (request, response, next) => {
  try {
    const type = typeof request.query.type === "string" ? (request.query.type as ContentKind) : undefined;
    const content = await listContent({ status: "published", type, limit: 200 });
    response.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=300");
    response.json({ content });
  } catch (error) {
    next(error);
  }
});

router.get("/public/content/*path", async (request, response, next) => {
  try {
    const rawPath = request.params.path as string | string[];
    const contentPath = Array.isArray(rawPath) ? rawPath.join("/") : rawPath;
    const item = await getContentBySlug(contentPath);
    if (!item || item.status !== "published") {
      response.status(404).json({ error: "Publication not found." });
      return;
    }
    const recommendations = await getRecommendations(item);
    response.json({ item, recommendations });
  } catch (error) {
    next(error);
  }
});

router.get("/media/:id/file", async (request, response, next) => {
  try {
    const media = await getMediaById(request.params.id);
    if (!media) {
      response.status(404).json({ error: "Media not found." });
      return;
    }
    const body = await loadFile(media);
    response.setHeader("Content-Type", media.mimeType);
    response.setHeader("Content-Length", String(body.byteLength));
    response.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(media.name)}`);
    response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    response.send(Buffer.from(body));
  } catch (error) {
    next(error);
  }
});

router.post("/analytics/track", async (request, response, next) => {
  try {
    const config = await getPublicConfig();
    if (
      !config.analytics.enabled ||
      (config.analytics.respectDoNotTrack && request.get("dnt") === "1")
    ) {
      response.status(204).end();
      return;
    }
    const input = analyticsEventSchema.parse(request.body);
    const visitorHash = anonymizeVisitor(request.ip || "unknown", input.visitorId);
    const userAgent = config.analytics.privacyMode === "strict" ? "" : request.get("user-agent") || "";
    const properties = {
      ...input.properties,
      country: request.get("cf-ipcountry") || request.get("x-vercel-ip-country") || "",
      region: request.get("x-vercel-ip-country-region") || "",
    };
    response.status(202).json({ accepted: true });
    void trackEvent({
      input: { ...input, properties },
      visitorHash,
      userAgent,
      retentionDays: config.analytics.retentionDays,
    }).catch(console.error);
  } catch (error) {
    next(error);
  }
});

router.get("/admin/status", async (request, response, next) => {
  try {
    response.json({ onboarded: await isOnboarded(), authenticated: await authenticated(request) });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/onboard", async (request, response, next) => {
  try {
    const input = onboardingSchema.parse(request.body);
    const selectedTheme = getTheme(input.themeId);
    const origin = requestOrigin(request);
    const site: SiteSettings = {
      ...DEFAULT_SITE,
      name: input.siteName,
      shortName: input.siteName
        .split(/\s+/)
        .map((word) => word[0])
        .join("")
        .slice(0, 3)
        .toUpperCase(),
      description: input.siteDescription,
      siteUrl: process.env.SITE_URL || origin,
    };
    const profile: AuthorProfile = {
      ...DEFAULT_PROFILE,
      name: input.authorName,
      bio: input.authorBio,
    };
    const appearance: AppearanceSettings = {
      ...DEFAULT_APPEARANCE,
      themeId: selectedTheme.id,
      mode: input.mode,
    };
    const created = await completeOnboarding({
      passphraseHash: await hashPassphrase(input.passphrase),
      site,
      profile,
      appearance,
      content: input.includeStarterContent ? createStarterContent() : [],
    });
    if (!created) {
      response.status(409).json({ error: "This site has already been configured." });
      return;
    }
    await startAdminSession(request, response);
    response.status(201).json({ configured: true });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/login", async (request, response, next) => {
  try {
    if (loginRateLimited(request)) {
      response.setHeader("Retry-After", "900");
      response.status(429).json({ error: "Too many attempts. Try again in 15 minutes." });
      return;
    }
    const { passphrase } = loginSchema.parse(request.body);
    const hash = await getAdminHash();
    if (!hash || !(await verifyPassphrase(passphrase, hash))) {
      response.status(401).json({ error: "The passphrase was not accepted." });
      return;
    }
    clearLoginLimit(request);
    await startAdminSession(request, response);
    response.json({ authenticated: true });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/logout", async (request, response, next) => {
  try {
    const token = readAdminToken(request);
    if (token) await deleteSession(hashToken(token));
    response.clearCookie(ADMIN_COOKIE, { path: "/" });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.use("/admin", requireAdmin);

router.get("/admin/overview", async (_request, response, next) => {
  try {
    response.json(await getAdminOverview());
  } catch (error) {
    next(error);
  }
});

router.get("/admin/content", async (_request, response, next) => {
  try {
    response.json({ content: await listContent({ limit: 500 }) });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/content/:id", async (request, response, next) => {
  try {
    const item = await getContentById(request.params.id);
    if (!item) {
      response.status(404).json({ error: "Content not found." });
      return;
    }
    response.json({ item });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/content", async (request, response, next) => {
  try {
    const draft = contentSchema.parse(request.body);
    response.status(201).json({ item: await saveContent(draft) });
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/content/:id", async (request, response, next) => {
  try {
    const current = await getContentById(request.params.id);
    if (!current) {
      response.status(404).json({ error: "Content not found." });
      return;
    }
    const draft = contentSchema.parse({ ...request.body, id: current.id });
    response.json({ item: await saveContent(draft) });
  } catch (error) {
    next(error);
  }
});

router.delete("/admin/content/:id", async (request, response, next) => {
  try {
    if (!(await deleteContent(request.params.id))) {
      response.status(404).json({ error: "Content not found." });
      return;
    }
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.get("/admin/media", async (_request, response, next) => {
  try {
    response.json({ media: await listMedia() });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/media", upload.single("file"), async (request, response, next) => {
  try {
    if (!request.file) {
      response.status(400).json({ error: "Choose a file to upload." });
      return;
    }
    if (!isAllowedUpload(request.file.mimetype)) {
      response.status(415).json({ error: "That file type is not supported." });
      return;
    }
    const id = randomUUID();
    const stored = await storeFile({
      id,
      originalName: request.file.originalname,
      mimeType: request.file.mimetype,
      buffer: request.file.buffer,
    });
    const item: MediaItem = {
      id,
      name: request.file.originalname,
      url: `/api/media/${id}/file`,
      mimeType: request.file.mimetype,
      size: request.file.size,
      alt: String(request.body.alt ?? "").slice(0, 240),
      storageKey: stored.storageKey,
      provider: stored.provider,
      createdAt: new Date().toISOString(),
    };
    response.status(201).json({ item: await saveMedia(item) });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/settings", async (_request, response, next) => {
  try {
    response.json(await getPublicConfig());
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/settings/site", async (request, response, next) => {
  try {
    const value = siteSettingsSchema.parse(request.body) as SiteSettings;
    await setSetting("site", value);
    response.json({ site: value });
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/settings/profile", async (request, response, next) => {
  try {
    const value = profileSchema.parse(request.body) as AuthorProfile;
    await setSetting("profile", value);
    response.json({ profile: value });
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/settings/appearance", async (request, response, next) => {
  try {
    const value = appearanceSchema.parse(request.body) as AppearanceSettings;
    const normalized = { ...value, themeId: getTheme(value.themeId).id };
    await setSetting("appearance", normalized);
    response.json({ appearance: normalized });
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/settings/analytics", async (request, response, next) => {
  try {
    const value = analyticsSettingsSchema.parse(request.body) as AnalyticsSettings;
    await setSetting("analytics", { ...DEFAULT_ANALYTICS, ...value });
    response.json({ analytics: value });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/settings/passphrase", async (request, response, next) => {
  try {
    const value = passphraseSchema.parse(request.body);
    const current = await getAdminHash();
    if (!current || !(await verifyPassphrase(value.currentPassphrase, current))) {
      response.status(401).json({ error: "The current passphrase was not accepted." });
      return;
    }
    await updatePassphrase(await hashPassphrase(value.nextPassphrase));
    await startAdminSession(request, response);
    response.json({ updated: true });
  } catch (error) {
    next(error);
  }
});

router.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  void _next;
  if (error instanceof multer.MulterError) {
    response.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ error: error.message });
    return;
  }
  if (error instanceof ContentPathConflictError) {
    response.status(409).json({ error: error.message });
    return;
  }
  if (error && typeof error === "object" && "issues" in error) {
    const issues = (error as { issues?: Array<{ message?: string }> }).issues;
    response.status(400).json({ error: issues?.[0]?.message || "Check the highlighted fields." });
    return;
  }
  console.error(error);
  response.status(500).json({ error: "The server could not complete that request." });
});

export default router;
