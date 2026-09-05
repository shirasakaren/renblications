import { closeDatabase, ensureSchema } from "../src/lib/db";

await ensureSchema();
await closeDatabase();
console.log("Publication database schema is ready.");
