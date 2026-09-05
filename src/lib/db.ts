import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import {
  DEFAULT_ANALYTICS,
  DEFAULT_APPEARANCE,
  DEFAULT_PROFILE,
  DEFAULT_SITE,
} from "./defaults";
import type {
  AdminOverview,
  AnalyticsEventInput,
  AnalyticsEventName,
  AnalyticsSettings,
  AppearanceSettings,
  AuthorProfile,
  ContentDraft,
  ContentItem,
  ContentKind,
  ContentPerformance,
  ContentStatus,
  MediaItem,
  PublicConfig,
  SiteSettings,
} from "./types";
import { estimateReadingMinutes, slugify } from "./security";

interface StoredSession {
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
}

interface StoredEvent {
  id: string;
  event: AnalyticsEventName;
  contentId: string | null;
  path: string;
  referrer: string;
  sessionId: string;
  visitorHash: string;
  userAgent: string;
  properties: Record<string, unknown>;
  createdAt: string;
}

interface LocalState {
  adminHash: string | null;
  sessions: StoredSession[];
  settings: {
    site: SiteSettings;
    profile: AuthorProfile;
    appearance: AppearanceSettings;
    analytics: AnalyticsSettings;
  };
  content: ContentItem[];
  media: MediaItem[];
  events: StoredEvent[];
}

interface TrackEventRecord {
  input: AnalyticsEventInput;
  visitorHash: string;
  userAgent: string;
}

const localPath = path.join(process.cwd(), "data", "local-store.json");
let localCache: LocalState | null = null;
let localWriteQueue = Promise.resolve();
let pool: Pool | null = null;
let schemaPromise: Promise<void> | null = null;

function freshLocalState(): LocalState {
  return {
    adminHash: null,
    sessions: [],
    settings: {
      site: structuredClone(DEFAULT_SITE),
      profile: structuredClone(DEFAULT_PROFILE),
      appearance: structuredClone(DEFAULT_APPEARANCE),
      analytics: structuredClone(DEFAULT_ANALYTICS),
    },
    content: [],
    media: [],
    events: [],
  };
}

function usesPostgres(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 8,
      idleTimeoutMillis: 30_000,
      ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

async function loadLocal(): Promise<LocalState> {
  if (localCache) return localCache;
  try {
    const raw = await readFile(localPath, "utf8");
    localCache = JSON.parse(raw) as LocalState;
  } catch {
    localCache = freshLocalState();
  }
  return localCache;
}

async function saveLocal(state: LocalState): Promise<void> {
  await mkdir(path.dirname(localPath), { recursive: true });
  const temporary = `${localPath}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(state, null, 2), "utf8");
  await rename(temporary, localPath);
}

async function mutateLocal<T>(operation: (state: LocalState) => T | Promise<T>): Promise<T> {
  let resolveResult: (value: T) => void = () => undefined;
  let rejectResult: (reason?: unknown) => void = () => undefined;
  const result = new Promise<T>((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });
  localWriteQueue = localWriteQueue.then(async () => {
    try {
      const state = await loadLocal();
      const value = await operation(state);
      await saveLocal(state);
      resolveResult(value);
    } catch (error) {
      rejectResult(error);
    }
  });
  return result;
}

async function initializeSchema(client: Pool | PoolClient = getPool()): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS publication_admin (
      id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      passphrase_hash text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS publication_sessions (
      token_hash text PRIMARY KEY,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS publication_settings (
      key text PRIMARY KEY,
      value jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS publication_content (
      id uuid PRIMARY KEY,
      slug text NOT NULL UNIQUE,
      type text NOT NULL,
      status text NOT NULL,
      title text NOT NULL,
      subtitle text NOT NULL DEFAULT '',
      excerpt text NOT NULL DEFAULT '',
      mdx text NOT NULL DEFAULT '',
      cover_url text NOT NULL DEFAULT '',
      document_url text NOT NULL DEFAULT '',
      tags jsonb NOT NULL DEFAULT '[]'::jsonb,
      featured boolean NOT NULL DEFAULT false,
      feature_rank integer NOT NULL DEFAULT 0,
      seo jsonb NOT NULL DEFAULT '{}'::jsonb,
      published_at timestamptz,
      scheduled_at timestamptz,
      reading_minutes integer NOT NULL DEFAULT 1,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS publication_media (
      id uuid PRIMARY KEY,
      name text NOT NULL,
      url text NOT NULL,
      mime_type text NOT NULL,
      size_bytes bigint NOT NULL,
      alt text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS publication_events (
      id uuid PRIMARY KEY,
      event text NOT NULL,
      content_id uuid,
      path text NOT NULL,
      referrer text NOT NULL DEFAULT '',
      session_id text NOT NULL DEFAULT '',
      visitor_hash text NOT NULL DEFAULT '',
      user_agent text NOT NULL DEFAULT '',
      properties jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS publication_content_public_idx
      ON publication_content (status, type, published_at DESC);
    CREATE INDEX IF NOT EXISTS publication_content_featured_idx
      ON publication_content (featured, feature_rank);
    CREATE INDEX IF NOT EXISTS publication_events_content_idx
      ON publication_events (content_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS publication_events_created_idx
      ON publication_events (created_at DESC);
  `);
}

export async function ensureSchema(): Promise<void> {
  if (!usesPostgres()) {
    await loadLocal();
    return;
  }
  schemaPromise ??= initializeSchema();
  await schemaPromise;
}

function dateString(value: unknown): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

function mapContent(row: QueryResultRow): ContentItem {
  return {
    id: String(row.id),
    slug: String(row.slug),
    type: row.type as ContentKind,
    status: row.status as ContentStatus,
    title: String(row.title),
    subtitle: String(row.subtitle ?? ""),
    excerpt: String(row.excerpt ?? ""),
    mdx: String(row.mdx ?? ""),
    coverUrl: String(row.cover_url ?? ""),
    documentUrl: String(row.document_url ?? ""),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    featured: Boolean(row.featured),
    featureRank: Number(row.feature_rank ?? 0),
    seo: {
      title: String(row.seo?.title ?? ""),
      description: String(row.seo?.description ?? ""),
      canonicalUrl: String(row.seo?.canonicalUrl ?? ""),
    },
    publishedAt: dateString(row.published_at),
    scheduledAt: dateString(row.scheduled_at),
    readingMinutes: Number(row.reading_minutes ?? 1),
    createdAt: dateString(row.created_at) ?? new Date().toISOString(),
    updatedAt: dateString(row.updated_at) ?? new Date().toISOString(),
  };
}

export async function isOnboarded(): Promise<boolean> {
  await ensureSchema();
  if (!usesPostgres()) return Boolean((await loadLocal()).adminHash);
  const result = await getPool().query("SELECT 1 FROM publication_admin WHERE id = 1");
  return (result.rowCount ?? 0) > 0;
}

export async function getAdminHash(): Promise<string | null> {
  await ensureSchema();
  if (!usesPostgres()) return (await loadLocal()).adminHash;
  const result = await getPool().query<{ passphrase_hash: string }>(
    "SELECT passphrase_hash FROM publication_admin WHERE id = 1",
  );
  return result.rows[0]?.passphrase_hash ?? null;
}

export async function completeOnboarding(input: {
  passphraseHash: string;
  site: SiteSettings;
  profile: AuthorProfile;
  appearance: AppearanceSettings;
  content: ContentItem[];
}): Promise<boolean> {
  await ensureSchema();
  if (!usesPostgres()) {
    return mutateLocal(async (state) => {
      if (state.adminHash) return false;
      state.adminHash = input.passphraseHash;
      state.settings.site = input.site;
      state.settings.profile = input.profile;
      state.settings.appearance = input.appearance;
      state.content = input.content;
      return true;
    });
  }

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const account = await client.query(
      `INSERT INTO publication_admin (id, passphrase_hash)
       VALUES (1, $1) ON CONFLICT (id) DO NOTHING RETURNING id`,
      [input.passphraseHash],
    );
    if ((account.rowCount ?? 0) === 0) {
      await client.query("ROLLBACK");
      return false;
    }
    for (const [key, value] of Object.entries({
      site: input.site,
      profile: input.profile,
      appearance: input.appearance,
      analytics: DEFAULT_ANALYTICS,
    })) {
      await client.query(
        `INSERT INTO publication_settings (key, value) VALUES ($1, $2::jsonb)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
        [key, JSON.stringify(value)],
      );
    }
    for (const item of input.content) await upsertContentPg(client, item);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updatePassphrase(passphraseHash: string): Promise<void> {
  await ensureSchema();
  if (!usesPostgres()) {
    await mutateLocal((state) => {
      state.adminHash = passphraseHash;
      state.sessions = [];
    });
    return;
  }
  await getPool().query(
    "UPDATE publication_admin SET passphrase_hash = $1, updated_at = now() WHERE id = 1",
    [passphraseHash],
  );
  await getPool().query("DELETE FROM publication_sessions");
}

export async function createSession(tokenHash: string, expiresAt: Date): Promise<void> {
  await ensureSchema();
  if (!usesPostgres()) {
    await mutateLocal((state) => {
      state.sessions.push({
        tokenHash,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
      });
    });
    return;
  }
  await getPool().query(
    "INSERT INTO publication_sessions (token_hash, expires_at) VALUES ($1, $2)",
    [tokenHash, expiresAt],
  );
}

export async function hasSession(tokenHash: string): Promise<boolean> {
  await ensureSchema();
  if (!usesPostgres()) {
    const state = await loadLocal();
    const nowMs = Date.now();
    state.sessions = state.sessions.filter((session) => Date.parse(session.expiresAt) > nowMs);
    return state.sessions.some((session) => session.tokenHash === tokenHash);
  }
  const result = await getPool().query(
    `SELECT 1 FROM publication_sessions
     WHERE token_hash = $1 AND expires_at > now()`,
    [tokenHash],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function deleteSession(tokenHash: string): Promise<void> {
  await ensureSchema();
  if (!usesPostgres()) {
    await mutateLocal((state) => {
      state.sessions = state.sessions.filter((session) => session.tokenHash !== tokenHash);
    });
    return;
  }
  await getPool().query("DELETE FROM publication_sessions WHERE token_hash = $1", [tokenHash]);
}

export async function getSetting<T>(key: keyof LocalState["settings"], fallback: T): Promise<T> {
  await ensureSchema();
  if (!usesPostgres()) return ((await loadLocal()).settings[key] as T) ?? fallback;
  const result = await getPool().query<{ value: T }>(
    "SELECT value FROM publication_settings WHERE key = $1",
    [key],
  );
  return result.rows[0]?.value ?? fallback;
}

export async function setSetting<T>(key: keyof LocalState["settings"], value: T): Promise<void> {
  await ensureSchema();
  if (!usesPostgres()) {
    await mutateLocal((state) => {
      Object.assign(state.settings, { [key]: value });
    });
    return;
  }
  await getPool().query(
    `INSERT INTO publication_settings (key, value) VALUES ($1, $2::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(value)],
  );
}

export async function getPublicConfig(): Promise<PublicConfig> {
  const [onboarded, site, profile, appearance, analytics] = await Promise.all([
    isOnboarded(),
    getSetting("site", DEFAULT_SITE),
    getSetting("profile", DEFAULT_PROFILE),
    getSetting("appearance", DEFAULT_APPEARANCE),
    getSetting("analytics", DEFAULT_ANALYTICS),
  ]);
  return {
    onboarded,
    site: { ...DEFAULT_SITE, ...site },
    profile: { ...DEFAULT_PROFILE, ...profile },
    appearance: { ...DEFAULT_APPEARANCE, ...appearance },
    analytics: { ...DEFAULT_ANALYTICS, ...analytics },
  };
}

function normalizeDraft(draft: ContentDraft): ContentItem {
  const timestamp = new Date().toISOString();
  const publishedAt =
    draft.status === "published" ? draft.publishedAt ?? timestamp : draft.publishedAt ?? null;
  return {
    ...draft,
    id: draft.id ?? randomUUID(),
    slug: slugify(draft.slug || draft.title),
    title: draft.title.trim(),
    subtitle: draft.subtitle.trim(),
    excerpt: draft.excerpt.trim(),
    tags: draft.tags.map((tag) => tag.trim()).filter(Boolean).slice(0, 12),
    publishedAt,
    scheduledAt: draft.scheduledAt ?? null,
    readingMinutes: estimateReadingMinutes(draft.mdx),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

async function upsertContentPg(client: Pool | PoolClient, item: ContentItem): Promise<void> {
  await client.query(
    `INSERT INTO publication_content (
      id, slug, type, status, title, subtitle, excerpt, mdx, cover_url,
      document_url, tags, featured, feature_rank, seo, published_at,
      scheduled_at, reading_minutes, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13,
      $14::jsonb, $15, $16, $17, $18, $19
    ) ON CONFLICT (id) DO UPDATE SET
      slug = EXCLUDED.slug, type = EXCLUDED.type, status = EXCLUDED.status,
      title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, excerpt = EXCLUDED.excerpt,
      mdx = EXCLUDED.mdx, cover_url = EXCLUDED.cover_url,
      document_url = EXCLUDED.document_url, tags = EXCLUDED.tags,
      featured = EXCLUDED.featured, feature_rank = EXCLUDED.feature_rank,
      seo = EXCLUDED.seo, published_at = EXCLUDED.published_at,
      scheduled_at = EXCLUDED.scheduled_at, reading_minutes = EXCLUDED.reading_minutes,
      updated_at = EXCLUDED.updated_at`,
    [
      item.id,
      item.slug,
      item.type,
      item.status,
      item.title,
      item.subtitle,
      item.excerpt,
      item.mdx,
      item.coverUrl,
      item.documentUrl,
      JSON.stringify(item.tags),
      item.featured,
      item.featureRank,
      JSON.stringify(item.seo),
      item.publishedAt,
      item.scheduledAt,
      item.readingMinutes,
      item.createdAt,
      item.updatedAt,
    ],
  );
}

export async function saveContent(draft: ContentDraft): Promise<ContentItem> {
  await ensureSchema();
  const item = normalizeDraft(draft);
  if (!usesPostgres()) {
    return mutateLocal((state) => {
      const index = state.content.findIndex((candidate) => candidate.id === item.id);
      if (index >= 0) {
        item.createdAt = state.content[index].createdAt;
        state.content[index] = item;
      } else {
        state.content.push(item);
      }
      return item;
    });
  }
  if (draft.id) {
    const current = await getContentById(draft.id);
    if (current) item.createdAt = current.createdAt;
  }
  await upsertContentPg(getPool(), item);
  return item;
}

export async function deleteContent(id: string): Promise<boolean> {
  await ensureSchema();
  if (!usesPostgres()) {
    return mutateLocal((state) => {
      const before = state.content.length;
      state.content = state.content.filter((item) => item.id !== id);
      return state.content.length < before;
    });
  }
  const result = await getPool().query("DELETE FROM publication_content WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function listContent(options: {
  status?: ContentStatus;
  type?: ContentKind;
  limit?: number;
} = {}): Promise<ContentItem[]> {
  await ensureSchema();
  const limit = Math.min(Math.max(options.limit ?? 200, 1), 500);
  if (!usesPostgres()) {
    const state = await loadLocal();
    return state.content
      .filter((item) => !options.status || item.status === options.status)
      .filter((item) => !options.type || item.type === options.type)
      .toSorted((a, b) => {
        const featured = Number(b.featured) - Number(a.featured);
        if (featured !== 0) return featured;
        return Date.parse(b.publishedAt ?? b.updatedAt) - Date.parse(a.publishedAt ?? a.updatedAt);
      })
      .slice(0, limit);
  }
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (options.status) {
    values.push(options.status);
    conditions.push(`status = $${values.length}`);
  }
  if (options.type) {
    values.push(options.type);
    conditions.push(`type = $${values.length}`);
  }
  values.push(limit);
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await getPool().query(
    `SELECT * FROM publication_content ${where}
     ORDER BY featured DESC, feature_rank ASC, published_at DESC NULLS LAST, updated_at DESC
     LIMIT $${values.length}`,
    values,
  );
  return result.rows.map(mapContent);
}

export async function getContentById(id: string): Promise<ContentItem | null> {
  await ensureSchema();
  if (!usesPostgres()) return (await loadLocal()).content.find((item) => item.id === id) ?? null;
  const result = await getPool().query("SELECT * FROM publication_content WHERE id = $1", [id]);
  return result.rows[0] ? mapContent(result.rows[0]) : null;
}

export async function getContentBySlug(slug: string): Promise<ContentItem | null> {
  await ensureSchema();
  if (!usesPostgres()) {
    return (await loadLocal()).content.find((item) => item.slug === slug) ?? null;
  }
  const result = await getPool().query("SELECT * FROM publication_content WHERE slug = $1", [slug]);
  return result.rows[0] ? mapContent(result.rows[0]) : null;
}

export async function getRecommendations(item: ContentItem, limit = 3): Promise<ContentItem[]> {
  const published = await listContent({ status: "published", limit: 100 });
  const tags = new Set(item.tags);
  return published
    .filter((candidate) => candidate.id !== item.id)
    .map((candidate) => ({
      candidate,
      score:
        candidate.tags.reduce((total, tag) => total + (tags.has(tag) ? 3 : 0), 0) +
        (candidate.type === item.type ? 2 : 0) +
        (candidate.featured ? 1 : 0),
    }))
    .toSorted((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

export async function saveMedia(item: MediaItem): Promise<MediaItem> {
  await ensureSchema();
  if (!usesPostgres()) {
    return mutateLocal((state) => {
      state.media.unshift(item);
      return item;
    });
  }
  await getPool().query(
    `INSERT INTO publication_media (id, name, url, mime_type, size_bytes, alt, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [item.id, item.name, item.url, item.mimeType, item.size, item.alt, item.createdAt],
  );
  return item;
}

export async function listMedia(limit = 100): Promise<MediaItem[]> {
  await ensureSchema();
  if (!usesPostgres()) return (await loadLocal()).media.slice(0, limit);
  const result = await getPool().query(
    "SELECT * FROM publication_media ORDER BY created_at DESC LIMIT $1",
    [limit],
  );
  return result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    url: String(row.url),
    mimeType: String(row.mime_type),
    size: Number(row.size_bytes),
    alt: String(row.alt ?? ""),
    createdAt: dateString(row.created_at) ?? new Date().toISOString(),
  }));
}

export async function trackEvent(record: TrackEventRecord): Promise<void> {
  await ensureSchema();
  const event: StoredEvent = {
    id: randomUUID(),
    event: record.input.event,
    contentId: record.input.contentId ?? null,
    path: record.input.path.slice(0, 512),
    referrer: (record.input.referrer ?? "").slice(0, 1024),
    sessionId: (record.input.sessionId ?? "").slice(0, 128),
    visitorHash: record.visitorHash,
    userAgent: record.userAgent.slice(0, 512),
    properties: { ...record.input.properties, client: record.input.client },
    createdAt: new Date().toISOString(),
  };
  if (!usesPostgres()) {
    await mutateLocal((state) => {
      state.events.unshift(event);
      state.events = state.events.slice(0, 20_000);
    });
    return;
  }
  await getPool().query(
    `INSERT INTO publication_events (
      id, event, content_id, path, referrer, session_id, visitor_hash,
      user_agent, properties, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)`,
    [
      event.id,
      event.event,
      event.contentId,
      event.path,
      event.referrer,
      event.sessionId,
      event.visitorHash,
      event.userAgent,
      JSON.stringify(event.properties),
      event.createdAt,
    ],
  );
}

function buildLocalOverview(state: LocalState): AdminOverview {
  const viewEvents = state.events.filter((event) => event.event === "page_view");
  const engagement = state.events.filter((event) => event.event === "engagement");
  const scrollEvents = state.events.filter((event) => event.event === "scroll_depth");
  const visitors = new Set(viewEvents.map((event) => event.visitorHash).filter(Boolean));
  const engagedSeconds = engagement.reduce(
    (sum, event) => sum + Number(event.properties.seconds ?? 0),
    0,
  );
  const averageScroll = scrollEvents.length
    ? scrollEvents.reduce((sum, event) => sum + Number(event.properties.depth ?? 0), 0) /
      scrollEvents.length
    : 0;
  const performance: ContentPerformance[] = state.content.map((item) => {
    const itemViews = viewEvents.filter((event) => event.contentId === item.id);
    const itemEngagement = engagement.filter((event) => event.contentId === item.id);
    const itemScroll = scrollEvents.filter((event) => event.contentId === item.id);
    const seconds = itemEngagement.reduce(
      (sum, event) => sum + Number(event.properties.seconds ?? 0),
      0,
    );
    const scroll = itemScroll.length
      ? itemScroll.reduce((sum, event) => sum + Number(event.properties.depth ?? 0), 0) /
        itemScroll.length
      : 0;
    const uniqueVisitors = new Set(itemViews.map((event) => event.visitorHash).filter(Boolean)).size;
    return {
      id: item.id,
      title: item.title,
      type: item.type,
      status: item.status,
      views: itemViews.length,
      visitors: uniqueVisitors,
      engagedSeconds: Math.round(seconds),
      averageScroll: Math.round(scroll),
      attentionScore: Math.round(itemViews.length * 2 + uniqueVisitors * 3 + seconds / 30 + scroll / 10),
      updatedAt: item.updatedAt,
    };
  });
  return {
    totals: {
      content: state.content.length,
      published: state.content.filter((item) => item.status === "published").length,
      views: viewEvents.length,
      visitors: visitors.size,
      engagedMinutes: Math.round(engagedSeconds / 60),
      averageScroll: Math.round(averageScroll),
    },
    performance,
    recentEvents: state.events.slice(0, 12).map((event) => ({
      id: event.id,
      event: event.event,
      path: event.path,
      createdAt: event.createdAt,
    })),
  };
}

export async function getAdminOverview(): Promise<AdminOverview> {
  await ensureSchema();
  if (!usesPostgres()) return buildLocalOverview(await loadLocal());
  const [totals, performance, recent] = await Promise.all([
    getPool().query<{
      views: string;
      visitors: string;
      engaged_seconds: string;
      average_scroll: string;
    }>(`SELECT
        count(*) FILTER (WHERE event = 'page_view') AS views,
        count(DISTINCT visitor_hash) FILTER (WHERE event = 'page_view' AND visitor_hash <> '') AS visitors,
        coalesce(sum((properties->>'seconds')::numeric) FILTER (WHERE event = 'engagement'), 0) AS engaged_seconds,
        coalesce(avg((properties->>'depth')::numeric) FILTER (WHERE event = 'scroll_depth'), 0) AS average_scroll
      FROM publication_events`),
    getPool().query(`SELECT
        c.id, c.title, c.type, c.status, c.updated_at,
        count(e.id) FILTER (WHERE e.event = 'page_view') AS views,
        count(DISTINCT e.visitor_hash) FILTER (WHERE e.event = 'page_view' AND e.visitor_hash <> '') AS visitors,
        coalesce(sum((e.properties->>'seconds')::numeric) FILTER (WHERE e.event = 'engagement'), 0) AS engaged_seconds,
        coalesce(avg((e.properties->>'depth')::numeric) FILTER (WHERE e.event = 'scroll_depth'), 0) AS average_scroll
      FROM publication_content c
      LEFT JOIN publication_events e ON e.content_id = c.id
      GROUP BY c.id
      ORDER BY views DESC, c.updated_at DESC`),
    getPool().query(
      "SELECT id, event, path, created_at FROM publication_events ORDER BY created_at DESC LIMIT 12",
    ),
  ]);
  const countResult = await getPool().query<{ content: string; published: string }>(
    `SELECT count(*) AS content,
      count(*) FILTER (WHERE status = 'published') AS published
     FROM publication_content`,
  );
  const totalRow = totals.rows[0];
  const contentRow = countResult.rows[0];
  return {
    totals: {
      content: Number(contentRow?.content ?? 0),
      published: Number(contentRow?.published ?? 0),
      views: Number(totalRow?.views ?? 0),
      visitors: Number(totalRow?.visitors ?? 0),
      engagedMinutes: Math.round(Number(totalRow?.engaged_seconds ?? 0) / 60),
      averageScroll: Math.round(Number(totalRow?.average_scroll ?? 0)),
    },
    performance: performance.rows.map((row) => {
      const views = Number(row.views ?? 0);
      const visitors = Number(row.visitors ?? 0);
      const engagedSeconds = Number(row.engaged_seconds ?? 0);
      const averageScroll = Number(row.average_scroll ?? 0);
      return {
        id: String(row.id),
        title: String(row.title),
        type: row.type as ContentKind,
        status: row.status as ContentStatus,
        views,
        visitors,
        engagedSeconds: Math.round(engagedSeconds),
        averageScroll: Math.round(averageScroll),
        attentionScore: Math.round(views * 2 + visitors * 3 + engagedSeconds / 30 + averageScroll / 10),
        updatedAt: dateString(row.updated_at) ?? new Date().toISOString(),
      };
    }),
    recentEvents: recent.rows.map((row) => ({
      id: String(row.id),
      event: row.event as AnalyticsEventName,
      path: String(row.path),
      createdAt: dateString(row.created_at) ?? new Date().toISOString(),
    })),
  };
}

export async function closeDatabase(): Promise<void> {
  if (pool) await pool.end();
  pool = null;
  schemaPromise = null;
}
