# Deploy and Host Ren Publications on Railway

Ren Publications is a self-hosted editorial archive for papers, research, articles, essays, notes, talks, and other long-form work. One Node service serves the Next.js interface and same-origin Express API.

## About Hosting Ren Publications

The template provisions the application, PostgreSQL for durable content and analytics, and a Railway Bucket for uploaded media. The app runs database migrations before each deployment and exposes `/api/health` for Railway health checks.

After deployment, open the generated Railway domain. A first-run onboarding flow creates the single author profile, site identity, visual theme, and admin passphrase. The starter passphrase shown by the app is only a convenience and should be replaced during onboarding.

## Why Deploy Ren Publications on Railway

Railway keeps the web application, API, database, and object storage in one project. Reference variables connect the services without copying credentials, while the checked-in Infrastructure as Code file keeps build and runtime settings reproducible.

The project includes direct custom content paths, a safe MDX-style renderer, rich media embeds, scheduled publishing, recommendations, 24 themes, profile management, SEO metadata, feeds, and privacy-aware first-party analytics.

## Common Use Cases

- A personal research and paper archive
- An independent publication or technical blog
- A public lab notebook with rich media
- A single-author knowledge base
- A portfolio for talks, essays, notes, and long-form projects

## Dependencies for Ren Publications Hosting

The template includes the runtime services needed by the application. A custom domain is optional and can be added after the generated Railway domain is healthy.

### Deployment Dependencies

- One Railway application service built from `shirasakaren/publications`
- One Railway PostgreSQL service exposed through `DATABASE_URL`
- One Railway Bucket exposed through S3-compatible `AWS_*` variables
- A random `SESSION_SECRET` containing at least 32 characters
- An optional canonical `SITE_URL`, such as the final custom-domain origin

## After Deployment

Visit `/onboarding` before sharing the site publicly, choose a strong passphrase, and finish the author and site setup. Then open `/admin` to create content, choose featured work, upload media, configure navigation and themes, and review analytics.

If you add a custom domain, set `SITE_URL` to its complete HTTPS origin and redeploy. Keep database and bucket credentials as Railway reference variables.
