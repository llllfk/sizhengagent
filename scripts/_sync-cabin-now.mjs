import { readFileSync } from "fs";
import { Client } from "pg";
import { createRequire } from "module";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// load env
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
process.env.DATABASE_URL = env.DATABASE_URL;

const { CABIN_CASES_ASSEMBLY } = await import(
  "../lib/content/cabinCasesAssembly.ts"
).catch(async () => {
  // fallback: use tsx loader path via dynamic
  throw new Error("need tsx to import ts");
});

const c = new Client({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await c.connect();
const before = await c.query(`select count(*)::int as c from cabin_case`);
console.log("before", before.rows[0].c);

for (const x of CABIN_CASES_ASSEMBLY) {
  await c.query(
    `insert into cabin_case
      (case_id,title,category,scenario,roles,focus,difficulty,emergency_level,solution,source,meta)
     values ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11::jsonb)
     on conflict (case_id) do update set
       title=excluded.title,
       category=excluded.category,
       scenario=excluded.scenario,
       roles=excluded.roles,
       focus=excluded.focus,
       difficulty=excluded.difficulty,
       emergency_level=excluded.emergency_level,
       solution=excluded.solution,
       source=excluded.source,
       meta=excluded.meta`,
    [
      x.case_id,
      x.title,
      x.category ?? null,
      x.scenario,
      JSON.stringify(x.roles ?? []),
      x.focus ?? null,
      x.difficulty,
      x.emergency_level,
      x.solution ?? null,
      x.source,
      JSON.stringify(x.meta ?? {}),
    ],
  );
}

const after = await c.query(`select count(*)::int as c from cabin_case`);
const news = await c.query(
  `select case_id, title from cabin_case
   where case_id in (
     'asm_mu6741_kneel','asm_ca2754_door','asm_hu7041_assault',
     'asm_bomb_hoax_cz2857','asm_pkx_upgrade','asm_9c8559_ecig','asm_uav_blackfly'
   ) order by case_id`,
);
console.log("assembly", CABIN_CASES_ASSEMBLY.length);
console.log("after", after.rows[0].c);
for (const r of news.rows) console.log("-", r.case_id, r.title);
await c.end();
