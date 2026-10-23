"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ProfileRadar,
  TypeBeaconBoard,
  buildClassRadarAxes,
} from "@/components/shared/ProfileRadar";

type StudentRow = {
  name: string;
  type_tag: string;
  cognition_level: number;
  task_done: number;
  weak_points: string[];
};

type Analytics = {
  pending_escalations: number;
  open_sessions: number;
  student_count: number;
  type_dist: { expression: number; creation: number; experience: number };
  task_status: { todo: number; doing: number; done: number };
  task_completion_rate: number;
  works_count: number;
  weak_points: Array<{ name: string; count: number }>;
  student_rows: StudentRow[];
};

const typeLabel: Record<string, string> = {
  expression: "表达型",
  creation: "创作型",
  experience: "体验型",
};

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

  useEffect(() => {
    void fetch("/api/teacher/analytics")
      .then((r) => r.json())
      .then((j) => setData(j.data));
  }, []);

  const dominant = useMemo(() => {
    if (!data) return "creation";
    const d = data.type_dist;
    const entries = [
      ["expression", d.expression],
      ["creation", d.creation],
      ["experience", d.experience],
    ] as const;
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
      {/* 答辩主视觉：灯牌 + 雷达 */}
      <div className="profile-hero relative overflow-hidden rounded-sm border border-[var(--glass-border)] bg-white/85 p-5 md:p-6">
        <div className="profile-hero-glow" aria-hidden />
        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] tracking-[0.28em] text-[var(--orange)]">
                大规模因材施教 · 班级画像
              </p>
              <h3 className="mt-1 font-display text-2xl text-[var(--ink)]">
                三型灯牌 · 班级雷达
              </h3>
            </div>
            <div className="flex flex-wrap gap-3 text-center">
              {[
                { k: "学员", v: data.student_count },
                { k: "完成率", v: `${data.task_completion_rate}%` },
                { k: "作品", v: data.works_count },
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
          {data.student_rows.map((s) => (
            <div
              key={s.name}
              className="rounded-sm border border-[var(--line)] bg-white/90 px-3 py-3 transition hover:border-[var(--orange)]/40"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-display text-base text-[var(--ink)]">
                  {s.name}
                </p>
                <span className="text-[10px] tracking-wider text-[var(--orange)]">
                  {typeLabel[s.type_tag] ?? s.type_tag}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                L{s.cognition_level} · 完成 {s.task_done} 项
              </p>
              <p className="mt-1 line-clamp-1 text-[11px] text-[var(--muted)]">
                {s.weak_points.join("、") || "薄弱点未标注"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
