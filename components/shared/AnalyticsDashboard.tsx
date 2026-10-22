"use client";

import { useEffect, useState } from "react";

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
      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--orange-fog)]">
        <div
          className="h-full rounded-full transition-all duration-700"
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

  if (!data) {
    return <p className="text-sm text-[var(--muted)]">加载学情…</p>;
  }

  const typeMax = Math.max(
    data.type_dist.expression,
    data.type_dist.creation,
    data.type_dist.experience,
    1,
  );
  const weakMax = Math.max(...data.weak_points.map((w) => w.count), 1);
  const taskMax = Math.max(
    data.task_status.todo,
    data.task_status.doing,
    data.task_status.done,
    1,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { k: "画像学员", v: data.student_count },
          { k: "任务完成率", v: `${data.task_completion_rate}%` },
          { k: "待转接", v: data.pending_escalations },
          { k: "作品归档", v: data.works_count },
        ].map((c) => (
          <div
            key={c.k}
            className="rounded-sm border border-[var(--line)] bg-gradient-to-br from-[var(--orange-fog)] to-white p-4"
          >
            <div className="text-[11px] text-[var(--muted)]">{c.k}</div>
            <div className="mt-1 font-display text-3xl text-[var(--orange)]">
              {c.v}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-sm border border-[var(--line)] bg-white p-4">
          <p className="text-xs tracking-wider text-[var(--muted)]">思维类型分布</p>
          <Bar label="表达型" value={data.type_dist.expression} max={typeMax} />
          <Bar label="创作型" value={data.type_dist.creation} max={typeMax} />
          <Bar label="体验型" value={data.type_dist.experience} max={typeMax} />
        </div>
        <div className="space-y-3 rounded-sm border border-[var(--line)] bg-white p-4">
          <p className="text-xs tracking-wider text-[var(--muted)]">任务状态</p>
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

      <div className="space-y-3 rounded-sm border border-[var(--line)] bg-white p-4">
        <p className="text-xs tracking-wider text-[var(--muted)]">高频薄弱点</p>
        {data.weak_points.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">暂无</p>
        ) : (
          data.weak_points.map((w) => (
            <Bar key={w.name} label={w.name} value={w.count} max={weakMax} />
          ))
        )}
      </div>

      <div className="overflow-x-auto rounded-sm border border-[var(--line)] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--orange-fog)] text-xs text-[var(--muted)]">
            <tr>
              <th className="px-4 py-2 font-medium">学员</th>
              <th className="px-4 py-2 font-medium">类型</th>
              <th className="px-4 py-2 font-medium">认知</th>
              <th className="px-4 py-2 font-medium">已完成任务</th>
              <th className="px-4 py-2 font-medium">薄弱点</th>
            </tr>
          </thead>
          <tbody>
            {data.student_rows.map((s) => (
              <tr key={s.name} className="border-t border-[var(--line)]">
                <td className="px-4 py-2.5 font-medium text-[var(--ink)]">
                  {s.name}
                </td>
                <td className="px-4 py-2.5 text-[var(--orange-deep)]">
                  {typeLabel[s.type_tag] ?? s.type_tag}
                </td>
                <td className="px-4 py-2.5">L{s.cognition_level}</td>
                <td className="px-4 py-2.5">{s.task_done}</td>
                <td className="px-4 py-2.5 text-[var(--muted)]">
                  {s.weak_points.join("、") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
