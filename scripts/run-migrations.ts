import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import "../server/load-env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, "..", "supabase", "migrations");
const rawDatabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "";
const mustRun = process.env.RENDER === "true" || process.env.NODE_ENV === "production";

function redactConnectionString(value: string) {
  try {
    const url = new URL(value);
    if (url.password) url.password = "***";
    return url.toString();
  } catch {
    return "[invalid database url]";
  }
}

function normalizeDatabaseUrl(value: string) {
  let normalized = String(value || "").trim().replace(/^DATABASE_URL=/, "").replace(/^SUPABASE_DB_URL=/, "");

  const nested = normalized.match(/postgres(?:ql)?:\/\/[^:]+:DATABASE_URL=(postgres(?:ql)?:\/\/.*)$/i);
  if (nested?.[1]) normalized = nested[1];

  const lastPostgresUrlIndex = Math.max(normalized.lastIndexOf("postgresql://"), normalized.lastIndexOf("postgres://"));
  if (lastPostgresUrlIndex > 0) normalized = normalized.slice(lastPostgresUrlIndex);

  if (!/^postgres(?:ql)?:\/\//i.test(normalized)) return normalized;

  const url = new URL(normalized);
  if (!url.hostname.includes("localhost")) {
    // Supabase pooler certificates can fail strict CA validation in small Alpine/Render images.
    // libpq compatibility keeps SSL encrypted while avoiding the pg v9 verify-full alias warning.
    url.searchParams.set("sslmode", process.env.PGSSLMODE || "require");
    url.searchParams.set("uselibpqcompat", "true");
  }
  return url.toString();
}

const databaseUrl = normalizeDatabaseUrl(rawDatabaseUrl);

if (!databaseUrl) {
  const text = "Set DATABASE_URL or SUPABASE_DB_URL so Struta database migrations can run.";
  if (mustRun) {
    console.error(text);
    process.exit(1);
  }
  console.log(`${text} Skipping local migration run.`);
  process.exit(0);
}

if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
  console.error("DATABASE_URL must be a postgres connection string, not an env assignment or placeholder.");
  process.exit(1);
}

console.log("Running database migrations...");
console.log(`Database target: ${redactConnectionString(databaseUrl)}`);

const sslEnabled = !databaseUrl.includes("localhost");
const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  keepAlive: true,
  connectionTimeoutMillis: 15_000,
  query_timeout: 120_000,
});

async function ensureMigrationsTable() {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public._struta_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getApplied(): Promise<Set<string>> {
  const { rows } = await client.query<{ filename: string }>("SELECT filename FROM public._struta_migrations ORDER BY filename");
  return new Set(rows.map((r) => r.filename));
}

async function runMigration(filename: string, sql: string) {
  console.log(`Applying ${filename}...`);
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query("INSERT INTO public._struta_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING", [filename]);
    await client.query("COMMIT");
    console.log(`OK ${filename}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function main() {
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  if (files.length === 0) {
    console.log("No migration files found.");
    return;
  }
  try {
    await client.connect();
  } catch (error: any) {
    const message = String(error?.message || error);
    if (message.includes("Tenant or user not found")) {
      console.error("Could not connect to Supabase pooler: tenant/user not found.");
      console.error("Check that DATABASE_URL uses username postgres.<project-ref> and that the password is URL encoded.");
    }
    if (message.includes("self-signed certificate")) {
      console.error("Supabase pooler SSL certificate chain was rejected by the container. The runner now forces encrypted SSL with rejectUnauthorized=false and uselibpqcompat=true.");
    }
    throw error;
  }
  await ensureMigrationsTable();
  const applied = await getApplied();
  let count = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`Skipping ${file} (already applied)`);
      continue;
    }
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    await runMigration(file, sql);
    count += 1;
  }
  console.log(count === 0 ? "All migrations up to date." : `Applied ${count} migration(s).`);
  await client.end();
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
