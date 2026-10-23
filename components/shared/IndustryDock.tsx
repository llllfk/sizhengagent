"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CABIN_CASES_ASSEMBLY } from "@/lib/content/cabinCasesAssembly";
import { cn } from "@/lib/utils";

type IndustryCase = {
  case_id: string;
  title: string;
  category: string;
  scenario: string;
  roles: string[];
  focus: string;
  difficulty: number;
  emergency_level: number;
  solution: string | null;
  source: "real" | "simulation";
  meta?: Record<string, unknown>;
};

type ArchivedPlan = {
  id: string;
  case_id: string;
  title: string;
  plan: string;
  at: string;
};

const STORAGE_KEY = "qihang-industry-plans";

const categoryLabel: Record<string, string> = {
  emergency: "应急处置",
  disorder: "秩序冲突",
  care: "特殊关怀",
};

function levelLabel(n: number) {
  if (n >= 3) return "高紧急";
  if (n === 2) return "中紧急";
  return "常规";
}

function loadArchive(): ArchivedPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ArchivedPlan[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveArchive(items: ArchivedPlan[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function toIndustryCase(c: (typeof CABIN_CASES_ASSEMBLY)[number]): IndustryCase {
  return {
    case_id: c.case_id,
    title: c.title,
    category: c.category,
    scenario: c.scenario,
    roles: c.roles,
    focus: c.focus,
    difficulty: c.difficulty,
    emergency_level: c.emergency_level,
    solution: c.solution,
    source: c.source,
    meta: c.meta as unknown as Record<string, unknown>,
  };
}

export function IndustryDock() {
  const [cases, setCases] = useState<IndustryCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "emergency" | "disorder" | "care">(
    "all",
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [plan, setPlan] = useState("");
  const [archive, setArchive] = useState<ArchivedPlan[]>([]);
  const [flash, setFlash] = useState(false);
  const [entered, setEntered] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cabin/cases");
      const json = await res.json();
      const list = (json.data?.cases ?? []) as IndustryCase[];
      if (list.length > 0) {
        setCases(list);
        setActiveId((prev) => prev ?? list[0]?.case_id ?? null);
      } else {
        const fallback = CABIN_CASES_ASSEMBLY.map(toIndustryCase);
        setCases(fallback);
        setActiveId((prev) => prev ?? fallback[0]?.case_id ?? null);
      }
    } catch {
      const fallback = CABIN_CASES_ASSEMBLY.map(toIndustryCase);
      setCases(fallback);
      setActiveId((prev) => prev ?? fallback[0]?.case_id ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    setArchive(loadArchive());
    const t = window.setTimeout(() => setEntered(true), 40);
    return () => window.clearTimeout(t);
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === "all") return cases;
    return cases.filter((c) => c.category === filter);
  }, [cases, filter]);

  const active = useMemo(
    () => cases.find((c) => c.case_id === activeId) ?? filtered[0] ?? null,
    [cases, activeId, filtered],
  );

  useEffect(() => {
    if (!active) return;
    setPlan("");
  }, [active?.case_id]);

  function selectCase(id: string) {
    setActiveId(id);
  }

  function archivePlan() {
    if (!active || !plan.trim()) return;
    const next: ArchivedPlan = {
      id: `${active.case_id}-${Date.now()}`,
      case_id: active.case_id,
      title: active.title,
      plan: plan.trim(),
      at: new Date().toISOString(),
    };
    const items = [next, ...archive].slice(0, 40);
    setArchive(items);
    saveArchive(items);
    setPlan("");
    setFlash(true);
    window.setTimeout(() => setFlash(false), 1600);
  }

  const filters = [
    { id: "all" as const, label: "全部问题" },
    { id: "emergency" as const, label: "应急" },
    { id: "disorder" as const, label: "秩序" },
    { id: "care" as const, label: "关怀" },
  ];

  return (
    <div
      className={cn(
        "space-y-5 transition duration-700",
        entered ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
      )}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { k: String(cases.length || "—"), v: "行业问题条目" },
          { k: String(archive.length), v: "已沉淀预案" },
          { k: "向前", v: "讲活 · 对接岗位" },
        ].map((s, i) => (
          <div
            key={s.v}
            className="industry-stat relative overflow-hidden rounded-sm border border-[var(--glass-border)] bg-white/80 px-4 py-3"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <p className="font-display text-2xl text-[var(--orange)]">{s.k}</p>
            <p className="mt-0.5 text-[11px] text-[var(--muted)]">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-sm px-3 py-1.5 text-xs transition",
              filter === f.id
                ? "bg-gradient-to-r from-[var(--orange)] to-[var(--orange-deep)] text-white shadow-[0_6px_16px_rgba(232,120,47,0.25)]"
                : "border border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--orange)] hover:text-[var(--orange)]",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="space-y-2">
          <p className="text-[10px] tracking-[0.22em] text-[var(--orange)]">
            行业问题库 · 真实客舱案例
          </p>
          {loading ? (
            <p className="text-sm text-[var(--muted)]">载入案例…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">该分类暂无条目。</p>
          ) : (
            <ul className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
              {filtered.map((c, i) => {
                const on = c.case_id === active?.case_id;
                return (
                  <li key={c.case_id}>
                    <button
                      type="button"
                      onClick={() => selectCase(c.case_id)}
                      className={cn(
                        "industry-card w-full rounded-sm border px-3 py-3 text-left transition",
                        on
                          ? "border-[var(--orange)] bg-[var(--orange-fog)] shadow-[0_10px_28px_rgba(232,120,47,0.14)]"
                          : "border-[var(--line)] bg-white/90 hover:border-[var(--orange)]/50 hover:bg-[var(--orange-fog)]/50",
                      )}
                      style={{ animationDelay: `${Math.min(i, 8) * 55}ms` }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] tracking-wider text-[var(--orange)]">
                          {categoryLabel[c.category] ?? c.category}
                        </span>
                        <span className="text-[10px] text-[var(--muted)]">
                          {levelLabel(c.emergency_level)}
                        </span>
                        {c.source === "real" ? (
                          <span className="ml-auto text-[10px] text-[var(--orange-deep)]">
                            真案例
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 font-display text-sm text-[var(--ink)]">
                        {c.title}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className="industry-detail relative overflow-hidden rounded-sm border border-[var(--glass-border)] bg-white/90 p-4 md:p-5">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(232,120,47,0.18),transparent_70%)]"
            aria-hidden
          />
          {!active ? (
            <p className="text-sm text-[var(--muted)]">选择左侧问题开始对接。</p>
          ) : (
            <div className="relative space-y-4">
              <header className="space-y-2">
                <p className="text-[10px] tracking-[0.24em] text-[var(--orange)]">
                  情景对接 · {active.case_id}
                </p>
                <h3 className="font-display text-xl text-[var(--ink)] md:text-2xl">
                  {active.title}
                </h3>
                <p className="text-sm leading-7 text-[var(--muted)]">
                  {active.scenario}
                </p>
              </header>

              <div className="flex flex-wrap gap-2">
                {active.roles.map((r) => (
                  <span
                    key={r}
                    className="rounded-sm border border-[var(--line)] bg-[var(--orange-fog)]/60 px-2 py-0.5 text-[11px] text-[var(--ink)]"
                  >
                    {r}
                  </span>
                ))}
              </div>

              <div className="rounded-sm border border-[var(--line)] bg-[#FFF8F2]/80 px-3 py-2">
                <p className="text-[10px] tracking-[0.2em] text-[var(--orange)]">
                  价值聚焦
                </p>
                <p className="mt-1 text-sm text-[var(--ink)]">{active.focus}</p>
              </div>

              {active.solution ? (
                <details className="group rounded-sm border border-dashed border-[var(--orange)]/40 px-3 py-2">
                  <summary className="cursor-pointer text-xs text-[var(--orange-deep)]">
                    参考处置要点（教学用，先写预案再展开）
                  </summary>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {active.solution}
                  </p>
                </details>
              ) : null}

              <div className="space-y-2">
                <label className="block text-[10px] tracking-[0.2em] text-[var(--orange)]">
                  我的预案沉淀
                </label>
                <textarea
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  rows={4}
                  placeholder="按「先控风险 → 程序动作 → 安抚沟通 → 落地移交」写下你的现场预案…"
                  className="w-full resize-y rounded-sm border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)]/70 focus:border-[var(--orange)]"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    disabled={!plan.trim()}
                    onClick={archivePlan}
                  >
                    沉淀入行业问题库
                  </Button>
                  <Link
                    href="/interactive"
                    className="rounded-sm border border-[var(--line)] bg-white px-4 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--orange)] hover:text-[var(--orange)]"
                  >
                    去课中五式演练 →
                  </Link>
                  {flash ? (
                    <span className="text-xs text-[var(--orange)]">
                      已归档，可反哺答疑与课中
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {archive.length > 0 ? (
        <section className="space-y-3">
          <p className="text-[10px] tracking-[0.22em] text-[var(--orange)]">
            本机已沉淀预案 · 演示闭环
          </p>
          <ul className="grid gap-2 md:grid-cols-2">
            {archive.slice(0, 6).map((a) => (
              <li
                key={a.id}
                className="rounded-sm border border-[var(--line)] bg-white/80 px-3 py-3"
              >
                <p className="font-display text-sm text-[var(--ink)]">{a.title}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
                  {a.plan}
                </p>
                <p className="mt-2 text-[10px] text-[var(--muted)]">
                  {new Date(a.at).toLocaleString("zh-CN", {
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
