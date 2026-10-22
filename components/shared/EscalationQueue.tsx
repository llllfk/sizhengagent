"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Item = {
  escalation_id: string;
  session_id: string;
  student_id: string;
  student_name?: string;
  summary: string;
  created_at: string;
  teacher_status: "pending" | "accepted" | "scheduled" | "done";
};

const statusLabel: Record<Item["teacher_status"], string> = {
  pending: "待处理",
  accepted: "已接受",
  scheduled: "已排期",
  done: "已完成",
};

export function EscalationQueue() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teacher/escalations");
      const json = await res.json();
      setItems(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(t);
  }, [load]);

  async function setStatus(id: string, teacher_status: Item["teacher_status"]) {
    await fetch("/api/teacher/escalations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ escalation_id: id, teacher_status }),
    });
    await load();
  }

  if (loading && items.length === 0) {
    return <p className="text-sm text-[var(--muted)]">加载队列…</p>;
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        暂无转接。在学伴端追问满轮后，系统会自动入队。
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item, idx) => (
        <li
          key={item.escalation_id}
          className="animate-rise border border-[var(--line)] bg-[var(--paper)] p-4 transition hover:border-[var(--orange)]/50"
          style={{ animationDelay: `${idx * 0.06}s` }}
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-sm px-2 py-0.5 text-[11px]",
                item.teacher_status === "pending" &&
                  "bg-[var(--vermilion)]/10 text-[var(--vermilion)]",
                item.teacher_status === "accepted" &&
                  "bg-[var(--orange-fog)] text-[var(--orange-deep)]",
                item.teacher_status === "scheduled" &&
                  "bg-[var(--orange)]/15 text-[var(--orange)]",
                item.teacher_status === "done" &&
                  "bg-black/5 text-[var(--muted)]",
              )}
            >
              {statusLabel[item.teacher_status]}
            </span>
            <span className="font-display text-sm text-[var(--ink)]">
              {item.student_name ?? item.student_id}
            </span>
            <span className="text-[11px] text-[var(--muted)]">
              {new Date(item.created_at).toLocaleString("zh-CN")}
            </span>
          </div>
          <p className="text-sm leading-6 text-[var(--ink)]/80">{item.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.teacher_status === "pending" ? (
              <Button
                type="button"
                onClick={() => void setStatus(item.escalation_id, "accepted")}
              >
                一键接受
              </Button>
            ) : null}
            {item.teacher_status === "accepted" ? (
              <Button
                type="button"
                onClick={() => void setStatus(item.escalation_id, "scheduled")}
              >
                排期专题答疑
              </Button>
            ) : null}
            {item.teacher_status === "scheduled" ? (
              <Button
                type="button"
                onClick={() => void setStatus(item.escalation_id, "done")}
              >
                标记完成
              </Button>
            ) : null}
            <Button type="button" variant="ghost" onClick={() => void load()}>
              刷新
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
