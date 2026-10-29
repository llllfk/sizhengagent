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

const c = new Client({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await c.connect();
const t = await c.query(`select to_regclass('public.learning_issue') as t`);
const p = await c.query(
  `select student_id, cognition_level, weak_points from student_profile order by student_id limit 8`,
);
let issues = { n: null, err: null };
try {
  const i = await c.query(`select count(*)::int as n from learning_issue`);
  issues.n = i.rows[0].n;
} catch (e) {
  issues.err = e.message;
}
console.log(JSON.stringify({ table: t.rows[0], profiles: p.rows, issues }, null, 2));
await c.end();
