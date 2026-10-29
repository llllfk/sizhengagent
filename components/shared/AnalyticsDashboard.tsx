"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ProfileRadar,
  TypeBeaconBoard,
  buildClassRadarAxes,
} from "@/components/shared/ProfileRadar";
import { WorksArchiveList } from "@/components/shared/WorksArchiveList";
import {
  TYPE_LABEL,
  TYPE_TAGS,
  type TypeDist,
} from "@/lib/content/typeTags";

type StudentRow = {
  student_id?: string;
  name: string;
  type_tag: string;
  cognition_level: number;
  task_done: number;
  weak_points: string[];
  open_issues?: number;
};

type Analytics = {
  data_source?: string;
  pending_escalations: number;
  open_sessions: number;
  open_learning_issues?: number;
  recent_issues?: Array<{
    issue_id: string;
    student_id: string;
    student_name?: string;
    title: string;
    weak_tag: string | null;
  }>;
  week?: {
    since: string;
    qa_sessions_7d: number;
    escalations_7d: number;
    learning_issues_7d: number;
    quiz_issues_7d: number;
  };
  student_count: number;
  untyped?: number;
  type_dist: TypeDist;
  task_status: { todo: number; doing: number; done: number };
  task_completion_rate: number;
  works_count: number;
  weak_points: Array<{ name: string; count: number }>;
  student_rows: StudentRow[];
};

const typeLabel = TYPE_LABEL as Record<string, string>;

function Bar({
  label,
  value,
  max,
  color = "var(--orange)",
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max <= 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-[var(--muted)]">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-sm bg-[var(--orange-fog)]">
        <div
          className="h-full rounded-sm transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [worksStudentId, setWorksStudentId] = useState<string | null>(null);

  const load = () =>
    fetch("/api/teacher/analytics")
      .then((r) => r.json())
      .then((j) => setData(j.data));

  useEffect(() => {
    void load();
  }, []);

  async function setType(studentId: string, type_tag: string) {
    await fetch("/api/teacher/students", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId, type_tag }),
    });
    await load();
  }

  const dominant = useMemo(() => {
    if (!data) return "creation";
    const d = data.type_dist;
    const entries: Array<[string, number]> = TYPE_TAGS.map((k) => [
      k,
      d[k] ?? 0,
    ]);
    return entries.sort((a, b) => b[1] - a[1])[0]![0];
  }, [data]);

  const axes = useMemo(() => {
    if (!data) return [];
    return buildClassRadarAxes({
      type_dist: data.type_dist,
      task_completion_rate: data.task_completion_rate,
      works_count: data.works_count,
      student_count: data.student_count,
      weak_top: data.weak_points[0]?.count,
      open_learning_issues: data.open_learning_issues,
      week_qa: data.week?.qa_sessions_7d,
    });
  }, [data]);

  if (!data) {
    return <p className="text-sm text-[var(--muted)]">加载学情…</p>;
  }

  const weakMax = Math.max(...data.weak_points.map((w) => w.count), 1);
  const taskMax = Math.max(
    data.task_status.todo,
    data.task_status.doing,
    data.task_status.done,
    1,
  );

  return (
    <div className="space-y-6">
      {/* 主视觉：灯牌 + 雷达 */}
      <div className="profile-hero relative overflow-hidden rounded-sm border border-[var(--glass-border)] bg-white/85 p-5 md:p-6">
        <div className="profile-hero-glow" aria-hidden />
        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] tracking-[0.28em] text-[var(--orange)]">
                大规模因材施教 · 实时库
                {data.data_source === "postgres_live" ? " · LIVE" : ""}
              </p>
              <h3 className="mt-1 font-display text-2xl text-[var(--ink)]">
                三型灯牌 · 班级雷达
              </h3>
            </div>
            <div className="flex flex-wrap gap-3 text-center">
              {[
                { k: "学员", v: data.student_count },
                { k: "待生成", v: data.untyped ?? 0 },
                { k: "7日答疑", v: data.week?.qa_sessions_7d ?? "—" },
                { k: "7日转接", v: data.week?.escalations_7d ?? "—" },
                {
                  k: "问题清单",
                  v: data.open_learning_issues ?? 0,
                },
              ].map((c) => (
                <div
                  key={c.k}
                  className="min-w-[4.5rem] rounded-sm border border-[var(--line)] bg-white/90 px-3 py-2"
                >
                  <p className="text-[10px] text-[var(--muted)]">{c.k}</p>
                  <p className="font-display text-xl text-[var(--orange)]">
                    {c.v}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <TypeBeaconBoard
            active={dominant}
            counts={data.type_dist}
            mode="class"
          />

          <div className="grid items-center gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <ProfileRadar
              axes={axes}
              size={300}
              accentLabel="班级能力雷达"
              className="justify-self-center"
            />
            <div className="space-y-4">
              <div className="rounded-sm border border-[var(--line)] bg-white/90 p-4">
                <p className="text-[10px] tracking-[0.2em] text-[var(--muted)]">
                  任务节奏
                </p>
                <div className="mt-3 space-y-2.5">
                  <Bar label="待开始" value={data.task_status.todo} max={taskMax} />
                  <Bar
                    label="进行中"
                    value={data.task_status.doing}
                    max={taskMax}
                    color="#f08a3a"
                  />
                  <Bar
                    label="已完成"
                    value={data.task_status.done}
                    max={taskMax}
                    color="#2f9e6b"
                  />
                </div>
              </div>
              <div className="rounded-sm border border-[var(--line)] bg-white/90 p-4">
                <p className="text-[10px] tracking-[0.2em] text-[var(--muted)]">
                  高频薄弱点
                </p>
                <div className="mt-3 space-y-2.5">
                  {data.weak_points.length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">暂无</p>
                  ) : (
                    data.weak_points.slice(0, 4).map((w) => (
                      <Bar
                        key={w.name}
                        label={w.name}
                        value={w.count}
                        max={weakMax}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 明细弱化：折叠感卡片列表，替代大表抢戏 */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.22em] text-[var(--orange)]">
          学员速览 · {data.student_rows.length} 人
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.student_rows.map((s) => {
            const sid = s.student_id;
            const open = sid && worksStudentId === sid;
            return (
              <div
                key={sid || s.name}
                className="rounded-sm border border-[var(--line)] bg-white/90 px-3 py-3 transition hover:border-[var(--orange)]/40"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-display text-base text-[var(--ink)]">
                    {s.name}
                  </p>
                  {sid ? (
                    <select
                      className="rounded-sm border border-[var(--line)] bg-white px-1.5 py-0.5 text-[10px] text-[var(--orange-deep)] outline-none"
                      value={s.type_tag}
                      onChange={(e) => void setType(sid, e.target.value)}
                    >
                      <option value="untyped">{TYPE_LABEL.untyped}</option>
                      {TYPE_TAGS.map((k) => (
                        <option key={k} value={k}>
                          {TYPE_LABEL[k]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-[10px] tracking-wider text-[var(--orange)]">
                      {typeLabel[s.type_tag] ?? s.type_tag}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-[var(--muted)]">
                  L{s.cognition_level} · 完成 {s.task_done} 项
                  {(s.open_issues ?? 0) > 0
                    ? ` · 待办 ${s.open_issues}`
                    : ""}
                </p>
                <p className="mt-1 line-clamp-1 text-[11px] text-[var(--muted)]">
                  {s.weak_points.join("、") || "薄弱点未标注"}
                </p>
                {sid ? (
                  <button
                    type="button"
                    className="mt-2 text-[10px] text-[var(--orange)] underline-offset-2 hover:underline"
                    onClick={() =>
                      setWorksStudentId((cur) => (cur === sid ? null : sid))
                    }
                  >
                    {open ? "收起作品" : "查看作品"}
                  </button>
                ) : null}
                {open && sid ? (
                  <WorksArchiveList
                    className="mt-2"
                    studentId={sid}
                    title={`${s.name} · 成片`}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {(data.recent_issues?.length ?? 0) > 0 ? (
        <div className="space-y-3">
          <p className="text-[10px] tracking-[0.22em] text-[var(--orange)]">
            实时问题清单 · 闯关 / 答疑转接
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.recent_issues!.map((issue) => {
              const who =
                issue.student_name ??
                data.student_rows.find((s) => s.student_id === issue.student_id)
                  ?.name ??
                issue.student_id;
              return (
                <div
                  key={issue.issue_id}
                  className="rounded-sm border border-[var(--orange)]/25 bg-[var(--orange-fog)]/40 px-3 py-2.5"
                >
                  <p className="text-[11px] text-[var(--muted)]">{who}</p>
                  <p className="mt-0.5 text-sm text-[var(--orange-deep)]">
                    {issue.title}
                  </p>
                  {issue.weak_tag ? (
                    <p className="mt-1 text-[10px] tracking-wider text-[var(--muted)]">
                      标签 · {issue.weak_tag}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
