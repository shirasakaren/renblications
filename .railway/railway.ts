import { bucket, defineRailway, github, postgres, preserve, project, ref, service } from "railway/iac";

// Bind this project-level definition to the application service created by the template.
export const partial = "publications";

export default defineRailway(() => {
  const database = postgres("Postgres", { region: "asia-southeast1-eqsg3a" });
  const media = bucket("publication-media", { region: "sin" });
  const publications = service("publications", {
    source: github("shirasakaren/publications", { branch: "main" }),
    build: {
      builder: "DOCKERFILE",
      dockerfilePath: "/Dockerfile",
    },
    deploy: {
      startCommand: "npm start",
      preDeployCommand: ["npm run db:migrate"],
      healthcheckPath: "/api/health",
      healthcheckTimeout: 120,
      restartPolicyMaxRetries: 5,
      multiRegionConfig: {
        "asia-southeast1-eqsg3a": { numReplicas: 1 },
      },
    },
    env: {
      DATABASE_URL: database.env.DATABASE_URL,
      SESSION_SECRET: preserve(),
      SITE_URL: preserve(),
      AWS_ENDPOINT_URL: ref(media, "ENDPOINT"),
      AWS_ACCESS_KEY_ID: ref(media, "ACCESS_KEY_ID"),
      AWS_SECRET_ACCESS_KEY: ref(media, "SECRET_ACCESS_KEY"),
      AWS_S3_BUCKET_NAME: ref(media, "BUCKET"),
      AWS_DEFAULT_REGION: ref(media, "REGION"),
    },
  });
  return project("publications", {
    resources: [publications, database, media],
  });
});
