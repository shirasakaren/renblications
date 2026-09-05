# Railway template notes

The application is a single Node service with same-origin Next.js pages and Express APIs. A complete deployment also needs one PostgreSQL service and, for durable uploads, one Railway Bucket.

The app service expects `DATABASE_URL` to reference the PostgreSQL service. Bucket credentials use the standard `AWS_*` names documented in `.env.example`. `SESSION_SECRET` must be a random value of at least 32 characters.

The checked-in `.railway/railway.ts` configures the build, migrations, start command, and health check through Railway Infrastructure as Code. Site identity, author profile, navigation, analytics policy, active theme, and the admin passphrase live in the database and are created through the browser onboarding flow.
