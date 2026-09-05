import express from "express";
import next from "next";
import api from "./src/server/api";

const dev = process.env.NODE_ENV !== "production";
const port = Number.parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOST || "0.0.0.0";

if (!dev && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) {
  throw new Error("SESSION_SECRET must contain at least 32 characters in production.");
}

const nextApp = next({ dev, hostname, port });
const handle = nextApp.getRequestHandler();

await nextApp.prepare();

const server = express();
server.set("trust proxy", 1);
server.disable("x-powered-by");
server.use("/api", api);
server.use((request, response) => handle(request, response));

const listener = server.listen(port, hostname, () => {
  console.log(`Ren Publications is listening on ${hostname}:${port}`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received, closing the HTTP server.`);
  listener.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
