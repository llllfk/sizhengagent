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
import { ensureClassSeed } from "@/lib/repo/classes";
import { ensureTeacherAccount } from "@/lib/repo/users";
import {
  pgUpsertCabinCase,
  pgUpsertInteractiveContent,
  pgUpsertKnowledgeSnippet,
  pgUpsertWorkGallery,
} from "@/lib/repo/pg";

let schemaReady: Promise<boolean> | null = null;
let seedReady: Promise<boolean> | null = null;
let cabinSyncReady: Promise<void> | null = null;

/**
 * 业务入口的库就绪检查。
 * 客户库已有表和数据时默认直接放行，不再跑建表 / 客舱同步（会拖慢进页）。
 * 仅当环境变量 QI_HANG_ENSURE_PG=1 时，才执行完整建表+汇编同步（空库首启用）。
 */
export function ensurePg(): Promise<boolean> {
  if (!hasDb()) return Promise.resolve(false);
  if (process.env.QI_HANG_ENSURE_PG !== "1") {
    return Promise.resolve(true);
  }
  if (!schemaReady) {
    schemaReady = applySchema()
      .then(async () => {
        await syncCabinAssemblyCases();
        return true;
      })
      .catch(async (e) => {
        console.error("[pg] schema failed", e);
        try {
          await query("select 1::int as n");
          console.warn("[pg] schema soft-fail; DB reachable, continue");
          await syncCabinAssemblyCases().catch((e2) =>
            console.error("[pg] cabin sync after soft-fail", e2),
          );
          return true;
        } catch (e2) {
          console.error("[pg] unreachable", e2);
          schemaReady = null;
          return false;
        }
      });
  }
  return schemaReady;
}

/** 进程内只跑一次：把代码里的汇编案例幂等 upsert 进库 */
export function syncCabinAssemblyCases(): Promise<void> {
  if (!hasDb()) return Promise.resolve();
  if (!cabinSyncReady) {
    cabinSyncReady = ensureCabinAssemblyCases()
      .then(() => {
        console.log(
          `[pg] cabin assembly synced (${CABIN_CASES_ASSEMBLY.length})`,
        );
      })
      .catch((e) => {
        console.error("[pg] cabin assembly sync failed", e);
        cabinSyncReady = null;
        throw e;
      });
  }
  return cabinSyncReady;
}

async function applySchema() {
  const schemaPath = join(process.cwd(), "sql", "schema.sql");
  const sql = readFileSync(schemaPath, "utf8");
  await query(sql);
  try {
    await query(
      `alter table student_profile drop constraint if exists student_profile_type_tag_check`,
    );
    await query(
      `alter table student_profile add constraint student_profile_type_tag_check
       check (type_tag in ('untyped','expression','creation','experience','deliberation','inquiry'))`,
    );
  } catch (e) {
    console.error("[pg] type_tag check skipped", e);
  }
}

async function untypeInactivePortraits() {
  try {
    await query(
      `update student_profile p
       set type_tag = 'untyped',
           updated_at = now()
       where p.type_tag <> 'untyped'
         and not exists (select 1 from qa_session q where q.student_id = p.student_id)
         and not exists (select 1 from work w where w.student_id = p.student_id)
         and not exists (
           select 1 from layered_task t
           where t.student_id = p.student_id and (t.progress > 0 or t.status <> 'todo')
         )
         and not exists (
           select 1 from video_project v
           where v.student_id = p.student_id
             and (coalesce(v.script, '') <> '' or coalesce(v.step, 1) >= 2)
         )
         and coalesce(p.preference->>'quiz_last', '') = ''`,
    );
  } catch (e) {
    console.error("[pg] untype inactive skipped", e);
  }
}

/**
 * 仅空库时灌一次种子。知识库 / 题库已有数据则立刻跳过。
 * 调用方：GET /api/health?seed=1（运维显式触发），不跟登录、跟帖绑。
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

  // 已有知识库或题库 = 认为灌过，不再写展示假数据
  const stock = await query<{
    quiz: string;
    knowledge: string;
    cabin: string;
    works: string;
    profiles: string;
  }>(
    `select
       (select count(*)::text from interactive_content where type='quiz') as quiz,
       (select count(*)::text from knowledge_snippet) as knowledge,
       (select count(*)::text from cabin_case) as cabin,
       (select count(*)::text from work_gallery) as works,
       (select count(*)::text from student_profile) as profiles`,
  );
  const row = stock.rows[0];
  const alreadyFilled =
    Number(row?.knowledge ?? 0) > 0 ||
    Number(row?.quiz ?? 0) > 0 ||
    Number(row?.cabin ?? 0) > 0 ||
    Number(row?.profiles ?? 0) > 0;
  // 无论是否空库，都先补全客舱汇编（含新增思政案例库）
  await syncCabinAssemblyCases();

  if (alreadyFilled) {
    console.log("[pg] seed skip heavy, cabin synced", row);
    return true;
  }

  await ensureTeacherAccount();
  await ensureClassSeed();
  await ensureAccountTasks();

  console.log("[pg] heavy seed start (empty db)", row);
  await Promise.all([
    ensureKnowledgeCorpus(),
    ensureInteractiveBank(),
    ensureWorkGallery(),
  ]);
  console.log("[pg] heavy seed done");

  const count = await query<{ c: string }>(
    `select count(*)::text as c from student_profile`,
  );
  if (Number(count.rows[0]?.c ?? 0) > 0) {
    return true;
  }

  const now = new Date().toISOString();
  const students = [
    {
      id: "S2026001",
      name: "林晓航",
      tag: "untyped",
      level: 2,
      weak: ["服务边界", "应急沟通"],
    },
    {
      id: "S2026008",
      name: "陈思远",
      tag: "untyped",
      level: 3,
      weak: ["价值权衡"],
    },
    {
      id: "S2026015",
      name: "周予安",
      tag: "untyped",
      level: 2,
      weak: ["客舱秩序", "人民至上落地"],
    },
    {
      id: "S2026020",
      name: "钱思齐",
      tag: "untyped",
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

  console.log("[pg] seed data ok");
  await untypeInactivePortraits();
  return true;
}

/** @deprecated 兼容旧名：现仅建表，不再灌种子 */
export const bootstrapPg = ensurePg;

/** 原汇编 15 + 新《民用航空法》思政案例库 7，幂等入库 */
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

/** 展示用学情 / 议题加厚（幂等，已有库也可补） */
async function ensureShowcaseFill() {
  const now = new Date().toISOString();
  const hour = 36e5;

  await query(
    `insert into qa_session
      (session_id, student_id, q_type, question, followup_chain, status, created_at, updated_at)
     values
      ('qs_show_1','S2026001','scenario',$1,$2::jsonb,'escalated',$3,$3),
      ('qs_show_2','S2026001','value',$4,$5::jsonb,'open',$6,$6),
      ('qs_show_3','S2026008','knowledge',$7,$8::jsonb,'resolved',$9,$9),
      ('qs_show_4','S2026015','scenario',$10,$11::jsonb,'open',$12,$12)
     on conflict (session_id) do nothing`,
    [
      "颠簸中旅客拒绝回座，先讲安全还是先安抚？",
      JSON.stringify([
        { role: "ai", content: "你怎么看：先稳住场面，还是先把安全指令说清楚？" },
        { role: "student", content: "我想先劝两句，怕旅客觉得态度硬。" },
        { role: "ai", content: "依据是什么？客舱手册里回座指令的优先级如何排列？" },
      ]),
      new Date(Date.now() - 8 * hour).toISOString(),
      "客舱服务里的「人民至上」，是不是尽量满足旅客要求？",
      JSON.stringify([
        { role: "ai", content: "人民至上首先护的是什么？生命、秩序，还是体验？" },
        { role: "student", content: "应该是生命安全，但服务也要有温度。" },
      ]),
      new Date(Date.now() - 3 * hour).toISOString(),
      "什么是民航安全红线意识？",
      JSON.stringify([
        { role: "ai", content: "红线在客舱岗位上，具体会卡在哪几个动作？" },
        { role: "student", content: "应急设备、安全带、违规占用通道。" },
        { role: "ai", content: "很好。再换个情境：红眼航班旅客困倦，你还会坚持巡视吗？" },
      ]),
      new Date(Date.now() - 20 * hour).toISOString(),
      "特殊旅客要求加座，与超售冲突时怎么处置？",
      JSON.stringify([
        { role: "ai", content: "规章给了哪些替代路径？怎样既守底线又留温度？" },
      ]),
      new Date(Date.now() - 5 * hour).toISOString(),
    ],
  );

  await query(
    `insert into qa_escalation
      (escalation_id,session_id,student_id,summary,teacher_status,created_at)
     values
      ('esc_show_1','qs_show_1','S2026001',$1,'pending',$2),
      ('esc_show_2','qs_show_4','S2026015',$3,'accepted',$4),
      ('esc_show_3','qs_seed_extra','S2026008',$5,'scheduled',$6)
     on conflict (escalation_id) do nothing`,
    [
      "颠簸拒回座：学员两轮后仍把「态度」放在安全指令之前，需教师专题引导。",
      new Date(Date.now() - 7 * hour).toISOString(),
      "加座与超售冲突：涉及公平与特殊旅客保障，建议课堂案例复盘。",
      new Date(Date.now() - 26 * hour).toISOString(),
      "短视频选题「别管安全偷偷放行」触发价值闸门，需教师确认导向后再发布。",
      new Date(Date.now() - 12 * hour).toISOString(),
    ],
  );

  await query(
    `insert into learning_issue
      (issue_id,student_id,source,title,detail,weak_tag,status,created_at,updated_at)
     values
      ('li_show_1','S2026001','quiz','安全带与回座指令的优先级','闯关错题：颠簸中应先完成回座指令再做解释。','应急沟通','open',$1,$1),
      ('li_show_2','S2026001','escalation','人情与规则的裁量边界','转接议题：超规行李不可破规，但可给托运/改签双路径。','服务边界','open',$2,$2),
      ('li_show_3','S2026008','quiz','三个敬畏如何落到巡视动作','错题回写：敬畏生命对应每轮客舱巡视的确认动作。','职业伦理','open',$3,$3),
      ('li_show_4','S2026015','quiz','人民至上不是有求必应','错题回写：生命安全优先于体验满足。','人民至上落地','open',$4,$4),
      ('li_show_5','S2026008','escalation','作品导向需再校准','价值闸门拦截后待教师确认选题。','价值权衡','open',$5,$5)
     on conflict (issue_id) do nothing`,
    [
      new Date(Date.now() - 4 * hour).toISOString(),
      new Date(Date.now() - 9 * hour).toISOString(),
      new Date(Date.now() - 15 * hour).toISOString(),
      new Date(Date.now() - 6 * hour).toISOString(),
      new Date(Date.now() - 11 * hour).toISOString(),
    ],
  );

  await query(
    `insert into layered_task
      (task_id,student_id,type_tag,title,type,brief,status,progress,assigned_at,updated_at)
     values
      ('task_show_1','S2026001','expression','口述稿：一次回座沟通','interview',$1,'doing',65,$2,$2),
      ('task_show_2','S2026008','creation','分镜：客舱里的三个敬畏','short_video',$3,'doing',35,$2,$2),
      ('task_show_3','S2026015','experience','航站楼观察笔记（安全-秩序-温度）','field_trip',$4,'todo',10,$2,$2),
      ('task_show_4','S2026020','creation','微电影选题校准：生命优先','micro_film',$5,'todo',0,$2,$2)
     on conflict (task_id) do nothing`,
    [
      "把「先指令、后解释」写成 90 秒口述，录给同组互评。",
      now,
      "用三镜完成：巡视、制止、收束金句，突出敬畏生命。",
      "观察值机或安检现场，记录一次冲突如何被规则接住。",
      "围绕人民至上，写 6 镜脚本，避开「破规通融」导向。",
    ],
  );

  await query(
    `insert into forum_topic
      (topic_id,title,body,source,source_ref,tags,author_id,author_name,author_role,reply_count,hot,pinned,created_at)
     values
      ('tp_show_1','回座指令能不能「先软后硬」？',$1,'manual',null,$2::jsonb,'T-teacher','李雷','teacher',2,88,false,$3),
      ('tp_show_2','红线意识：客舱里哪三件事绝不能让？',$4,'manual',null,$5::jsonb,'S2026008','陈思远','student',1,74,false,$6),
      ('tp_show_3','特殊旅客保障与公平，如何同时成立？',$7,'debate','room_debate_show',$8::jsonb,'T-teacher','李雷','teacher',1,81,false,$9)
     on conflict (topic_id) do nothing`,
    [
      "学员常见误区是把态度放在指令前面。请结合手册讨论：软硬顺序能不能倒？",
      JSON.stringify(["安全指令", "沟通温度"]),
      new Date(Date.now() - 10 * hour).toISOString(),
      "设备、通道、安全带——你还补充哪一条不可让步？",
      JSON.stringify(["红线意识", "客舱岗位"]),
      new Date(Date.now() - 16 * hour).toISOString(),
      "加座、超售、轮椅旅客同时出现时，规则如何给温度留位置。",
      JSON.stringify(["特殊旅客", "公平"]),
      new Date(Date.now() - 22 * hour).toISOString(),
    ],
  );

  await query(
    `insert into forum_reply
      (reply_id,topic_id,author_id,author_name,author_role,content,created_at)
     values
      ('rp_show_1','tp_show_1','S2026001','林晓航','student',$1,$2),
      ('rp_show_2','tp_show_1','S2026015','周予安','student',$3,$4),
      ('rp_show_3','tp_show_2','S2026001','林晓航','student',$5,$6),
      ('rp_show_4','tp_show_3','S2026008','陈思远','student',$7,$8)
     on conflict (reply_id) do nothing`,
    [
      "可以软，但软在解释，不在指令。先回座，再给一杯水和一句共情。",
      new Date(Date.now() - 9 * hour).toISOString(),
      "我观察实训时，先软后硬容易被理解为「还可以再商量」。",
      new Date(Date.now() - 8.5 * hour).toISOString(),
      "再加一条：应急设备被占用，必须当场纠正。",
      new Date(Date.now() - 14 * hour).toISOString(),
      "公平不是平均，是按规章把保障给到真正需要的人，并让其他旅客看见依据。",
      new Date(Date.now() - 21 * hour).toISOString(),
    ],
  );

  await query(
    `insert into highlight
      (highlight_id,title,excerpt,tags,source_topic_id,pinned,refluxed,created_at)
     values
      ('hl_show_1','先指令、后温度',$1,$2::jsonb,'tp_show_1',true,false,$3),
      ('hl_show_2','红线三件套：设备 · 通道 · 安全带',$4,$5::jsonb,'tp_show_2',false,false,$6)
     on conflict (highlight_id) do nothing`,
    [
      "软在解释，不在指令。回座完成后再共情。",
      JSON.stringify(["安全指令", "课堂共识"]),
      new Date(Date.now() - 7 * hour).toISOString(),
      "岗位红线要能数出来、做出来、讲出来。",
      JSON.stringify(["红线意识"]),
      new Date(Date.now() - 13 * hour).toISOString(),
    ],
  );

  const quizMeta = JSON.stringify({
    quiz_last: {
      room_id: "room_show_quiz",
      score: 7,
      total: 10,
      wrong_count: 3,
      at: now,
    },
    qa_stats: { sessions: 4, rounds: 7 },
  });
  await query(
    `update student_profile
     set preference = coalesce(preference, '{}'::jsonb) || $2::jsonb,
         cognition_level = greatest(cognition_level, 3),
         updated_at = $3
     where student_id = $1`,
    ["S2026001", quizMeta, now],
  );
}

/** 已有库也保证账号有画像与分层任务（幂等） */
async function ensureAccountTasks() {
  const now = new Date().toISOString();
  const profiles = [
    {
      id: "S2026001",
      name: "林晓航",
      tag: "untyped",
      level: 2,
      weak: ["服务边界", "应急沟通"],
    },
    {
      id: "S2026008",
      name: "陈思远",
      tag: "untyped",
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
