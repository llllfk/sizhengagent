import { readFileSync } from "fs";
import { Pool } from "pg";

function loadDatabaseUrl() {
  try {
    const env = readFileSync(".env.local", "utf8");
    const m = env.match(/^DATABASE_URL=(.+)$/m);
    if (m) return m[1].trim();
  } catch {
    /* ignore */
  }
  return process.env.DATABASE_URL;
}

const url = loadDatabaseUrl();
if (!url) {
  console.error("DATABASE_URL missing (.env.local or env)");
  process.exit(1);
}

const sql = readFileSync("sql/schema.sql", "utf8");
const pool = new Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 20000,
});

try {
  await pool.query(sql);
  const r = await pool.query(
    "select tablename from pg_tables where schemaname='public' order by tablename",
  );
  console.log(
    "ok tables:",
    r.rows.map((x) => x.tablename).join(", "),
  );
} catch (e) {
  console.error("FAIL:", e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await pool.end();
}
