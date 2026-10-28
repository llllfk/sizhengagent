"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { TYPE_LABEL, TYPE_TAGS, type TypeDist } from "@/lib/content/typeTags";

type Stats = {
  pending_escalations: number;
  open_sessions: number;
  students: number;
  type_dist: TypeDist;
  untyped?: number;
};

export function WorkbenchStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    void fetch("/api/teacher/stats")
      .then((r) => r.json())
      .then((j) => setStats(j.data));
    const t = window.setInterval(() => {
      void fetch("/api/teacher/stats")
        .then((r) => r.json())
        .then((j) => setStats(j.data));
    }, 10000);
    return () => window.clearInterval(t);
  }, []);

  if (!stats) {
    return <p className="text-sm text-[var(--muted)]">同步学情中…</p>;
  }

  const cards = [
    {
      label: "待转接疑难",
      value: stats.pending_escalations,
      hint: "需教师处理",
      pulse: stats.pending_escalations > 0,
    },
    {
      label: "进行中答疑",
      value: stats.open_sessions,
      hint: "学伴会话",
      pulse: false,
    },
    {
      label: "画像学员",
      value: stats.students,
      hint: `学情库 · 待生成 ${stats.untyped ?? 0}`,
      pulse: false,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="tracking-wider text-[var(--muted)]">本课心跳同步中</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((c, i) => (
          <div
            key={c.label}
            className={cn(
              "animate-rise border border-[var(--line)] bg-gradient-to-br from-[var(--orange-fog)] to-white p-4 transition",
              c.pulse &&
                "border-[var(--orange)] shadow-[0_0_0_1px_rgba(232,120,47,0.2),0_12px_28px_rgba(232,120,47,0.15)]",
            )}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="text-[11px] tracking-wider text-[var(--muted)]">
                {c.label}
              </div>
              {c.pulse ? (
                <span className="rounded-sm bg-[var(--orange)] px-1.5 py-0.5 text-[9px] text-white">
                  待办
                </span>
              ) : null}
            </div>
            <div className="mt-1 font-display text-3xl text-[var(--orange)]">
              {c.value}
            </div>
            <div className="mt-1 text-[11px] text-[var(--muted)]">{c.hint}</div>
          </div>
        ))}
      </div>
      <div className="border border-[var(--line)] bg-[var(--paper)] p-4 text-sm text-[var(--ink)]">
        <div className="mb-2 text-[11px] tracking-wider text-[var(--muted)]">
          思维类型分布
        </div>
        <div className="flex flex-wrap gap-5">
          <span>
            {TYPE_LABEL.untyped}{" "}
            <strong className="text-[var(--orange)]">{stats.untyped ?? 0}</strong>
          </span>
          {TYPE_TAGS.map((k) => (
            <span key={k}>
              {TYPE_LABEL[k]}{" "}
              <strong className="text-[var(--orange)]">
                {stats.type_dist[k] ?? 0}
              </strong>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
