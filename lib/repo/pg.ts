import { query } from "@/lib/db";
import type {
  ForumReply,
  ForumSource,
  ForumTopic,
  HighlightItem,
  QaEscalation,
  QuestionType,
  StudentProfile,
} from "@/types";
import type {
  LayeredTask,
  TaskStatus,
  VideoProject,
  WorkArchive,
} from "@/lib/content/taskTypes";
import type { StudentTypeTag } from "@/types";

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") {
    try {
      const j = JSON.parse(v) as unknown;
      return Array.isArray(j) ? j.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function chainRound(chain: Array<{ role: string }>) {
  return chain.filter((c) => c.role === "student").length;
}

/* ---------- students ---------- */

export async function pgListStudents(): Promise<StudentProfile[]> {
  const r = await query<{
    student_id: string;
    name: string;
    type_tag: StudentTypeTag;
    cognition_level: number;
    weak_points: unknown;
    updated_at: Date;
  }>("select * from student_profile order by student_id");
  return r.rows.map((row) => ({
    student_id: row.student_id,
    name: row.name,
    type_tag: row.type_tag,
    cognition_level: row.cognition_level,
    weak_points: asStringArray(row.weak_points),
    updated_at: new Date(row.updated_at).toISOString(),
  }));
}

/** 单学员真实活动计数（答疑 / 闯关问题 / 任务 / 作品） */
export type StudentActivity = {
  qa_sessions: number;
  qa_rounds: number;
  qa_escalated: number;
  open_issues: number;
  quiz_issues: number;
  escalation_issues: number;
  task_done: number;
  task_total: number;
  works_count: number;
  quiz_last: {
    room_id: string;
    score: number;
    total: number;
    wrong_count: number;
    at: string;
  } | null;
};

export async function pgStudentActivity(
  studentId: string,
): Promise<StudentActivity> {
  await ensureLearningIssueTable();

  const [qa, rounds, esc, issues, quizIssues, escIssues, tasks, works, pref] =
    await Promise.all([
      query<{ c: string }>(
        `select count(*)::text as c from qa_session where student_id=$1`,
        [studentId],
      ),
      query<{ c: string }>(
        `select coalesce(
           sum(jsonb_array_length(coalesce(followup_chain, '[]'::jsonb))),
           0
         )::text as c
         from qa_session where student_id=$1`,
        [studentId],
      ),
      query<{ c: string }>(
        `select count(*)::text as c from qa_session
         where student_id=$1 and status='escalated'`,
        [studentId],
      ),
      query<{ c: string }>(
        `select count(*)::text as c from learning_issue
         where student_id=$1 and status='open'`,
        [studentId],
      ),
      query<{ c: string }>(
        `select count(*)::text as c from learning_issue
         where student_id=$1 and source='quiz'`,
        [studentId],
      ),
      query<{ c: string }>(
        `select count(*)::text as c from learning_issue
         where student_id=$1 and source='escalation'`,
        [studentId],
      ),
      query<{ done: string; total: string }>(
        `select
           count(*) filter (where status='done')::text as done,
           count(*)::text as total
         from layered_task where student_id=$1`,
        [studentId],
      ),
      query<{ c: string }>(
        `select count(*)::text as c from work where student_id=$1`,
        [studentId],
      ),
      query<{ preference: unknown }>(
        `select preference from student_profile where student_id=$1`,
        [studentId],
      ),
    ]);

  const preference =
    pref.rows[0]?.preference && typeof pref.rows[0].preference === "object"
      ? (pref.rows[0].preference as Record<string, unknown>)
      : {};
  const quizLast =
    preference.quiz_last && typeof preference.quiz_last === "object"
      ? (preference.quiz_last as StudentActivity["quiz_last"])
      : null;

  return {
    qa_sessions: Number(qa.rows[0]?.c ?? 0),
    qa_rounds: Number(rounds.rows[0]?.c ?? 0),
    qa_escalated: Number(esc.rows[0]?.c ?? 0),
    open_issues: Number(issues.rows[0]?.c ?? 0),
    quiz_issues: Number(quizIssues.rows[0]?.c ?? 0),
    escalation_issues: Number(escIssues.rows[0]?.c ?? 0),
    task_done: Number(tasks.rows[0]?.done ?? 0),
    task_total: Number(tasks.rows[0]?.total ?? 0),
    works_count: Number(works.rows[0]?.c ?? 0),
    quiz_last: quizLast,
  };
}

/** 由真实活动推导雷达 0–100 */
export function buildActivityRadarAxes(input: {
  type_tag: string;
  cognition_level: number;
  weak_points: string[];
  activity: StudentActivity;
}) {
  const clamp = (n: number) => Math.max(12, Math.min(98, Math.round(n)));
  const tag = input.type_tag;
  const a = input.activity;
  const typeBoost = (t: string) => (tag === t ? 14 : 0);

  return [
    {
      key: "expression",
      label: "表达",
      value: clamp(
        28 + a.qa_sessions * 10 + a.qa_rounds * 3 + typeBoost("expression"),
      ),
    },
    {
      key: "creation",
      label: "创作",
      value: clamp(26 + a.works_count * 22 + typeBoost("creation")),
    },
    {
      key: "experience",
      label: "体验",
      value: clamp(
        26 +
          a.quiz_issues * 10 +
          (a.quiz_last ? 12 : 0) +
          typeBoost("experience"),
      ),
    },
    {
      key: "cognition",
      label: "认知",
      value: clamp(input.cognition_level * 16 + 18),
    },
    {
      key: "practice",
      label: "实践",
      value: clamp(
        30 +
          a.task_done * 14 +
          (a.task_total > 0
            ? (a.task_done / a.task_total) * 20
            : 0),
      ),
    },
    {
      key: "focus",
      label: "短板补强",
      value: clamp(
        88 - a.open_issues * 10 - input.weak_points.length * 6,
      ),
    },
  ];
}

export async function pgFindStudent(studentId: string) {
  const list = await pgListStudents();
  const base = list.find((s) => s.student_id === studentId) ?? null;
  if (!base) return null;
  const [issues, activity] = await Promise.all([
    pgListLearningIssues(studentId, "open"),
    pgStudentActivity(studentId),
  ]);
  return {
    ...base,
    open_issues: issues,
    open_issue_count: issues.length,
    activity,
    radar_axes: buildActivityRadarAxes({
      type_tag: base.type_tag,
      cognition_level: base.cognition_level,
      weak_points: base.weak_points,
      activity,
    }),
  };
}

/** 答疑开场 / 追问后累加 preference.qa_stats */
export async function pgTouchQaStats(
  studentId: string,
  patch: { sessions?: number; rounds?: number },
) {
  await ensureStudentProfileRow(studentId);
  const now = new Date().toISOString();
  const cur = await query<{ preference: unknown }>(
    `select preference from student_profile where student_id=$1`,
    [studentId],
  );
  const pref =
    cur.rows[0]?.preference && typeof cur.rows[0].preference === "object"
      ? ({ ...(cur.rows[0].preference as object) } as Record<string, unknown>)
      : {};
  const stats =
    pref.qa_stats && typeof pref.qa_stats === "object"
      ? ({ ...(pref.qa_stats as object) } as Record<string, number>)
      : { sessions: 0, rounds: 0 };
  stats.sessions = Number(stats.sessions ?? 0) + (patch.sessions ?? 0);
  stats.rounds = Number(stats.rounds ?? 0) + (patch.rounds ?? 0);
  pref.qa_stats = stats;
  pref.qa_stats_at = now;
  await query(
    `update student_profile set preference=$2::jsonb, updated_at=$3 where student_id=$1`,
    [studentId, JSON.stringify(pref), now],
  );
}

export type LearningIssue = {
  issue_id: string;
  student_id: string;
  source: string;
  title: string;
  detail: string;
  weak_tag: string | null;
  status: string;
  created_at: string;
};

export async function pgListLearningIssues(
  studentId?: string,
  status: "open" | "done" | "all" = "open",
): Promise<LearningIssue[]> {
  await ensureLearningIssueTable();
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (studentId) {
    params.push(studentId);
    clauses.push(`student_id = $${params.length}`);
  }
  if (status !== "all") {
    params.push(status);
    clauses.push(`status = $${params.length}`);
  }
  const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
  const r = await query<{
    issue_id: string;
    student_id: string;
    source: string;
    title: string;
    detail: string;
    weak_tag: string | null;
    status: string;
    created_at: Date;
  }>(
    `select issue_id, student_id, source, title, detail, weak_tag, status, created_at
     from learning_issue ${where}
     order by created_at desc
     limit 80`,
    params,
  );
  return r.rows.map((row) => ({
    issue_id: row.issue_id,
    student_id: row.student_id,
    source: row.source,
    title: row.title,
    detail: row.detail,
    weak_tag: row.weak_tag,
    status: row.status,
    created_at: new Date(row.created_at).toISOString(),
  }));
}

/** 从题干抽薄弱标签，便于画像聚合 */
export function weakTagFromStem(stem: string, fallback = "课中闯关"): string {
  if (/人民至上|生命|安全底线/.test(stem)) return "人民至上落地";
  if (/服务边界|规章|裁量/.test(stem)) return "服务边界";
  if (/应急|颠簸|救助|沟通/.test(stem)) return "应急沟通";
  if (/价值|伦理|权衡/.test(stem)) return "价值权衡";
  if (/客舱|秩序|旅客/.test(stem)) return "客舱秩序";
  if (/职业/.test(stem)) return "职业伦理";
  const short = stem.replace(/\s+/g, "").replace(/[（(].*$/, "").slice(0, 14);
  return short || fallback;
}

/** 确保问题清单表存在（远程库可能仍是旧 schema） */
async function ensureLearningIssueTable() {
  await query(`
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
    CREATE INDEX IF NOT EXISTS idx_learning_issue_student
      ON learning_issue (student_id, status);
    CREATE INDEX IF NOT EXISTS idx_learning_issue_open
      ON learning_issue (status, created_at DESC);
  `);
}

async function ensureStudentProfileRow(studentId: string) {
  let student = await pgFindStudentBase(studentId);
  if (student) return student;
  const now = new Date().toISOString();
  await query(
    `insert into student_profile
      (student_id, name, type_tag, cognition_level, weak_points, updated_at)
     values ($1,$2,'expression',1,'[]'::jsonb,$3)
     on conflict (student_id) do nothing`,
    [studentId, studentId, now],
  );
  student = await pgFindStudentBase(studentId);
  return student;
}

/**
 * 课中闯关结果回写画像：更新薄弱点 / 认知等级，并写入问题清单。
 */
export async function pgApplyQuizResult(input: {
  student_id: string;
  room_id: string;
  score: number;
  total: number;
  wrong: Array<{ id: string; stem: string }>;
}) {
  await ensureLearningIssueTable();

  const student = await ensureStudentProfileRow(input.student_id);
  if (!student) {
    return { ok: false as const, reason: "no_profile" as const };
  }

  const newTags = input.wrong.map((w) => weakTagFromStem(w.stem));
  const merged = Array.from(
    new Set([...student.weak_points, ...newTags]),
  ).slice(0, 10);

  const ratio = input.total > 0 ? input.score / input.total : 0;
  let cognition = student.cognition_level;
  if (ratio >= 0.8) cognition = Math.min(5, cognition + 1);
  // 错题主要靠薄弱点 / 问题清单体现；全对再抬认知等级

  const now = new Date().toISOString();
  const quizMeta = {
    quiz_last: {
      room_id: input.room_id,
      score: input.score,
      total: input.total,
      wrong_count: input.wrong.length,
      at: now,
    },
  };
  await query(
    `update student_profile
     set weak_points = $2::jsonb,
         cognition_level = $3,
         preference = coalesce(preference, '{}'::jsonb) || $4::jsonb,
         updated_at = $5
     where student_id = $1`,
    [
      input.student_id,
      JSON.stringify(merged),
      cognition,
      JSON.stringify(quizMeta),
      now,
    ],
  );

  const createdIssues: LearningIssue[] = [];
  for (const w of input.wrong) {
    const tag = weakTagFromStem(w.stem);
    // 同场同题不重复堆清单：先关掉旧 open 记录
    await query(
      `update learning_issue
       set status = 'done', updated_at = $4
       where student_id = $1
         and status = 'open'
         and source = 'quiz'
         and meta->>'room_id' = $2
         and meta->>'question_id' = $3`,
      [input.student_id, input.room_id, w.id, now],
    );
    const issueId = `liq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    await query(
      `insert into learning_issue
        (issue_id, student_id, source, title, detail, weak_tag, status, meta, created_at, updated_at)
       values ($1,$2,'quiz',$3,$4,$5,'open',$6::jsonb,$7,$7)`,
      [
        issueId,
        input.student_id,
        `闯关错题 · ${tag}`,
        w.stem,
        tag,
        JSON.stringify({
          question_id: w.id,
          room_id: input.room_id,
          score: input.score,
          total: input.total,
        }),
        now,
      ],
    );
    createdIssues.push({
      issue_id: issueId,
      student_id: input.student_id,
      source: "quiz",
      title: `闯关错题 · ${tag}`,
      detail: w.stem,
      weak_tag: tag,
      status: "open",
      created_at: now,
    });
  }

  return {
    ok: true as const,
    weak_points: merged,
    cognition_level: cognition,
    new_tags: Array.from(new Set(newTags)),
    issues: createdIssues,
  };
}

async function pgFindStudentBase(studentId: string) {
  const list = await pgListStudents();
  return list.find((s) => s.student_id === studentId) ?? null;
}

/* ---------- qa ---------- */

export type PgSession = {
  session_id: string;
  student_id: string;
  q_type: QuestionType;
  question: string;
  round: number;
  followup_chain: Array<{ role: "ai" | "student"; content: string }>;
  status: "open" | "resolved" | "escalated";
  coze_conversation_id?: string | null;
};

export async function pgCreateSession(input: {
  student_id: string;
  question: string;
  q_type: QuestionType;
  firstPrompt: string;
  coze_conversation_id?: string | null;
}): Promise<PgSession> {
  const sessionId = `qs_${Date.now()}`;
  const chain = [{ role: "ai" as const, content: input.firstPrompt }];
  await query(
    `insert into qa_session
      (session_id, student_id, q_type, question, followup_chain, status, coze_conversation_id)
     values ($1,$2,$3,$4,$5::jsonb,'open',$6)`,
    [
      sessionId,
      input.student_id,
      input.q_type,
      input.question,
      JSON.stringify(chain),
      input.coze_conversation_id ?? null,
    ],
  );
  try {
    await pgTouchQaStats(input.student_id, { sessions: 1 });
  } catch (e) {
    console.error("[qa] touch stats failed", e);
  }
  return {
    session_id: sessionId,
    student_id: input.student_id,
    q_type: input.q_type,
    question: input.question,
    round: 0,
    followup_chain: chain,
    status: "open",
    coze_conversation_id: input.coze_conversation_id ?? null,
  };
}

export async function pgGetSession(sessionId: string): Promise<PgSession | null> {
  const r = await query<{
    session_id: string;
    student_id: string;
    q_type: QuestionType;
    question: string | null;
    followup_chain: unknown;
    status: PgSession["status"];
    coze_conversation_id: string | null;
  }>("select * from qa_session where session_id=$1", [sessionId]);
  const row = r.rows[0];
  if (!row) return null;
  const chain = (
    Array.isArray(row.followup_chain)
      ? row.followup_chain
      : typeof row.followup_chain === "string"
        ? JSON.parse(row.followup_chain)
        : []
  ) as PgSession["followup_chain"];
  return {
    session_id: row.session_id,
    student_id: row.student_id,
    q_type: row.q_type,
    question: row.question ?? "",
    round: chainRound(chain),
    followup_chain: chain,
    status: row.status,
    coze_conversation_id: row.coze_conversation_id ?? null,
  };
}

export async function pgSetCozeConversationId(
  sessionId: string,
  conversationId: string,
) {
  await query(
    `update qa_session
     set coze_conversation_id=$2, updated_at=now()
     where session_id=$1`,
    [sessionId, conversationId],
  );
}

export async function pgAppendFollowup(
  sessionId: string,
  studentAnswer: string,
  aiPrompt: string,
  escalate: boolean,
) {
  const session = await pgGetSession(sessionId);
  if (!session) return null;
  session.followup_chain.push(
    { role: "student", content: studentAnswer },
    { role: "ai", content: aiPrompt },
  );
  session.round = chainRound(session.followup_chain);
  if (escalate) session.status = "escalated";
  await query(
    `update qa_session
     set followup_chain=$2::jsonb, status=$3, updated_at=now()
     where session_id=$1`,
    [sessionId, JSON.stringify(session.followup_chain), session.status],
  );
  try {
    await pgTouchQaStats(session.student_id, { rounds: 1 });
  } catch (e) {
    console.error("[qa] touch rounds failed", e);
  }
  return session;
}

export async function pgCreateEscalation(input: {
  session_id: string;
  student_id: string;
  summary: string;
}): Promise<QaEscalation> {
  const escalationId = `esc_${Date.now()}`;
  const createdAt = new Date().toISOString();
  await query(
    `insert into qa_escalation
      (escalation_id, session_id, student_id, summary, teacher_status, created_at)
     values ($1,$2,$3,$4,'pending',$5)`,
    [
      escalationId,
      input.session_id,
      input.student_id,
      input.summary,
      createdAt,
    ],
  );
  await query(
    `update qa_session set status='escalated', updated_at=now() where session_id=$1`,
    [input.session_id],
  );

  // 同步进学情问题清单，便于「我的学情 / 学情看板」一眼看到
  try {
    await ensureLearningIssueTable();
    const tag = weakTagFromStem(input.summary, "疑难转接");
    await query(
      `insert into learning_issue
        (issue_id, student_id, source, title, detail, weak_tag, status, meta, created_at, updated_at)
       values ($1,$2,'escalation',$3,$4,$5,'open',$6::jsonb,$7,$7)`,
      [
        `liq_esc_${escalationId}`,
        input.student_id,
        `答疑转接 · ${tag}`,
        input.summary,
        tag,
        JSON.stringify({
          escalation_id: escalationId,
          session_id: input.session_id,
        }),
        createdAt,
      ],
    );
    const base = await pgFindStudentBase(input.student_id);
    if (base) {
      const merged = Array.from(
        new Set([...base.weak_points, tag]),
      ).slice(0, 10);
      await query(
        `update student_profile
         set weak_points = $2::jsonb, updated_at = $3
         where student_id = $1`,
        [input.student_id, JSON.stringify(merged), createdAt],
      );
    }
  } catch (e) {
    console.error("[escalation] learning_issue writeback failed", e);
  }

  return {
    escalation_id: escalationId,
    session_id: input.session_id,
    student_id: input.student_id,
    summary: input.summary,
    created_at: createdAt,
    teacher_status: "pending",
  };
}

export async function pgListEscalations() {
  const r = await query<{
    escalation_id: string;
    session_id: string;
    student_id: string;
    summary: string;
    teacher_status: QaEscalation["teacher_status"];
    created_at: Date;
  }>("select * from qa_escalation order by created_at desc");
  return r.rows.map((row) => ({
    escalation_id: row.escalation_id,
    session_id: row.session_id,
    student_id: row.student_id,
    summary: row.summary,
    teacher_status: row.teacher_status,
    created_at: new Date(row.created_at).toISOString(),
  }));
}

export async function pgUpdateEscalationStatus(
  escalationId: string,
  status: QaEscalation["teacher_status"],
) {
  const r = await query(
    `update qa_escalation set teacher_status=$2, updated_at=now()
     where escalation_id=$1
     returning escalation_id, session_id, student_id, summary, teacher_status, created_at`,
    [escalationId, status],
  );
  const row = r.rows[0] as
    | {
        escalation_id: string;
        session_id: string;
        student_id: string;
        summary: string;
        teacher_status: QaEscalation["teacher_status"];
        created_at: Date;
      }
    | undefined;
  if (!row) return null;
  return {
    escalation_id: row.escalation_id,
    session_id: row.session_id,
    student_id: row.student_id,
    summary: row.summary,
    teacher_status: row.teacher_status,
    created_at: new Date(row.created_at).toISOString(),
  };
}

export async function pgWorkbenchStats() {
  const [esc, sess, students] = await Promise.all([
    query<{ c: string }>(
      `select count(*)::text as c from qa_escalation where teacher_status='pending'`,
    ),
    query<{ c: string }>(
      `select count(*)::text as c from qa_session where status='open'`,
    ),
    pgListStudents(),
  ]);
  return {
    pending_escalations: Number(esc.rows[0]?.c ?? 0),
    open_sessions: Number(sess.rows[0]?.c ?? 0),
    students: students.length,
    type_dist: {
      expression: students.filter((s) => s.type_tag === "expression").length,
      creation: students.filter((s) => s.type_tag === "creation").length,
      experience: students.filter((s) => s.type_tag === "experience").length,
    },
  };
}

/* ---------- community ---------- */

export async function pgListTopics(): Promise<ForumTopic[]> {
  const r = await query(
    `select * from forum_topic order by pinned desc, hot desc, created_at desc`,
  );
  return r.rows.map(mapTopic);
}

export async function pgGetTopic(topicId: string) {
  const r = await query(`select * from forum_topic where topic_id=$1`, [
    topicId,
  ]);
  return r.rows[0] ? mapTopic(r.rows[0]) : null;
}

function mapTopic(row: Record<string, unknown>): ForumTopic {
  return {
    topic_id: String(row.topic_id),
    title: String(row.title),
    body: String(row.body),
    source: row.source as ForumSource,
    source_ref: row.source_ref ? String(row.source_ref) : undefined,
    tags: asStringArray(row.tags),
    author_id: String(row.author_id),
    author_name: String(row.author_name),
    author_role: row.author_role as ForumTopic["author_role"],
    reply_count: Number(row.reply_count ?? 0),
    hot: Number(row.hot ?? 0),
    pinned: Boolean(row.pinned),
    created_at: new Date(row.created_at as Date).toISOString(),
  };
}

export async function pgListReplies(topicId: string): Promise<ForumReply[]> {
  const r = await query(
    `select * from forum_reply where topic_id=$1 order by created_at asc`,
    [topicId],
  );
  return r.rows.map((row) => ({
    reply_id: String(row.reply_id),
    topic_id: String(row.topic_id),
    author_id: String(row.author_id),
    author_name: String(row.author_name),
    author_role: row.author_role as ForumReply["author_role"],
    content: String(row.content),
    created_at: new Date(row.created_at as Date).toISOString(),
  }));
}

export async function pgCreateTopic(input: {
  title: string;
  body: string;
  tags?: string[];
  source?: ForumSource;
  author_id?: string;
  author_name?: string;
  author_role?: ForumTopic["author_role"];
}) {
  const topicId = `tp_${Date.now()}`;
  const createdAt = new Date().toISOString();
  const topic: ForumTopic = {
    topic_id: topicId,
    title: input.title.trim(),
    body: input.body.trim(),
    source: input.source ?? "manual",
    tags: input.tags?.length ? input.tags : ["师生共创"],
    author_id: input.author_id ?? "anonymous",
    author_name: input.author_name ?? "匿名",
    author_role: input.author_role ?? "student",
    reply_count: 0,
    hot: 12,
    pinned: false,
    created_at: createdAt,
  };
  await query(
    `insert into forum_topic
      (topic_id,title,body,source,tags,author_id,author_name,author_role,reply_count,hot,pinned,created_at)
     values ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,0,12,false,$9)`,
    [
      topic.topic_id,
      topic.title,
      topic.body,
      topic.source,
      JSON.stringify(topic.tags),
      topic.author_id,
      topic.author_name,
      topic.author_role,
      createdAt,
    ],
  );
  return topic;
}

export async function pgAddReply(input: {
  topic_id: string;
  content: string;
  author_id?: string;
  author_name?: string;
  author_role?: ForumReply["author_role"];
}) {
  const topic = await pgGetTopic(input.topic_id);
  if (!topic) return null;
  const replyId = `rp_${Date.now()}`;
  const createdAt = new Date().toISOString();
  const reply: ForumReply = {
    reply_id: replyId,
    topic_id: input.topic_id,
    author_id: input.author_id ?? "anonymous",
    author_name: input.author_name ?? "匿名",
    author_role: input.author_role ?? "student",
    content: input.content.trim(),
    created_at: createdAt,
  };
  await query(
    `insert into forum_reply
      (reply_id,topic_id,author_id,author_name,author_role,content,created_at)
     values ($1,$2,$3,$4,$5,$6,$7)`,
    [
      reply.reply_id,
      reply.topic_id,
      reply.author_id,
      reply.author_name,
      reply.author_role,
      reply.content,
      createdAt,
    ],
  );
  await query(
    `update forum_topic set reply_count=reply_count+1, hot=hot+3, updated_at=now()
     where topic_id=$1`,
    [input.topic_id],
  );
  return reply;
}

export async function pgListHighlights(): Promise<HighlightItem[]> {
  const r = await query(
    `select * from highlight order by pinned desc, created_at desc`,
  );
  return r.rows.map((row) => ({
    highlight_id: String(row.highlight_id),
    title: String(row.title),
    excerpt: String(row.excerpt),
    tags: asStringArray(row.tags),
    source_topic_id: row.source_topic_id
      ? String(row.source_topic_id)
      : undefined,
    pinned: Boolean(row.pinned),
    refluxed: Boolean(row.refluxed),
    created_at: new Date(row.created_at as Date).toISOString(),
  }));
}

export async function pgPinHighlight(highlightId: string, pinned = true) {
  const r = await query(
    `update highlight set pinned=$2, updated_at=now() where highlight_id=$1
     returning *`,
    [highlightId, pinned],
  );
  const row = r.rows[0];
  if (!row) return null;
  return (await pgListHighlights()).find((h) => h.highlight_id === highlightId) ?? null;
}

export async function pgRefluxHighlight(highlightId: string) {
  const r = await query(
    `update highlight set refluxed=true, pinned=true, updated_at=now()
     where highlight_id=$1 returning *`,
    [highlightId],
  );
  const row = r.rows[0];
  if (!row) return null;
  const highlight = (await pgListHighlights()).find(
    (h) => h.highlight_id === highlightId,
  )!;
  return {
    highlight,
    kb_note: `已写入答疑知识库索引：${highlight.title}`,
  };
}

export async function pgPromoteTopicToHighlight(topicId: string) {
  const existing = (await pgListHighlights()).find(
    (h) => h.source_topic_id === topicId,
  );
  if (existing) return existing;
  const topic = await pgGetTopic(topicId);
  if (!topic) return null;
  const highlightId = `hl_${Date.now()}`;
  const createdAt = new Date().toISOString();
  const item: HighlightItem = {
    highlight_id: highlightId,
    title: topic.title.slice(0, 40),
    excerpt: topic.body.slice(0, 120),
    tags: topic.tags.slice(0, 3),
    source_topic_id: topic.topic_id,
    pinned: false,
    refluxed: false,
    created_at: createdAt,
  };
  await query(
    `insert into highlight
      (highlight_id,title,excerpt,tags,source_topic_id,pinned,refluxed,created_at)
     values ($1,$2,$3,$4::jsonb,$5,false,false,$6)`,
    [
      item.highlight_id,
      item.title,
      item.excerpt,
      JSON.stringify(item.tags),
      item.source_topic_id,
      createdAt,
    ],
  );
  return item;
}

/* ---------- tasks / video / works ---------- */

const TASK_TEMPLATES: Record<
  StudentTypeTag,
  { title: string; type: LayeredTask["type"]; brief: string }
> = {
  expression: {
    title: "街头采访：人民至上在服务现场",
    type: "interview",
    brief:
      "采访 3 位同学或路人，问「遇到规则与人情冲突时你会怎么选」，整理 1 分钟口述稿。",
  },
  creation: {
    title: "AI短视频：客舱里的价值抉择",
    type: "short_video",
    brief:
      "用短视频工坊完成脚本→分镜→字幕→成片归档，突出一个思政价值点。",
  },
  experience: {
    title: "行走的思政课：校园/航站楼观察",
    type: "field_trip",
    brief:
      "观察一处真实服务场景，记录「安全—秩序—温度」三要素，提交观察笔记。",
  },
};

function mapTask(row: Record<string, unknown>): LayeredTask {
  return {
    task_id: String(row.task_id),
    student_id: String(row.student_id),
    type_tag: row.type_tag as StudentTypeTag,
    title: String(row.title),
    type: row.type as LayeredTask["type"],
    brief: String(row.brief),
    status: row.status as TaskStatus,
    progress: Number(row.progress ?? 0),
    assigned_at: new Date(row.assigned_at as Date).toISOString(),
    updated_at: new Date(row.updated_at as Date).toISOString(),
  };
}

export async function pgListTasks(studentId?: string) {
  const r = studentId
    ? await query(
        `select * from layered_task where student_id=$1 order by assigned_at desc`,
        [studentId],
      )
    : await query(`select * from layered_task order by assigned_at desc`);
  return r.rows.map((row) => mapTask(row as Record<string, unknown>));
}

export async function pgAssignTask(
  studentId: string,
  typeTag?: StudentTypeTag,
) {
  const profile = await pgFindStudent(studentId);
  const tag = typeTag || profile?.type_tag || "creation";
  const tpl = TASK_TEMPLATES[tag];
  const now = new Date().toISOString();
  const task: LayeredTask = {
    task_id: `task_${Date.now()}`,
    student_id: studentId,
    type_tag: tag,
    ...tpl,
    status: "todo",
    progress: 0,
    assigned_at: now,
    updated_at: now,
  };
  await query(
    `insert into layered_task
      (task_id,student_id,type_tag,title,type,brief,status,progress,assigned_at,updated_at)
     values ($1,$2,$3,$4,$5,$6,'todo',0,$7,$7)`,
    [
      task.task_id,
      task.student_id,
      task.type_tag,
      task.title,
      task.type,
      task.brief,
      now,
    ],
  );
  return task;
}

export async function pgUpdateTask(
  taskId: string,
  patch: Partial<Pick<LayeredTask, "status" | "progress">>,
) {
  const r = await query(`select * from layered_task where task_id=$1`, [taskId]);
  if (!r.rows[0]) return null;
  const task = mapTask(r.rows[0] as Record<string, unknown>);
  if (patch.status) task.status = patch.status;
  if (typeof patch.progress === "number") {
    task.progress = Math.max(0, Math.min(100, patch.progress));
  }
  if (task.progress >= 100) task.status = "done";
  else if (task.progress > 0 && task.status === "todo") task.status = "doing";
  task.updated_at = new Date().toISOString();
  await query(
    `update layered_task set status=$2, progress=$3, updated_at=$4 where task_id=$1`,
    [taskId, task.status, task.progress, task.updated_at],
  );
  return task;
}

export async function pgGetOrCreateVideo(studentId: string): Promise<VideoProject> {
  const r = await query(`select * from video_project where student_id=$1`, [
    studentId,
  ]);
  if (r.rows[0]) {
    const row = r.rows[0];
    return {
      project_id: String(row.project_id),
      student_id: String(row.student_id),
      theme: String(row.theme ?? ""),
      value_point: String(row.value_point ?? ""),
      script: row.script ? String(row.script) : undefined,
      storyboard: row.storyboard ? String(row.storyboard) : undefined,
      subtitle_note: row.subtitle_note ? String(row.subtitle_note) : undefined,
      file_uri: row.file_uri ? String(row.file_uri) : undefined,
      step: Number(row.step ?? 1) as 1 | 2 | 3 | 4,
      updated_at: new Date(row.updated_at as Date).toISOString(),
    };
  }
  const project: VideoProject = {
    project_id: `vp_${Date.now()}`,
    student_id: studentId,
    theme: "",
    value_point: "",
    step: 1,
    updated_at: new Date().toISOString(),
  };
  await query(
    `insert into video_project (project_id,student_id,theme,value_point,step,updated_at)
     values ($1,$2,'','',1,$3)`,
    [project.project_id, studentId, project.updated_at],
  );
  return project;
}

export async function pgSaveVideoStep(
  studentId: string,
  input: {
    theme?: string;
    value_point?: string;
    script?: string;
    storyboard?: string;
    subtitle_note?: string;
    file_uri?: string;
    step?: 1 | 2 | 3 | 4;
  },
) {
  const project = await pgGetOrCreateVideo(studentId);
  if (input.theme != null) project.theme = input.theme;
  if (input.value_point != null) project.value_point = input.value_point;
  if (input.script != null) project.script = input.script;
  if (input.storyboard != null) project.storyboard = input.storyboard;
  if (input.subtitle_note != null) project.subtitle_note = input.subtitle_note;
  if (input.file_uri != null) project.file_uri = input.file_uri;
  if (input.step) project.step = input.step;
  project.updated_at = new Date().toISOString();
  await query(
    `update video_project set
      theme=$2, value_point=$3, script=$4, storyboard=$5,
      subtitle_note=$6, file_uri=$7, step=$8, updated_at=$9
     where student_id=$1`,
    [
      studentId,
      project.theme,
      project.value_point,
      project.script ?? null,
      project.storyboard ?? null,
      project.subtitle_note ?? null,
      project.file_uri ?? null,
      project.step,
      project.updated_at,
    ],
  );
  return project;
}

export async function pgArchiveWork(input: {
  student_id: string;
  type: string;
  title: string;
  file_uri: string;
}): Promise<WorkArchive> {
  const work: WorkArchive = {
    work_id: `work_${Date.now()}`,
    student_id: input.student_id,
    type: input.type,
    title: input.title,
    file_uri: input.file_uri,
    award_level: null,
    created_at: new Date().toISOString(),
  };
  await query(
    `insert into work (work_id,student_id,type,file_uri,award_level,meta,created_at)
     values ($1,$2,$3,$4,null,$5::jsonb,$6)`,
    [
      work.work_id,
      work.student_id,
      work.type,
      work.file_uri,
      JSON.stringify({ title: work.title }),
      work.created_at,
    ],
  );
  return work;
}

export async function pgListWorks(studentId?: string): Promise<WorkArchive[]> {
  const r = studentId
    ? await query(`select * from work where student_id=$1 order by created_at desc`, [
        studentId,
      ])
    : await query(`select * from work order by created_at desc`);
  return r.rows.map((row) => {
    const meta =
      typeof row.meta === "object" && row.meta
        ? (row.meta as { title?: string })
        : {};
    return {
      work_id: String(row.work_id),
      student_id: String(row.student_id),
      type: String(row.type),
      title: meta.title ?? String(row.type),
      file_uri: String(row.file_uri),
      award_level: row.award_level ? String(row.award_level) : null,
      created_at: new Date(row.created_at as Date).toISOString(),
    };
  });
}

async function pgWeekWindowStats() {
  await ensureLearningIssueTable();
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const [qa, esc, issues, quizIssues] = await Promise.all([
    query<{ c: string }>(
      `select count(*)::text as c from qa_session where created_at >= $1::timestamptz`,
      [since],
    ),
    query<{ c: string }>(
      `select count(*)::text as c from qa_escalation where created_at >= $1::timestamptz`,
      [since],
    ),
    query<{ c: string }>(
      `select count(*)::text as c from learning_issue where created_at >= $1::timestamptz`,
      [since],
    ),
    query<{ c: string }>(
      `select count(*)::text as c from learning_issue
       where source='quiz' and created_at >= $1::timestamptz`,
      [since],
    ),
  ]);
  return {
    since,
    qa_sessions_7d: Number(qa.rows[0]?.c ?? 0),
    escalations_7d: Number(esc.rows[0]?.c ?? 0),
    learning_issues_7d: Number(issues.rows[0]?.c ?? 0),
    quiz_issues_7d: Number(quizIssues.rows[0]?.c ?? 0),
  };
}

export async function pgAnalyticsBundle() {
  const students = await pgListStudents();
  const tasks = await pgListTasks();
  const works = await pgListWorks();
  const wb = await pgWorkbenchStats();
  const openIssues = await pgListLearningIssues(undefined, "open");
  const week = await pgWeekWindowStats();

  const weakMap = new Map<string, number>();
  // 薄弱点优先用问题清单标签（真实回流），再合并画像字段
  openIssues.forEach((i) => {
    if (i.weak_tag) weakMap.set(i.weak_tag, (weakMap.get(i.weak_tag) ?? 0) + 1);
  });
  students.forEach((s) => {
    s.weak_points.forEach((w) => {
      if (!weakMap.has(w)) weakMap.set(w, 1);
    });
  });

  const issueByStudent = new Map<string, number>();
  openIssues.forEach((i) => {
    issueByStudent.set(
      i.student_id,
      (issueByStudent.get(i.student_id) ?? 0) + 1,
    );
  });

  const nameById = new Map(students.map((s) => [s.student_id, s.name]));

  const taskStatus = {
    todo: tasks.filter((t) => t.status === "todo").length,
    doing: tasks.filter((t) => t.status === "doing").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  const completionRate =
    tasks.length === 0
      ? 0
      : Math.round((taskStatus.done / tasks.length) * 100);

  const recent_issues = openIssues.slice(0, 8).map((i) => ({
    ...i,
    student_name: nameById.get(i.student_id) ?? i.student_id,
  }));

  return {
    data_source: "postgres_live" as const,
    pending_escalations: wb.pending_escalations,
    open_sessions: wb.open_sessions,
    open_learning_issues: openIssues.length,
    recent_issues,
    week,
    student_count: wb.students,
    type_dist: wb.type_dist,
    task_status: taskStatus,
    task_completion_rate: completionRate,
    works_count: works.length,
    weak_points: Array.from(weakMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    student_rows: students.map((s) => ({
      student_id: s.student_id,
      name: s.name,
      type_tag: s.type_tag,
      cognition_level: s.cognition_level,
      weak_points: s.weak_points,
      open_issues: issueByStudent.get(s.student_id) ?? 0,
      task_done: tasks.filter(
        (t) => t.student_id === s.student_id && t.status === "done",
      ).length,
    })),
  };
}

export async function pgWeeklyReportDraft() {
  const a = await pgAnalyticsBundle();
  const topWeak = a.weak_points[0]?.name ?? "（暂无回流薄弱点）";
  const issueLines =
    a.recent_issues.length === 0
      ? "暂无待办问题清单。"
      : a.recent_issues
          .slice(0, 5)
          .map(
            (i) =>
              `· ${i.student_name}｜${i.title}${i.weak_tag ? `（${i.weak_tag}）` : ""}`,
          )
          .join("\n");

  const sinceLabel = new Date(a.week.since).toLocaleDateString("zh-CN");
  return {
    week_label: "本周学情周报（实时汇总）",
    generated_at: new Date().toISOString(),
    summary: [
      `统计窗口：${sinceLabel} 起近 7 日（实时库）。`,
      `学员画像 ${a.student_count} 人；近 7 日新开答疑 ${a.week.qa_sessions_7d} 场、转接 ${a.week.escalations_7d} 条；当前进行中答疑 ${a.open_sessions} 场、待转接 ${a.pending_escalations} 条。`,
      `问题清单待办 ${a.open_learning_issues} 条（近 7 日新增 ${a.week.learning_issues_7d}，其中闯关回流 ${a.week.quiz_issues_7d}）；高频薄弱「${topWeak}」。`,
      `分层任务完成率 ${a.task_completion_rate}%（待办 ${a.task_status.todo} / 进行中 ${a.task_status.doing} / 已完成 ${a.task_status.done}）；作品归档 ${a.works_count} 件。`,
      "",
      "待办问题节选：",
      issueLines,
    ].join("\n"),
    suggestions: [
      topWeak.includes("暂无")
        ? "本周问题清单较空：可安排一次课中闯关，故意保留错题以沉淀薄弱点。"
        : `下节课用「课中五式·闯关」针对「${topWeak}」做 5 分钟巩固。`,
      a.week.escalations_7d > 0
        ? "对近 7 日答疑转接条目安排一次 15 分钟专题答疑。"
        : "引导学员在学伴中多轮追问，形成可转接的疑难样本。",
      "创作型学员推进短视频工坊至成片归档，形成可展示成果。",
    ],
    status: "draft" as const,
  };
}

/* ---------- cabin cases ---------- */

export type CabinCaseRow = {
  case_id: string;
  title: string;
  category: string;
  scenario: string;
  roles: string[];
  focus: string;
  difficulty: number;
  emergency_level: number;
  solution: string | null;
  source: "real" | "simulation";
  meta: Record<string, unknown>;
};

function mapCabinCase(row: Record<string, unknown>): CabinCaseRow {
  const meta =
    typeof row.meta === "object" && row.meta
      ? (row.meta as Record<string, unknown>)
      : {};
  return {
    case_id: String(row.case_id),
    title: String(row.title || row.case_id),
    category: String(row.category || ""),
    scenario: String(row.scenario),
    roles: asStringArray(row.roles),
    focus: String(row.focus || ""),
    difficulty: Number(row.difficulty ?? 1),
    emergency_level: Number(row.emergency_level ?? 1),
    solution: row.solution ? String(row.solution) : null,
    source: row.source === "simulation" ? "simulation" : "real",
    meta,
  };
}

export async function pgListCabinCases(): Promise<CabinCaseRow[]> {
  const r = await query(
    `select * from cabin_case order by emergency_level desc, case_id asc`,
  );
  return r.rows.map((row) => mapCabinCase(row as Record<string, unknown>));
}

export async function pgUpsertCabinCase(input: {
  case_id: string;
  title: string;
  category?: string;
  scenario: string;
  roles?: string[];
  focus?: string;
  difficulty: number;
  emergency_level: number;
  solution?: string;
  source: "real" | "simulation";
  meta?: Record<string, unknown>;
}) {
  await query(
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
      input.case_id,
      input.title,
      input.category ?? null,
      input.scenario,
      JSON.stringify(input.roles ?? []),
      input.focus ?? null,
      input.difficulty,
      input.emergency_level,
      input.solution ?? null,
      input.source,
      JSON.stringify(input.meta ?? {}),
    ],
  );
}

/* ---------- knowledge snippets ---------- */

export type KnowledgeSnippetRow = {
  snippet_id: string;
  kind: string;
  title: string;
  summary: string;
  teaching_point: string;
  keywords: string[];
  source_file: string | null;
  source_note: string | null;
};

export async function pgListKnowledgeSnippets(kind?: string) {
  const r = kind
    ? await query(
        `select * from knowledge_snippet where kind=$1 order by snippet_id`,
        [kind],
      )
    : await query(`select * from knowledge_snippet order by kind, snippet_id`);
  return r.rows.map((row) => ({
    snippet_id: String(row.snippet_id),
    kind: String(row.kind),
    title: String(row.title),
    summary: String(row.summary),
    teaching_point: String(row.teaching_point),
    keywords: asStringArray(row.keywords),
    source_file: row.source_file ? String(row.source_file) : null,
    source_note: row.source_note ? String(row.source_note) : null,
  })) as KnowledgeSnippetRow[];
}

export async function pgUpsertKnowledgeSnippet(input: {
  snippet_id: string;
  kind: string;
  title: string;
  summary: string;
  teaching_point: string;
  keywords?: string[];
  source_file?: string;
  source_note?: string;
}) {
  await query(
    `insert into knowledge_snippet
      (snippet_id,kind,title,summary,teaching_point,keywords,source_file,source_note)
     values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8)
     on conflict (snippet_id) do update set
       kind=excluded.kind,
       title=excluded.title,
       summary=excluded.summary,
       teaching_point=excluded.teaching_point,
       keywords=excluded.keywords,
       source_file=excluded.source_file,
       source_note=excluded.source_note,
       updated_at=now()`,
    [
      input.snippet_id,
      input.kind,
      input.title,
      input.summary,
      input.teaching_point,
      JSON.stringify(input.keywords ?? []),
      input.source_file ?? null,
      input.source_note ?? null,
    ],
  );
}

export async function pgUpsertInteractiveContent(input: {
  content_id: string;
  type: "script" | "wordcard" | "quiz";
  title: string;
  body: string;
  source?: "relay" | "teacher";
  created_by?: string;
  approved?: boolean;
}) {
  await query(
    `insert into interactive_content
      (content_id,type,title,body,source,created_by,approved)
     values ($1,$2,$3,$4,$5,$6,$7)
     on conflict (content_id) do update set
       type=excluded.type,
       title=excluded.title,
       body=excluded.body,
       source=excluded.source,
       created_by=excluded.created_by,
       approved=excluded.approved,
       updated_at=now()`,
    [
      input.content_id,
      input.type,
      input.title,
      input.body,
      input.source ?? "teacher",
      input.created_by ?? "seed",
      input.approved ?? true,
    ],
  );
}

export type WorkGalleryRow = {
  clip_id: string;
  title: string;
  award: string;
  tag: string;
  size: "hero" | "tall" | "wide" | "md" | "sm";
  source_file: string;
  file_uri: string;
  sort_order: number;
};

export async function pgListWorkGallery(): Promise<WorkGalleryRow[]> {
  const r = await query(
    `select * from work_gallery order by sort_order, clip_id`,
  );
  return r.rows.map((row) => ({
    clip_id: String(row.clip_id),
    title: String(row.title),
    award: String(row.award),
    tag: String(row.tag),
    size: String(row.size_variant) as WorkGalleryRow["size"],
    source_file: String(row.source_file),
    file_uri: String(row.file_uri),
    sort_order: Number(row.sort_order ?? 0),
  }));
}

export async function pgUpsertWorkGallery(input: {
  clip_id: string;
  title: string;
  award: string;
  tag: string;
  size_variant: string;
  source_file: string;
  file_uri: string;
  sort_order: number;
}) {
  await query(
    `insert into work_gallery
      (clip_id,title,award,tag,size_variant,source_file,file_uri,sort_order)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     on conflict (clip_id) do update set
       title=excluded.title,
       award=excluded.award,
       tag=excluded.tag,
       size_variant=excluded.size_variant,
       source_file=excluded.source_file,
       file_uri=excluded.file_uri,
       sort_order=excluded.sort_order,
       updated_at=now()`,
    [
      input.clip_id,
      input.title,
      input.award,
      input.tag,
      input.size_variant,
      input.source_file,
      input.file_uri,
      input.sort_order,
    ],
  );
}
