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

export async function pgFindStudent(studentId: string) {
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
};

export async function pgCreateSession(input: {
  student_id: string;
  question: string;
  q_type: QuestionType;
  firstPrompt: string;
}): Promise<PgSession> {
  const sessionId = `qs_${Date.now()}`;
  const chain = [{ role: "ai" as const, content: input.firstPrompt }];
  await query(
    `insert into qa_session
      (session_id, student_id, q_type, question, followup_chain, status)
     values ($1,$2,$3,$4,$5::jsonb,'open')`,
    [
      sessionId,
      input.student_id,
      input.q_type,
      input.question,
      JSON.stringify(chain),
    ],
  );
  return {
    session_id: sessionId,
    student_id: input.student_id,
    q_type: input.q_type,
    question: input.question,
    round: 0,
    followup_chain: chain,
    status: "open",
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
  };
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

export async function pgAnalyticsBundle() {
  const students = await pgListStudents();
  const tasks = await pgListTasks();
  const works = await pgListWorks();
  const wb = await pgWorkbenchStats();

  const weakMap = new Map<string, number>();
  students.forEach((s) => {
    s.weak_points.forEach((w) => weakMap.set(w, (weakMap.get(w) ?? 0) + 1));
  });

  const taskStatus = {
    todo: tasks.filter((t) => t.status === "todo").length,
    doing: tasks.filter((t) => t.status === "doing").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  const completionRate =
    tasks.length === 0
      ? 0
      : Math.round((taskStatus.done / tasks.length) * 100);

  return {
    pending_escalations: wb.pending_escalations,
    open_sessions: wb.open_sessions,
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
      task_done: tasks.filter(
        (t) => t.student_id === s.student_id && t.status === "done",
      ).length,
    })),
  };
}

export async function pgWeeklyReportDraft() {
  const a = await pgAnalyticsBundle();
  const topWeak = a.weak_points[0]?.name ?? "服务边界";
  return {
    week_label: "本周学情周报（草稿）",
    generated_at: new Date().toISOString(),
    summary: [
      `本周画像学员 ${a.student_count} 人；待转接疑难 ${a.pending_escalations} 条；进行中答疑 ${a.open_sessions} 场。`,
      `分层任务完成率 ${a.task_completion_rate}%（待办 ${a.task_status.todo} / 进行中 ${a.task_status.doing} / 已完成 ${a.task_status.done}）。`,
      `作品归档 ${a.works_count} 件；高频薄弱点集中在「${topWeak}」。`,
    ].join("\n"),
    suggestions: [
      `下节课用「课中五式·闯关」针对「${topWeak}」做 5 分钟巩固。`,
      "对转接队列中的 pending 案例安排一次 15 分钟专题答疑。",
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
