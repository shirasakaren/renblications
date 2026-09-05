# Ren Publications

A self-hosted, single-author publishing system for papers, research, articles, blogs, essays, notes, talks, and longer publications. Next.js renders the reader and admin interfaces while Express serves the same-origin API from the same Node process.

The project includes a secure first-run onboarding flow, an MDX-style editor with live preview, private media storage, privacy-aware first-party analytics, scheduled publishing, recommendations, RSS and sitemap discovery, and 24 paired light and dark themes.

## What is included

- Public homepage with a configurable featured publication and format archives
- Direct custom URLs such as `/article1` or `/notes/field-test`
- Passphrase-gated `/admin` workspace with persistent, revocable sessions
- Article, blog, paper, publication, research, essay, note, and talk collections
- Safe markdown, GFM tables, math, syntax highlighting, callouts, and copyable code
- Embeddable YouTube, image, video, audio, document, and link-preview blocks
- Inline PDF/document viewing and durable S3-compatible media storage
- Per-piece SEO, canonical URLs, structured data, RSS, sitemap, and robots controls
- Automatic scheduled publishing and related-content recommendations
- First-party views, readers, active time, scroll depth, campaign, outbound-link, media, recommendation, and code-copy analytics
- Configurable data retention, Do Not Track support, and no raw IP storage
- Author profile with direct image upload, Gravatar fallback, biography, location, and links
- Railway health checks, migrations, PostgreSQL, Bucket support, and template notes

## Local development

Requirements: Node.js 22 or newer.

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`. A fresh instance redirects to onboarding. PostgreSQL and S3 are optional locally: without them, the app uses an ignored atomic JSON store and `public/uploads`.

The starter passphrase shown during onboarding is `RenCantik@321`. Change it before exposing an instance publicly.

## Environment

Only runtime infrastructure belongs in `.env`:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Production | PostgreSQL connection string |
| `SESSION_SECRET` | Production | Random secret of at least 32 characters |
| `SITE_URL` | Optional | Canonical origin; request headers are used when omitted |
| `AWS_ENDPOINT_URL` | For durable uploads | S3-compatible endpoint |
| `AWS_ACCESS_KEY_ID` | For durable uploads | Bucket access key |
| `AWS_SECRET_ACCESS_KEY` | For durable uploads | Bucket secret |
| `AWS_S3_BUCKET_NAME` | For durable uploads | Bucket name |
| `AWS_DEFAULT_REGION` | Optional | S3 region, defaults to `auto` |

Site identity, navigation, theme, profile, analytics policy, featured content, and the admin passphrase are stored in the database and edited in `/admin`.

## Authoring

The editor stores a controlled MDX-style source format. Standard markdown, GFM, math, tables, and fenced code work directly. Rich media blocks use these forms:

```mdx
<YouTube url="https://www.youtube.com/watch?v=..." title="Talk" />
<Image src="/api/media/.../file" alt="Description" title="Figure" />
<Video src="/api/media/.../file" title="Recording" />
<Audio src="/api/media/.../file" title="Interview" />
<Document src="/api/media/.../file" title="Paper PDF" />
<LinkPreview url="https://example.com" title="Reference" />

:::callout title="A note"
Callout content supports markdown.
:::
```

The format is intentionally parsed into a small allowlist rather than evaluating arbitrary JSX on the server.

## Railway

The checked-in [`.railway/railway.ts`](./.railway/railway.ts) defines the Docker build, migration command, production start command, health check, PostgreSQL database, and media bucket through Railway Infrastructure as Code. A complete deployment uses:

1. One app service from this repository
2. One PostgreSQL service referenced by `DATABASE_URL`
3. One Railway Bucket whose S3 credentials map to the `AWS_*` variables above
4. A generated `SESSION_SECRET`
5. An optional `SITE_URL` after the custom domain is active

Railway injects `PORT`; the app binds to `0.0.0.0` and serves both web and API traffic from one domain. See [`.railway/README.md`](./.railway/README.md) for template-specific notes.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## License

[MIT](./LICENSE)
