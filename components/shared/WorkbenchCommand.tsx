"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  InteractiveKickoff,
  type KickoffRoom,
} from "@/components/shared/InteractiveKickoff";
import { CABIN_CASES_ASSEMBLY } from "@/lib/content/cabinCasesAssembly";
import { cn } from "@/lib/utils";

type Stats = {
  pending_escalations: number;
  open_sessions: number;
  students: number;
  type_dist: { expression: number; creation: number; experience: number };
};

type Mode = "cabin" | "script" | "wordcard" | "quiz" | "debate";

type CabinCase = {
  case_id: string;
  title: string;
  category: string;
  scenario: string;
  focus: string;
  emergency_level: number;
  source?: string;
};

type Room = {
  room_id: string;
  mode: string;
  title: string;
  status: string;
  theme: string;
  participants: number;
  cabin_case?: { case_id: string; title: string };
};

const MODES: Array<{ id: Mode; label: string; short: string; hint: string }> = [
  { id: "cabin", label: "客舱情景", short: "情景", hint: "真实案例演练" },
  { id: "script", label: "AI剧本", short: "剧本", hint: "一句话接龙" },
  { id: "wordcard", label: "比划猜", short: "词卡", hint: "你来比划" },
  { id: "quiz", label: "闯关答题", short: "闯关", hint: "自适应组卷" },
  { id: "debate", label: "课堂辩论", short: "辩论", hint: "论点交锋" },
];

const VIEWS = [
  { href: "/modules", title: "八模块总览", tag: "结构" },
  { href: "/escalations", title: "转接队列", tag: "讲深" },
  { href: "/interactive-control", title: "互动调度", tag: "讲透" },
  { href: "/analytics", title: "学情看板", tag: "画像" },
];

const categoryLabel: Record<string, string> = {
  emergency: "应急处置",
  disorder: "秩序冲突",
  care: "特殊关怀",
};

function useCountUp(target: number, duration = 700) {
  const [n, setN] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    let raf = 0;
    const from = prev.current;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - (1 - p) ** 3;
      const next = Math.round(from + (target - from) * eased);
      setN(next);
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return n;
}

function StatBlock({
  label,
  value,
  hint,
  alert,
  delay,
}: {
  label: string;
  value: number;
  hint: string;
  alert?: boolean;
  delay: number;
}) {
  const shown = useCountUp(value);
  return (
    <div
      className={cn(
        "wb-cmd-stat relative overflow-hidden rounded-sm border px-4 py-4",
        alert
          ? "border-[var(--orange)] bg-gradient-to-br from-[var(--orange-fog)] to-white shadow-[0_12px_32px_rgba(232,120,47,0.18)]"
          : "border-[var(--line)] bg-white/90",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {alert ? <span className="wb-cmd-pulse-ring" aria-hidden /> : null}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] tracking-[0.22em] text-[var(--muted)]">
          {label}
        </p>
        {alert ? (
          <span className="rounded-sm bg-[var(--orange)] px-1.5 py-0.5 text-[9px] text-white">
            待办
          </span>
        ) : null}
      </div>
      <p className="mt-1 font-display text-4xl tabular-nums text-[var(--orange)] md:text-5xl">
        {shown}
      </p>
      <p className="mt-1 text-[11px] text-[var(--muted)]">{hint}</p>
    </div>
  );
}

export function WorkbenchCommand() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [cases, setCases] = useState<CabinCase[]>([]);
  const [active, setActive] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [clock, setClock] = useState("");
  const [caseIdx, setCaseIdx] = useState(0);
  const [kickoff, setKickoff] = useState<KickoffRoom | null>(null);
  const [kickToken, setKickToken] = useState<string | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch("/api/teacher/stats");
      const json = await res.json();
      if (json.data) setStats(json.data);
    } catch {
      /* keep last snapshot */
    }
  }, []);

  const refreshRoom = useCallback(async () => {
    try {
      const res = await fetch("/api/interactive/rooms");
      const json = await res.json();
      setActive(json.data?.active ?? null);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refreshStats();
    void refreshRoom();
    const s = window.setInterval(() => void refreshStats(), 8000);
    const r = window.setInterval(() => void refreshRoom(), 4000);
    return () => {
      window.clearInterval(s);
      window.clearInterval(r);
    };
  }, [refreshStats, refreshRoom]);

  useEffect(() => {
    void fetch("/api/cabin/cases")
      .then((r) => r.json())
      .then((j) => {
        const list = (j.data?.cases ?? []) as CabinCase[];
        if (list.length) {
          setCases(list);
          return;
        }
        setCases(
          CABIN_CASES_ASSEMBLY.map((c) => ({
            case_id: c.case_id,
            title: c.title,
            category: c.category,
            scenario: c.scenario,
            focus: c.focus,
            emergency_level: c.emergency_level,
            source: c.source,
          })),
        );
      })
      .catch(() => {
        setCases(
          CABIN_CASES_ASSEMBLY.map((c) => ({
            case_id: c.case_id,
            title: c.title,
            category: c.category,
            scenario: c.scenario,
            focus: c.focus,
            emergency_level: c.emergency_level,
            source: c.source,
          })),
        );
      });
  }, []);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(
        d.toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    };
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, []);

  const showcase = useMemo(() => cases.slice(0, 8), [cases]);

  useEffect(() => {
    if (showcase.length <= 1) return;
    const t = window.setInterval(() => {
      setCaseIdx((i) => (i + 1) % showcase.length);
    }, 9000);
    return () => window.clearInterval(t);
  }, [showcase.length]);

  const featured = useMemo(() => {
    if (!showcase.length) return null;
    return showcase[caseIdx % showcase.length] ?? showcase[0];
  }, [showcase, caseIdx]);

  const typeTotal = stats
    ? stats.type_dist.expression +
      stats.type_dist.creation +
      stats.type_dist.experience
    : 0;

  async function start(mode: Mode, caseId?: string) {
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
      setActive(json.data);
      setKickoff(json.data as KickoffRoom);
      setKickToken(`${json.data.room_id}:force:${Date.now()}`);
      const title = json.data.cabin_case?.title || json.data.title;
      setNote(
        mode === "cabin"
          ? `已开场 · ${title}`
          : `已开场 · ${json.data.title}`,
      );
    } catch (e) {
      setNote(e instanceof Error ? e.message : "发起失败");
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
      await refreshRoom();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wb-cmd space-y-5">
      <InteractiveKickoff
        room={kickoff}
        playToken={kickToken}
        onDone={() => setKickToken(null)}
      />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <p className="text-[11px] tracking-[0.3em] text-[var(--orange)]">
            中枢 · 指挥舱
          </p>
          <h1 className="font-brand text-4xl text-[var(--ink)] md:text-5xl">
            今日课堂
          </h1>
          <p className="max-w-xl text-sm text-[var(--muted)]">
            左侧态势 · 中央一键五式 · 右侧本课主案例
          </p>
        </div>
        <div className="wb-cmd-clock flex items-center gap-3 rounded-sm border border-[var(--glass-border)] bg-white/80 px-4 py-2.5 backdrop-blur-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <div>
            <p className="text-[10px] tracking-[0.2em] text-[var(--muted)]">
              课堂心跳
            </p>
            <p className="font-display text-lg tabular-nums text-[var(--ink)]">
              {clock || "--:--:--"}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.3fr_0.95fr]">
        {/* LEFT · 态势 */}
        <aside className="wb-cmd-col space-y-3">
          <p className="text-[10px] tracking-[0.24em] text-[var(--orange)]">
            实时态势
          </p>
          {stats ? (
            <>
              <StatBlock
                label="待转接疑难"
                value={stats.pending_escalations}
                hint="模块① → 教师队列"
                alert={stats.pending_escalations > 0}
                delay={0}
              />
              <StatBlock
                label="进行中答疑"
                value={stats.open_sessions}
                hint="学伴会话在线"
                delay={80}
              />
              <StatBlock
                label="画像学员"
                value={stats.students}
                hint="学情库覆盖"
                delay={160}
              />
              <div className="rounded-sm border border-[var(--line)] bg-white/90 p-4">
                <p className="text-[10px] tracking-[0.2em] text-[var(--muted)]">
                  思维分型
                </p>
                <div className="mt-3 space-y-2.5">
                  {(
                    [
                      ["表达型", stats.type_dist.expression],
                      ["创作型", stats.type_dist.creation],
                      ["体验型", stats.type_dist.experience],
                    ] as const
                  ).map(([name, v]) => {
                    const pct = typeTotal ? Math.round((v / typeTotal) * 100) : 0;
                    return (
                      <div key={name}>
                        <div className="mb-1 flex justify-between text-[11px]">
                          <span className="text-[var(--ink)]">{name}</span>
                          <span className="tabular-nums text-[var(--orange)]">
                            {v}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-sm bg-[var(--orange-fog)]">
                          <div
                            className="wb-cmd-bar h-full rounded-sm bg-gradient-to-r from-[var(--orange-soft)] to-[var(--orange)]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--muted)]">同步学情中…</p>
          )}
        </aside>

        {/* CENTER · 五式 */}
        <section className="wb-cmd-center relative overflow-hidden rounded-sm border border-[var(--glass-border)] bg-white/85 p-4 md:p-5">
          <div className="wb-cmd-center-glow" aria-hidden />
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] tracking-[0.24em] text-[var(--orange)]">
                  课中五式 · 一键开场
                </p>
                <h2 className="mt-1 font-display text-xl text-[var(--ink)]">
                  互动剧场调度
                </h2>
              </div>
              {active?.status === "live" ? (
                <span className="wb-cmd-live inline-flex items-center gap-1.5 rounded-sm bg-[var(--orange)] px-2.5 py-1 text-[11px] font-medium text-white">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  LIVE · {active.title}
                </span>
              ) : (
                <span className="rounded-sm border border-[var(--line)] px-2.5 py-1 text-[11px] text-[var(--muted)]">
                  待机中
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              {MODES.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    void start(
                      m.id,
                      m.id === "cabin" ? featured?.case_id : undefined,
                    )
                  }
                  className="wb-cmd-mode group relative overflow-hidden rounded-sm border border-[var(--line)] bg-gradient-to-b from-white to-[var(--orange-fog)]/40 px-2 py-4 text-center transition hover:-translate-y-1 hover:border-[var(--orange)] hover:shadow-[0_14px_32px_rgba(232,120,47,0.2)] disabled:opacity-50"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <span className="wb-cmd-mode-shine" aria-hidden />
                  <span className="relative z-10 font-display text-lg text-[var(--ink)] group-hover:text-[var(--orange-deep)] md:text-xl">
                    {m.short}
                  </span>
                  <span className="relative z-10 mt-1 block text-[10px] text-[var(--muted)]">
                    {m.hint}
                  </span>
                </button>
              ))}
            </div>

            {active?.status === "live" ? (
              <div className="flex flex-wrap items-center gap-3 rounded-sm border border-[var(--orange)]/30 bg-[var(--orange-fog)]/70 px-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base text-[var(--ink)]">
                    {active.title}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    主题 {active.theme}
                    {active.cabin_case
                      ? ` · ${active.cabin_case.title}`
                      : ""}{" "}
                    · 参与 {active.participants}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={loading}
                  onClick={() => void endLive()}
                >
                  结束本场
                </Button>
                <Link
                  href="/interactive-control"
                  className="text-xs text-[var(--orange)] hover:underline"
                >
                  细调度 →
                </Link>
              </div>
            ) : null}

            {note ? (
              <p className="text-sm text-[var(--orange-deep)]">{note}</p>
            ) : (
              <p className="text-xs text-[var(--muted)]">
                点击上方任一式即开场；客舱情景默认绑定右侧主案例。
              </p>
            )}
          </div>
        </section>

        {/* RIGHT · 主案例 */}
        <aside className="wb-cmd-col space-y-3">
          <p className="text-[10px] tracking-[0.24em] text-[var(--orange)]">
            本课主案例
          </p>
          {featured ? (
            <article className="wb-cmd-case relative overflow-hidden rounded-sm border border-[var(--glass-border)] bg-white/90 p-4">
              <div className="wb-cmd-case-glow" aria-hidden />
              <div className="relative z-10 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] tracking-wider text-[var(--orange)]">
                    {categoryLabel[featured.category] ?? featured.category}
                  </span>
                  <span className="text-[10px] text-[var(--muted)]">
                    紧急度 {featured.emergency_level}
                  </span>
                  {featured.source === "real" ? (
                    <span className="ml-auto text-[10px] text-[var(--orange-deep)]">
                      真案例
                    </span>
                  ) : null}
                </div>
                <h3 className="font-display text-lg leading-snug text-[var(--ink)] md:text-xl">
                  {featured.title}
                </h3>
                <p className="line-clamp-4 text-sm leading-6 text-[var(--muted)]">
                  {featured.scenario}
                </p>
                <p className="rounded-sm bg-[#FFF8F2] px-2.5 py-2 text-xs text-[var(--ink)]">
                  聚焦：{featured.focus}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    disabled={loading}
                    onClick={() => void start("cabin", featured.case_id)}
                  >
                    用此案例开场
                  </Button>
                  <Link
                    href="/industry"
                    className="rounded-sm border border-[var(--line)] bg-white px-3 py-2 text-xs text-[var(--muted)] transition hover:border-[var(--orange)] hover:text-[var(--orange)]"
                  >
                    行业问题库
                  </Link>
                </div>
                {showcase.length > 1 ? (
                  <div className="flex gap-1 pt-1">
                    {showcase.map((c, i) => (
                      <button
                        key={c.case_id}
                        type="button"
                        aria-label={c.title}
                        onClick={() => setCaseIdx(i)}
                        className={cn(
                          "h-1.5 flex-1 rounded-sm transition",
                          caseIdx % showcase.length === i
                            ? "bg-[var(--orange)]"
                            : "bg-[var(--orange-fog)] hover:bg-[var(--orange-soft)]",
                        )}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ) : (
            <p className="text-sm text-[var(--muted)]">载入案例…</p>
          )}

          <div className="grid grid-cols-2 gap-2">
            {VIEWS.map((v) => (
              <Link
                key={v.href}
                href={v.href}
                className="group rounded-sm border border-[var(--line)] bg-white/80 px-3 py-3 transition hover:border-[var(--orange)] hover:bg-[var(--orange-fog)]/50"
              >
                <p className="text-[9px] tracking-[0.2em] text-[var(--orange)]">
                  {v.tag}
                </p>
                <p className="mt-1 text-sm text-[var(--ink)] group-hover:text-[var(--orange-deep)]">
                  {v.title}
                </p>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
