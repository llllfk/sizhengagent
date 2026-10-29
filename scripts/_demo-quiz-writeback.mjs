/**
 * 演示：模拟 S2026001 闯关错题回写，便于验收闭环。
 * 用法：node scripts/_demo-quiz-writeback.mjs
 */
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

const studentId = "S2026001";
const now = new Date().toISOString();
const tag = "服务边界";
const issueId = `liq_demo_${Date.now().toString(36)}`;

const c = new Client({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await c.connect();

await c.query(`
  CREATE TABLE IF NOT EXISTS learning_issue (
    id BIGSERIAL PRIMARY KEY,
    issue_id VARCHAR(64) NOT NULL UNIQUE,
    student_id VARCHAR(64) NOT NULL,
    source VARCHAR(32) NOT NULL DEFAULT 'quiz',
    title VARCHAR(200) NOT NULL,
    detail TEXT NOT NULL,
    weak_tag VARCHAR(64),
    status VARCHAR(16) NOT NULL DEFAULT 'open',
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );
`);

const cur = await c.query(
  `select weak_points, cognition_level from student_profile where student_id=$1`,
  [studentId],
);
const weak = Array.isArray(cur.rows[0]?.weak_points)
  ? cur.rows[0].weak_points
  : [];
const merged = Array.from(new Set([...weak, tag])).slice(0, 10);

await c.query(
  `update student_profile
   set weak_points=$2::jsonb,
       preference = coalesce(preference,'{}'::jsonb) || $3::jsonb,
       updated_at=$4
   where student_id=$1`,
  [
    studentId,
    JSON.stringify(merged),
    JSON.stringify({
      quiz_last: {
        room_id: "demo_room",
        score: 1,
        total: 3,
        wrong_count: 2,
        at: now,
      },
    }),
    now,
  ],
);

await c.query(
  `insert into learning_issue
    (issue_id, student_id, source, title, detail, weak_tag, status, meta, created_at, updated_at)
   values ($1,$2,'quiz',$3,$4,$5,'open',$6::jsonb,$7,$7)
   on conflict (issue_id) do nothing`,
  [
    issueId,
    studentId,
    `闯关错题 · ${tag}`,
    "演示题：客舱规章与温度服务如何兼顾？",
    tag,
    JSON.stringify({ room_id: "demo_room", question_id: "demo_q1" }),
    now,
  ],
);

const after = await c.query(
  `select student_id, weak_points, cognition_level from student_profile where student_id=$1`,
  [studentId],
);
const issues = await c.query(
  `select issue_id, title, status from learning_issue where student_id=$1 and status='open' order by created_at desc limit 5`,
  [studentId],
);
console.log(
  JSON.stringify({ profile: after.rows[0], open_issues: issues.rows }, null, 2),
);
await c.end();
