import { readFileSync } from "fs";
import { join } from "path";
import { hasDb, query } from "@/lib/db";
import { CABIN_CASES_ASSEMBLY } from "@/lib/content/cabinCasesAssembly";
import {
  QUIZ_BANK_SEED,
  WORDCARD_BANK_SEED,
} from "@/lib/content/interactiveBank";
import { KNOWLEDGE_CORPUS } from "@/lib/content/knowledgeCorpus";
import {
  galleryObjectKey,
  WORKS_GALLERY,
} from "@/lib/content/worksGallery";
import { ensureTestUsers } from "@/lib/repo/users";
import {
  pgUpsertCabinCase,
  pgUpsertInteractiveContent,
  pgUpsertKnowledgeSnippet,
  pgUpsertWorkGallery,
} from "@/lib/repo/pg";

let schemaReady: Promise<boolean> | null = null;
let seedReady: Promise<boolean> | null = null;

/**
 * 运行时默认只保证表结构存在（幂等、很快）。
 * 演示种子请用 seedPgIfNeeded()，勿挂在登录上。
 */
export function ensurePg(): Promise<boolean> {
  if (!hasDb()) return Promise.resolve(false);
  if (!schemaReady) {
    schemaReady = applySchema().catch((e) => {
      console.error("[pg] schema failed", e);
      schemaReady = null;
      return false;
    });
  }
  return schemaReady;
}

async function applySchema() {
  const schemaPath = join(process.cwd(), "sql", "schema.sql");
  const sql = readFileSync(schemaPath, "utf8");
  await query(sql);
  return true;
}

/**
 * 空库时一次性灌入演示内容（账号、题库、语料、案例、成果等）。
 * 已有足够数据则立刻返回。供 /api/health 或运维主动触发，不跟登录绑。
 */
export function seedPgIfNeeded(): Promise<boolean> {
  if (!hasDb()) return Promise.resolve(false);
  if (!seedReady) {
    seedReady = runSeedIfNeeded().catch((e) => {
      console.error("[pg] seed failed", e);
      seedReady = null;
      return false;
    });
  }
  return seedReady;
}

async function runSeedIfNeeded() {
  const ok = await ensurePg();
  if (!ok) return false;

  await ensureTestUsers();
  await ensureAccountTasks();

  const stock = await query<{
    quiz: string;
    knowledge: string;
    cabin: string;
    works: string;
  }>(
    `select
       (select count(*)::text from interactive_content where type='quiz') as quiz,
       (select count(*)::text from knowledge_snippet) as knowledge,
       (select count(*)::text from cabin_case) as cabin,
       (select count(*)::text from work_gallery) as works`,
  );
  const row = stock.rows[0];
  const needHeavy =
    Number(row?.quiz ?? 0) < 40 ||
    Number(row?.knowledge ?? 0) < 10 ||
    Number(row?.cabin ?? 0) < 8 ||
    Number(row?.works ?? 0) < 8;

  if (needHeavy) {
    console.log("[pg] heavy seed start", row);
    await Promise.all([
      ensureCabinAssemblyCases(),
      ensureKnowledgeCorpus(),
      ensureInteractiveBank(),
      ensureWorkGallery(),
    ]);
    console.log("[pg] heavy seed done");
  }

  const count = await query<{ c: string }>(
    `select count(*)::text as c from student_profile`,
  );
  if (Number(count.rows[0]?.c ?? 0) > 0) return true;

  const now = new Date().toISOString();
  const students = [
    {
      id: "S2026001",
      name: "林晓航",
      tag: "expression",
      level: 2,
      weak: ["服务边界", "应急沟通"],
    },
    {
      id: "S2026008",
      name: "陈思远",
      tag: "creation",
      level: 3,
      weak: ["价值权衡"],
    },
    {
      id: "S2026015",
      name: "周予安",
      tag: "experience",
      level: 2,
      weak: ["客舱秩序", "人民至上落地"],
    },
    {
      id: "demo-student",
      name: "演示学员",
      tag: "creation",
      level: 2,
      weak: ["职业伦理"],
    },
  ];

  for (const s of students) {
    await query(
      `insert into student_profile
        (student_id,name,type_tag,cognition_level,weak_points,updated_at)
       values ($1,$2,$3,$4,$5::jsonb,$6)
       on conflict (student_id) do nothing`,
      [s.id, s.name, s.tag, s.level, JSON.stringify(s.weak), now],
    );
  }

  await query(
    `insert into qa_escalation
      (escalation_id,session_id,student_id,summary,teacher_status,created_at)
     values
      ('esc_seed_1','qs_seed_1','S2026001',$1,'pending',$2),
      ('esc_seed_2','qs_seed_2','S2026015',$3,'accepted',$4)
     on conflict (escalation_id) do nothing`,
    [
      "旅客坚持带超规随身行李登机，学员追问「人情与规则」两轮后仍无法形成可执行预案，请求专题答疑。",
      new Date(Date.now() - 36e5).toISOString(),
      "颠簸中旅客拒绝回座，涉及安全指令与沟通温度；AI 判定为高敏感价值情境，建议教师介入。",
      new Date(Date.now() - 72e5).toISOString(),
    ],
  );

  await query(
    `insert into layered_task
      (task_id,student_id,type_tag,title,type,brief,status,progress,assigned_at,updated_at)
     values
      ('task_seed_1','S2026008','creation','AI短视频：客舱里的价值抉择','short_video',$1,'todo',0,$2,$2),
      ('task_seed_2','S2026001','expression','街头采访：人民至上在服务现场','interview',$3,'doing',40,$2,$2),
      ('task_seed_3','S2026015','experience','行走的思政课：校园/航站楼观察','field_trip',$4,'done',100,$2,$2)
     on conflict (task_id) do nothing`,
    [
      "用短视频工坊完成脚本→分镜→字幕→成片归档，突出一个思政价值点。",
      now,
      "采访 3 位同学或路人，问「遇到规则与人情冲突时你会怎么选」，整理 1 分钟口述稿。",
      "观察一处真实服务场景，记录「安全—秩序—温度」三要素，提交观察笔记。",
    ],
  );

  await query(
    `insert into work (work_id,student_id,type,file_uri,award_level,meta,created_at)
     values ('work_seed_1','S2026008','short_video','works/demo/turbulence.mp4','校级优胜',$1::jsonb,$2)
     on conflict (work_id) do nothing`,
    [JSON.stringify({ title: "颠簸中的回座指令" }), now],
  );

  await query(
    `insert into forum_topic
      (topic_id,title,body,source,source_ref,tags,author_id,author_name,author_role,reply_count,hot,pinned,created_at)
     values
      ('tp_debate_1','客舱服务该不该「适度通融」？',$1,'debate','room_debate_seed',$2::jsonb,'T-teacher','李老师','teacher',1,96,true,$3),
      ('tp_esc_1','超规行李：人情与规则如何两全？',$4,'escalation','esc_seed_1',$5::jsonb,'T-teacher','李老师','teacher',0,78,false,$6)
     on conflict (topic_id) do nothing`,
    [
      "【课中辩论回流】在保障安全与规章的前提下，是否允许乘务员对旅客诉求做「适度通融」。",
      JSON.stringify(["课堂辩论", "服务边界", "安全优先"]),
      new Date(Date.now() - 6 * 36e5).toISOString(),
      "【疑难转接回流】旅客坚持带超规随身行李登机，人情与规则两难。",
      JSON.stringify(["转接议题", "职业伦理"]),
      new Date(Date.now() - 18 * 36e5).toISOString(),
    ],
  );

  await query(
    `insert into forum_reply
      (reply_id,topic_id,author_id,author_name,author_role,content,created_at)
     values ('rp_seed_1','tp_debate_1','S2026001','林晓航','student',$1,$2)
     on conflict (reply_id) do nothing`,
    [
      "通融不是破规，而是在规章裁量空间里给出有温度的解释与替代方案。",
      new Date(Date.now() - 5 * 36e5).toISOString(),
    ],
  );

  await query(
    `insert into highlight
      (highlight_id,title,excerpt,tags,source_topic_id,pinned,refluxed,created_at)
     values
      ('hl_seed_1','通融 ≠ 破规：裁量区间要可视化',$1,$2::jsonb,'tp_debate_1',true,true,$3),
      ('hl_seed_2','超规行李三步法：共情 · 对照 · 双路径',$4,$5::jsonb,'tp_esc_1',true,false,$6)
     on conflict (highlight_id) do nothing`,
    [
      "辩论共识：温度服务建立在可解释、可量化的规章裁量之上。",
      JSON.stringify(["课堂辩论", "服务边界"]),
      new Date(Date.now() - 2 * 36e5).toISOString(),
      "共情诉求 → 尺寸对照卡 → 托运/收费双选项。",
      JSON.stringify(["转接议题", "职业伦理"]),
      new Date(Date.now() - 8 * 36e5).toISOString(),
    ],
  );

  console.log("[pg] seed demo data ok");
  return true;
}

/** @deprecated 兼容旧名：现仅建表，不再灌种子 */
export const bootstrapPg = ensurePg;

/** 汇编 15 条客舱案例幂等入库 */
async function ensureCabinAssemblyCases() {
  // 去掉早期占位种子，避免与汇编真实案例混选
  await query(
    `delete from cabin_case where case_id in ('cabin_seed_1','cabin_seed_2')`,
  );
  for (const c of CABIN_CASES_ASSEMBLY) {
    await pgUpsertCabinCase({
      case_id: c.case_id,
      title: c.title,
      category: c.category,
      scenario: c.scenario,
      roles: c.roles,
      focus: c.focus,
      difficulty: c.difficulty,
      emergency_level: c.emergency_level,
      solution: c.solution,
      source: c.source,
      meta: c.meta,
    });
  }
}

/** 安全案例库 + 思政案例精选语料入库 */
async function ensureKnowledgeCorpus() {
  for (const s of KNOWLEDGE_CORPUS) {
    await pgUpsertKnowledgeSnippet({
      snippet_id: s.snippet_id,
      kind: s.kind,
      title: s.title,
      summary: s.summary,
      teaching_point: s.teaching_point,
      keywords: s.keywords,
      source_file: s.source_file,
      source_note: s.source_note,
    });
  }
}

/** 成果库元数据入库；mp4 本体上 Coze S3（file_uri = 对象 Key），不进 PG */
async function ensureWorkGallery() {
  for (let i = 0; i < WORKS_GALLERY.length; i++) {
    const clip = WORKS_GALLERY[i]!;
    await pgUpsertWorkGallery({
      clip_id: clip.id,
      title: clip.title,
      award: clip.award,
      tag: clip.tag,
      size_variant: clip.size,
      source_file: clip.file,
      file_uri: galleryObjectKey(clip),
      sort_order: i + 1,
    });
  }
}

/** 互动内容库：闯关题 + 词卡精选入库 */
async function ensureInteractiveBank() {
  for (const q of QUIZ_BANK_SEED) {
    await pgUpsertInteractiveContent({
      content_id: q.id,
      type: "quiz",
      title: `[${q.chapter}] ${q.stem.slice(0, 40)}`,
      body: JSON.stringify({
        stem: q.stem,
        options: q.options,
        answer: q.answer,
        difficulty: q.difficulty,
        chapter: q.chapter,
        source_file: q.source_file,
      }),
      source: "teacher",
      created_by: "interactive_bank",
      approved: true,
    });
  }
  for (const w of WORDCARD_BANK_SEED) {
    await pgUpsertInteractiveContent({
      content_id: w.id,
      type: "wordcard",
      title: w.term,
      body: JSON.stringify({
        term: w.term,
        hint: w.hint,
        source_file: w.source_file,
      }),
      source: "teacher",
      created_by: "interactive_bank",
      approved: true,
    });
  }
}

/** 已有库也保证测试账号有画像与可演示任务（幂等） */
async function ensureAccountTasks() {
  const now = new Date().toISOString();
  const profiles = [
    {
      id: "S2026001",
      name: "林晓航",
      tag: "expression",
      level: 2,
      weak: ["服务边界", "应急沟通"],
    },
    {
      id: "S2026008",
      name: "陈思远",
      tag: "creation",
      level: 3,
      weak: ["价值权衡"],
    },
  ];
  for (const s of profiles) {
    await query(
      `insert into student_profile
        (student_id,name,type_tag,cognition_level,weak_points,updated_at)
       values ($1,$2,$3,$4,$5::jsonb,$6)
       on conflict (student_id) do nothing`,
      [s.id, s.name, s.tag, s.level, JSON.stringify(s.weak), now],
    );
  }

  await query(
    `insert into layered_task
      (task_id,student_id,type_tag,title,type,brief,status,progress,assigned_at,updated_at)
     values
      ('task_acct_S2026001','S2026001','expression','街头采访：人民至上在服务现场','interview',$1,'doing',40,$2,$2),
      ('task_acct_S2026008','S2026008','creation','AI短视频：客舱里的价值抉择','short_video',$3,'todo',0,$2,$2)
     on conflict (task_id) do nothing`,
    [
      "采访 3 位同学或路人，问「遇到规则与人情冲突时你会怎么选」，整理 1 分钟口述稿。",
      now,
      "用短视频工坊完成脚本→分镜→字幕→成片归档，突出一个思政价值点。",
    ],
  );
}
