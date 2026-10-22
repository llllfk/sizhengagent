import { findStudent, getStore, workbenchStats } from "@/lib/mock/store";
import type { StudentTypeTag } from "@/types";

export type TaskStatus = "todo" | "doing" | "done";

export type LayeredTask = {
  task_id: string;
  student_id: string;
  type_tag: StudentTypeTag;
  title: string;
  type: "interview" | "short_video" | "field_trip";
  brief: string;
  status: TaskStatus;
  progress: number;
  assigned_at: string;
  updated_at: string;
};

export type VideoProject = {
  project_id: string;
  student_id: string;
  theme: string;
  value_point: string;
  script?: string;
  storyboard?: string;
  subtitle_note?: string;
  file_uri?: string;
  step: 1 | 2 | 3 | 4;
  updated_at: string;
};

export type WorkArchive = {
  work_id: string;
  student_id: string;
  type: string;
  title: string;
  file_uri: string;
  award_level: string | null;
  created_at: string;
};

type TaskStore = {
  tasks: LayeredTask[];
  videos: VideoProject[];
  works: WorkArchive[];
};

const TASK_TEMPLATES: Record<
  StudentTypeTag,
  { title: string; type: LayeredTask["type"]; brief: string }
> = {
  expression: {
    title: "街头采访：人民至上在服务现场",
    type: "interview",
    brief: "采访 3 位同学或路人，问「遇到规则与人情冲突时你会怎么选」，整理 1 分钟口述稿。",
  },
  creation: {
    title: "AI短视频：客舱里的价值抉择",
    type: "short_video",
    brief: "用短视频工坊完成脚本→分镜→字幕→成片归档，突出一个思政价值点。",
  },
  experience: {
    title: "行走的思政课：校园/航站楼观察",
    type: "field_trip",
    brief: "观察一处真实服务场景，记录「安全—秩序—温度」三要素，提交观察笔记。",
  },
};

const g = globalThis as unknown as { __qihangTasks?: TaskStore };

function getTaskStore(): TaskStore {
  if (!g.__qihangTasks) {
    const now = new Date().toISOString();
    g.__qihangTasks = {
      tasks: [
        {
          task_id: "task_seed_1",
          student_id: "demo-student",
          type_tag: "creation",
          ...TASK_TEMPLATES.creation,
          status: "todo",
          progress: 0,
          assigned_at: now,
          updated_at: now,
        },
        {
          task_id: "task_seed_2",
          student_id: "S2026001",
          type_tag: "expression",
          ...TASK_TEMPLATES.expression,
          status: "doing",
          progress: 40,
          assigned_at: now,
          updated_at: now,
        },
        {
          task_id: "task_seed_3",
          student_id: "S2026015",
          type_tag: "experience",
          ...TASK_TEMPLATES.experience,
          status: "done",
          progress: 100,
          assigned_at: now,
          updated_at: now,
        },
      ],
      videos: [],
      works: [
        {
          work_id: "work_seed_1",
          student_id: "S2026008",
          type: "short_video",
          title: "颠簸中的回座指令",
          file_uri: "works/demo/turbulence.mp4",
          award_level: "校级优胜",
          created_at: now,
        },
      ],
    };
  }
  return g.__qihangTasks;
}

export function listTasks(studentId?: string) {
  const tasks = getTaskStore().tasks;
  if (!studentId) return tasks;
  return tasks.filter((t) => t.student_id === studentId);
}

export function assignTask(studentId: string, typeTag?: StudentTypeTag) {
  const profile = findStudent(studentId);
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
  getTaskStore().tasks.unshift(task);
  return task;
}

export function updateTask(
  taskId: string,
  patch: Partial<Pick<LayeredTask, "status" | "progress">>,
) {
  const task = getTaskStore().tasks.find((t) => t.task_id === taskId);
  if (!task) return null;
  if (patch.status) task.status = patch.status;
  if (typeof patch.progress === "number") {
    task.progress = Math.max(0, Math.min(100, patch.progress));
  }
  if (task.progress >= 100) task.status = "done";
  else if (task.progress > 0 && task.status === "todo") task.status = "doing";
  task.updated_at = new Date().toISOString();
  return task;
}

export function getOrCreateVideo(studentId: string) {
  const store = getTaskStore();
  let project = store.videos.find((v) => v.student_id === studentId);
  if (!project) {
    project = {
      project_id: `vp_${Date.now()}`,
      student_id: studentId,
      theme: "",
      value_point: "",
      step: 1,
      updated_at: new Date().toISOString(),
    };
    store.videos.unshift(project);
  }
  return project;
}

export function saveVideoStep(
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
  const project = getOrCreateVideo(studentId);
  if (input.theme != null) project.theme = input.theme;
  if (input.value_point != null) project.value_point = input.value_point;
  if (input.script != null) project.script = input.script;
  if (input.storyboard != null) project.storyboard = input.storyboard;
  if (input.subtitle_note != null) project.subtitle_note = input.subtitle_note;
  if (input.file_uri != null) project.file_uri = input.file_uri;
  if (input.step) project.step = input.step;
  project.updated_at = new Date().toISOString();
  return project;
}

export function generateScriptMock(theme: string, valuePoint: string) {
  return [
    `【主题】${theme}`,
    `【价值点】${valuePoint || "人民至上 · 服务边界"}`,
    "",
    "旁白：客舱里每一次抉择，都在回答我们把什么放在前面。",
    "画面：旅客激动——乘务员沉稳——规章与温度同时在场。",
    "收束：安全是底线，温度是能力，边界是职业尊严。",
    "",
    "—— AI生成内容，供讨论参考",
  ].join("\n");
}

export function generateStoryboardMock(theme: string, valuePoint: string) {
  return [
    `主题：${theme}`,
    `价值点：${valuePoint || "（待填写）"}`,
    "镜头1 开场空镜 · 客舱走廊（2s）",
    "镜头2 冲突特写 · 旅客与乘务员（4s）",
    "镜头3 旁白切入 · 价值抉择字幕（3s）",
    "镜头4 预案落地 · 秩序恢复（3s）",
    "镜头5 收束金句 · 品牌落版（2s）",
    "",
    "—— AI生成内容，供讨论参考",
  ].join("\n");
}

export function archiveWork(input: {
  student_id: string;
  type: string;
  title: string;
  file_uri: string;
}) {
  const work: WorkArchive = {
    work_id: `work_${Date.now()}`,
    student_id: input.student_id,
    type: input.type,
    title: input.title,
    file_uri: input.file_uri,
    award_level: null,
    created_at: new Date().toISOString(),
  };
  getTaskStore().works.unshift(work);
  return work;
}

export function listWorks(studentId?: string) {
  const works = getTaskStore().works;
  if (!studentId) return works;
  return works.filter((w) => w.student_id === studentId);
}

export function analyticsBundle() {
  const students = getStore().students;
  const tasks = getTaskStore().tasks;
  const works = getTaskStore().works;
  const wb = workbenchStats();

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

export function weeklyReportDraft() {
  const a = analyticsBundle();
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
