# Contributing

Contributions are welcome through focused pull requests.

1. Fork the repository and create a short-lived branch.
2. Install with `npm ci` and run the app through the onboarding flow.
3. Keep infrastructure secrets out of source and preserve the same-origin API model.
4. Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
5. Describe reader, editor, schema, and deployment effects in the pull request.

For database changes, make schema creation idempotent so existing Railway deployments can update safely. For editor changes, keep MDX components allowlisted and previewable without evaluating arbitrary author JavaScript.
