# Security policy

## Reporting

Please report suspected vulnerabilities privately through GitHub Security Advisories for this repository. Do not open a public issue with exploit details or credentials.

## Deployment expectations

- Use a random `SESSION_SECRET` containing at least 32 characters.
- Replace the starter onboarding passphrase before public launch.
- Attach PostgreSQL and durable object storage in production.
- Terminate TLS at the hosting platform and keep the admin cookie secure and HTTP-only.
- Keep dependencies updated and review uploaded media policies for the deployment's audience.

The analytics implementation hashes visitor context with a rotating daily input and does not store raw IP addresses. Strict analytics mode also discards user-agent strings.
