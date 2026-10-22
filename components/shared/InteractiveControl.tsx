"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Mode = "cabin" | "script" | "wordcard" | "quiz" | "debate";

const modes: Array<{ id: Mode; label: string; hint: string }> = [
  { id: "script", label: "一句话AI剧本", hint: "接龙成剧" },
  { id: "quiz", label: "闯关答题", hint: "自适应组卷" },
  { id: "cabin", label: "客舱情景模拟", hint: "扮演点评" },
  { id: "debate", label: "课堂辩论", hint: "论点树" },
  { id: "wordcard", label: "你来比划我来猜", hint: "词卡" },
];

type Room = {
  room_id: string;
  mode: string;
  title: string;
  status: string;
  theme: string;
  participants: number;
  script_lines: unknown[];
  quiz_submits: unknown[];
  cabin_perfs?: unknown[];
  debate_speeches?: unknown[];
};

export function InteractiveControl() {
  const [active, setActive] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/interactive/rooms");
    const json = await res.json();
    setActive(json.data?.active ?? null);
  }, []);

  useEffect(() => {
    void refresh();
    const t = window.setInterval(() => void refresh(), 3000);
    return () => window.clearInterval(t);
  }, [refresh]);

  async function start(mode: Mode) {
    setLoading(true);
    setNote("");
    try {
      const res = await fetch("/api/interactive/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "发起失败");
      setActive(json.data);
      setNote(`已发起「${json.data.title}」，课堂学员端将自动同步本场活动。`);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "失败");
    } finally {
      setLoading(false);
    }
  }

  async function endLive() {
    if (!active) return;
    setLoading(true);
    try {
      await fetch(`/api/interactive/rooms/${active.room_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end" }),
      });
      setNote("本场已结束");
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={loading}
            onClick={() => void start(m.id)}
            className={cn(
              "rounded-sm border px-3 py-2.5 text-left transition",
              "hover:border-[var(--orange)] hover:bg-[var(--orange-fog)]",
              "border-[var(--line)] bg-white disabled:opacity-50",
            )}
          >
            <div className="text-sm font-medium text-[var(--ink)]">{m.label}</div>
            <div className="text-[10px] text-[var(--orange)]">{m.hint}</div>
          </button>
        ))}
      </div>

      {note ? (
        <p className="text-sm text-[var(--orange-deep)]">{note}</p>
      ) : null}

      <div className="rounded-sm border border-[var(--line)] bg-[var(--paper)] p-4">
        <div className="mb-2 text-xs tracking-wider text-[var(--muted)]">
          当前场次
        </div>
        {!active ? (
          <p className="text-sm text-[var(--muted)]">暂无进行中互动</p>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-sm bg-[var(--orange)] px-2 py-0.5 text-[11px] text-white">
                {active.status === "live" ? "LIVE" : active.status}
              </span>
              <span className="font-display text-lg">{active.title}</span>
            </div>
            <p className="text-sm text-[var(--muted)]">主题：{active.theme}</p>
            <p className="text-sm text-[var(--ink)]">
              参与 {active.participants}
              {active.mode === "script"
                ? ` · 接龙 ${active.script_lines?.length ?? 0}`
                : null}
              {active.mode === "quiz"
                ? ` · 交卷 ${active.quiz_submits?.length ?? 0}`
                : null}
              {active.mode === "cabin"
                ? ` · 扮演 ${active.cabin_perfs?.length ?? 0}`
                : null}
              {active.mode === "debate"
                ? ` · 发言 ${active.debate_speeches?.length ?? 0}`
                : null}
            </p>
            {active.status === "live" ? (
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => void endLive()}>
                  结束本场
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
