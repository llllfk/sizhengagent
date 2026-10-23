"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/components/shared/useSession";
import { cn } from "@/lib/utils";

type Task = {
  task_id: string;
  title: string;
  type: string;
  type_tag: string;
  brief: string;
  status: "todo" | "doing" | "done";
  progress: number;
};

const statusLabel = { todo: "待开始", doing: "进行中", done: "已完成" };
const typeLabel: Record<string, string> = {
  expression: "表达型",
  creation: "创作型",
  experience: "体验型",
};

export function TaskCenter() {
  const { user, studentId } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/task/assign");
    const json = await res.json();
    setTasks(json.data ?? []);
  }, []);

  useEffect(() => {
    if (!studentId) return;
    void load();
  }, [load, studentId]);

  async function claimMore() {
    setBusy(true);
    try {
      await fetch("/api/task/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function bump(task: Task, next: number) {
    setBusy(true);
    try {
      await fetch("/api/task/assign", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: task.task_id,
          progress: next,
          status: next >= 100 ? "done" : next > 0 ? "doing" : "todo",
        }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  const tagHint = tasks[0]?.type_tag
    ? typeLabel[tasks[0].type_tag] ?? tasks[0].type_tag
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--muted)]">
          按学情画像自动匹配任务
          {user ? ` · ${user.display_name}` : ""}
          {tagHint ? `（${tagHint}）` : ""}
        </p>
        <Button
          type="button"
          variant="ghost"
          disabled={busy || !studentId}
          onClick={() => void claimMore()}
        >
          再领一项
        </Button>
      </div>

      {!studentId ? (
        <p className="text-sm text-[var(--muted)]">请先以学生身份登录。</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">暂无任务，点击「再领一项」。</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((t) => (
            <li
              key={t.task_id}
              className="rounded-sm border border-[var(--line)] bg-white p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-sm bg-[var(--orange-fog)] px-2 py-0.5 text-[11px] text-[var(--orange-deep)]">
                  {typeLabel[t.type_tag] ?? t.type_tag}
                </span>
                <span
                  className={cn(
                    "rounded-sm px-2 py-0.5 text-[11px]",
                    t.status === "done" && "bg-emerald-50 text-emerald-700",
                    t.status === "doing" &&
                      "bg-[var(--orange)]/10 text-[var(--orange)]",
                    t.status === "todo" && "bg-black/5 text-[var(--muted)]",
                  )}
                >
                  {statusLabel[t.status]}
                </span>
              </div>
              <h3 className="mt-2 font-display text-lg text-[var(--ink)]">
                {t.title}
              </h3>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                {t.brief}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--orange-fog)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--orange-soft)] to-[var(--orange)] transition-all"
                  style={{ width: `${t.progress}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {t.status !== "done" ? (
                  <>
                    <Button
                      type="button"
                      disabled={busy}
                      onClick={() => void bump(t, Math.min(100, t.progress + 30))}
                    >
                      推进进度
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => void bump(t, 100)}
                    >
                      标记完成
                    </Button>
                  </>
                ) : (
                  <span className="text-xs text-[var(--muted)]">已完成归档</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
