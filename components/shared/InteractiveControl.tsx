"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  InteractiveKickoff,
  type KickoffRoom,
} from "@/components/shared/InteractiveKickoff";
import { cn } from "@/lib/utils";

type Mode = "cabin" | "script" | "wordcard" | "quiz" | "debate";

const modes: Array<{ id: Mode; label: string; hint: string }> = [
  { id: "script", label: "一句话AI剧本", hint: "接龙成剧" },
  { id: "quiz", label: "闯关答题", hint: "自适应组卷" },
  { id: "cabin", label: "客舱情景模拟", hint: "汇编案例" },
  { id: "debate", label: "课堂辩论", hint: "论点树" },
  { id: "wordcard", label: "你来比划我来猜", hint: "词卡" },
];

const categoryLabel: Record<string, string> = {
  emergency: "应急处置",
  disorder: "机闹依法",
  care: "暖心服务",
};

type CabinCaseOption = {
  case_id: string;
  title: string;
  category: string;
  emergency_level: number;
};

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
  cabin_case?: { case_id: string; title: string };
};

export function InteractiveControl() {
  const [active, setActive] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [cases, setCases] = useState<CabinCaseOption[]>([]);
  const [caseId, setCaseId] = useState("");
  const [kickoff, setKickoff] = useState<KickoffRoom | null>(null);
  const [kickToken, setKickToken] = useState<string | null>(null);

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

  useEffect(() => {
    void fetch("/api/cabin/cases")
      .then((r) => r.json())
      .then((j) => {
        const list = (j.data?.cases ?? []) as CabinCaseOption[];
        setCases(list);
      })
      .catch(() => setCases([]));
  }, []);

  async function start(mode: Mode) {
    setLoading(true);
    setNote("");
    try {
      const res = await fetch("/api/interactive/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          ...(mode === "cabin" && caseId ? { case_id: caseId } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "发起失败");
      const title = json.data.cabin_case?.title || json.data.title;
      setActive(json.data);
      setKickoff(json.data as KickoffRoom);
      setKickToken(`${json.data.room_id}:force:${Date.now()}`);
      setNote(
        mode === "cabin"
          ? `已发起客舱情景：${title}`
          : `已发起「${json.data.title}」，课堂学员端将自动同步本场活动。`,
      );
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
      <InteractiveKickoff
        room={kickoff}
        playToken={kickToken}
        onDone={() => setKickToken(null)}
      />
      <div className="rounded-sm border border-[var(--orange)]/25 bg-[var(--orange-fog)]/60 p-4">
        <p className="text-[10px] tracking-[0.22em] text-[var(--orange-deep)]">
          客舱案例库 · 《民航客舱典型案例汇编》
        </p>
        <p className="mt-1 text-sm text-[var(--ink)]">
          已入库 {cases.length || "…"} 条真实案例。发起「客舱情景模拟」前可选题，留空则随机抽取。
        </p>
        <select
          className="mt-3 w-full max-w-xl rounded-sm border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
          value={caseId}
          onChange={(e) => setCaseId(e.target.value)}
        >
          <option value="">随机抽取汇编案例</option>
          {cases.map((c) => (
            <option key={c.case_id} value={c.case_id}>
              [{categoryLabel[c.category] ?? c.category}] {c.title}
            </option>
          ))}
        </select>
      </div>

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
            {active.cabin_case ? (
              <p className="text-sm text-[var(--orange-deep)]">
                案例：{active.cabin_case.title}
              </p>
            ) : null}
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
