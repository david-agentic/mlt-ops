import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { config } from "@/lib/config";

// Each Workers isolate can spin up its own connection pool with no guarantee
// it's ever torn down, so a serverless/edge runtime needs a tiny pool and a
// short idle timeout to avoid exhausting Neon's pooler connection ceiling —
// confirmed by real production 503s (roughly every other request) once
// deployed with the previous defaults (max: 10, no idle_timeout).
const client = postgres(config.databaseUrl, { max: 1, idle_timeout: 1 });

export const db = drizzle(client, { schema });
