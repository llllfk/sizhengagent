import { readFileSync } from "fs";
import { Client } from "pg";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const sql = readFileSync("sql/schema.sql", "utf8");
const c = new Client({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await c.connect();
await c.query(sql);
const t = await c.query(`select to_regclass('public.learning_issue') as t`);
console.log("learning_issue=", t.rows[0].t);
await c.end();
