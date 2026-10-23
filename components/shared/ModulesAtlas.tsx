"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Mod = {
  no: string;
  title: string;
  blurb: string;
  ring: "deep" | "through" | "alive";
  href: string;
  teacherHref?: string;
};

const MODULES: Mod[] = [
  {
    no: "①",
    title: "启发式答疑",
    blurb: "苏格拉底追问 · 24h",
    ring: "deep",
    href: "/companion",
  },
  {
    no: "②",
    title: "教师专题答疑",
    blurb: "疑难转接 · 排期",
    ring: "deep",
    href: "/escalations",
    teacherHref: "/escalations",
  },
  {
    no: "③",
    title: "论坛研讨聚合",
    blurb: "议题碰撞 · 精华回灌",
    ring: "deep",
    href: "/forum",
  },
  {
    no: "④",
    title: "学情画像引擎",
    blurb: "三型灯牌 · 雷达",
    ring: "through",
    href: "/profile",
    teacherHref: "/analytics",
  },
  {
    no: "⑤",
    title: "互动剧场五式",
    blurb: "课中同屏开场",
    ring: "through",
    href: "/interactive",
    teacherHref: "/interactive-control",
  },
  {
    no: "⑥",
    title: "分层任务中心",
    blurb: "按画像推送",
    ring: "through",
    href: "/tasks",
  },
  {
    no: "⑦",
    title: "行业问题对接",
    blurb: "客舱案例 · 预案",
    ring: "alive",
    href: "/industry",
  },
  {
    no: "⑧",
    title: "成果孵化转化",
    blurb: "工坊 · 成果库",
    ring: "alive",
    href: "/works",
    teacherHref: "/works",
  },
];

const RING_META = {
  deep: {
    label: "讲深",
    sub: "三阶答疑闭环",
    flow: "① → ② → ③",
  },
  through: {
    label: "讲透",
    sub: "画像 · 课中 · 课后",
    flow: "④ · ⑤ · ⑥",
  },
  alive: {
    label: "讲活",
    sub: "向前岗位 · 向后成果",
    flow: "⑦ · ⑧",
  },
} as const;

function resolveHref(m: Mod, isTeacher: boolean) {
  if (isTeacher && m.teacherHref) return m.teacherHref;
  return m.href;
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ModulesAtlas({ isTeacher = false }: { isTeacher?: boolean }) {
  const pathname = usePathname();
  const [hover, setHover] = useState<string | null>(null);

  const activeNo = useMemo(() => {
    for (const m of MODULES) {
      const href = resolveHref(m, isTeacher);
      if (isActivePath(pathname, href)) return m.no;
    }
    if (pathname.startsWith("/workbench")) return "中枢";
    if (pathname.startsWith("/video-workshop")) return "⑧";
    if (pathname.startsWith("/highlights")) return "③";
    return null;
  }, [pathname, isTeacher]);

  const rings = ["deep", "through", "alive"] as const;

  return (
    <div className="modules-atlas space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[11px] tracking-[0.3em] text-[var(--orange)]">
            能力层 · 八模块总览
          </p>
          <h1 className="font-brand text-4xl text-[var(--ink)] md:text-5xl">
            三环八维
          </h1>
          <p className="max-w-xl text-sm leading-7 text-[var(--muted)]">
            讲深 · 讲透 · 讲活 — 点击模块进入；连线讲述①→②→③人机协同。
          </p>
        </div>
        <Link
          href={isTeacher ? "/workbench" : "/companion"}
          className="modules-hub-chip rounded-sm border border-[var(--orange)]/40 bg-gradient-to-r from-[var(--orange-fog)] to-white px-4 py-2.5 text-sm text-[var(--orange-deep)] shadow-[0_10px_28px_rgba(232,120,47,0.14)] transition hover:-translate-y-0.5"
        >
          {isTeacher ? "返回指挥舱 →" : "返回学伴 →"}
        </Link>
      </header>

      {/* 中枢 + 三环 */}
      <div className="modules-stage relative overflow-hidden rounded-sm border border-[var(--glass-border)] bg-white/80 p-4 md:p-6">
        <div className="modules-stage-glow" aria-hidden />
        <svg
          className="modules-flow-svg pointer-events-none absolute inset-x-[8%] top-[7.5rem] hidden h-16 w-[84%] md:block"
          viewBox="0 0 100 20"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            className="modules-flow-path"
            d="M 8 10 C 30 10, 35 10, 50 10 S 70 10, 92 10"
            fill="none"
            stroke="rgba(232,120,47,0.45)"
            strokeWidth="0.6"
            strokeDasharray="3 2.5"
          />
        </svg>

        <div className="relative z-10 mb-5 flex justify-center">
          <Link
            href={isTeacher ? "/workbench" : "/companion"}
            onMouseEnter={() => setHover("hub")}
            onMouseLeave={() => setHover(null)}
            className={cn(
              "modules-hub group relative overflow-hidden rounded-sm border px-6 py-4 text-center transition",
              activeNo === "中枢" || hover === "hub"
                ? "border-[var(--orange)] bg-gradient-to-b from-[var(--orange)] to-[var(--orange-deep)] text-white shadow-[0_16px_40px_rgba(232,120,47,0.35)]"
                : "border-[var(--orange)]/35 bg-gradient-to-b from-white to-[var(--orange-fog)] text-[var(--ink)] hover:border-[var(--orange)]",
            )}
          >
            <span className="modules-hub-pulse" aria-hidden />
            <p className="text-[10px] tracking-[0.32em] opacity-80">中枢</p>
            <p className="mt-1 font-display text-xl md:text-2xl">
              教师智能工作台
            </p>
            <p
              className={cn(
                "mt-1 text-[11px]",
                activeNo === "中枢" || hover === "hub"
                  ? "text-white/80"
                  : "text-[var(--muted)]",
              )}
            >
              贯穿讲深 · 讲透 · 讲活
            </p>
          </Link>
        </div>

        <div className="relative z-10 grid gap-4 lg:grid-cols-3">
          {rings.map((ring) => {
            const meta = RING_META[ring];
            const mods = MODULES.filter((m) => m.ring === ring);
            return (
              <section
                key={ring}
                className={cn(
                  "modules-ring rounded-sm border p-3 md:p-4",
                  ring === "deep" && "modules-ring-deep",
                  ring === "through" && "modules-ring-through",
                  ring === "alive" && "modules-ring-alive",
                )}
              >
                <header className="mb-3 flex items-baseline justify-between gap-2 border-b border-[var(--line)] pb-2">
                  <div>
                    <p className="font-brand text-2xl text-[var(--orange)]">
                      {meta.label}
                    </p>
                    <p className="text-[11px] text-[var(--muted)]">{meta.sub}</p>
                  </div>
                  <p className="text-[10px] tracking-wider text-[var(--orange-deep)]">
                    {meta.flow}
                  </p>
                </header>

                <div
                  className={cn(
                    "grid gap-2",
                    ring === "alive" ? "sm:grid-cols-1" : "grid-cols-1",
                  )}
                >
                  {mods.map((m, i) => {
                    const href = resolveHref(m, isTeacher);
                    const on =
                      activeNo === m.no ||
                      hover === m.no ||
                      isActivePath(pathname, href);
                    return (
                      <div key={m.no} className="relative">
                        <Link
                          href={href}
                          onMouseEnter={() => setHover(m.no)}
                          onMouseLeave={() => setHover(null)}
                          className={cn(
                            "modules-node group flex items-start gap-3 rounded-sm border px-3 py-3 transition",
                            on
                              ? "modules-node-on border-[var(--orange)] bg-[var(--orange-fog)] shadow-[0_12px_28px_rgba(232,120,47,0.18)]"
                              : "border-[var(--line)] bg-white/95 hover:border-[var(--orange)]/50 hover:bg-[var(--orange-fog)]/40",
                          )}
                          style={{
                            animationDelay: `${i * 80 + (ring === "deep" ? 0 : ring === "through" ? 120 : 220)}ms`,
                          }}
                        >
                          <span
                            className={cn(
                              "font-display text-2xl leading-none",
                              on
                                ? "text-[var(--orange)]"
                                : "text-[var(--orange-soft)] group-hover:text-[var(--orange)]",
                            )}
                          >
                            {m.no}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-display text-base text-[var(--ink)] group-hover:text-[var(--orange-deep)]">
                              {m.title}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
                              {m.blurb}
                            </span>
                          </span>
                          <span
                            className={cn(
                              "mt-1 text-[10px] transition",
                              on
                                ? "text-[var(--orange)] opacity-100"
                                : "text-[var(--muted)] opacity-0 group-hover:opacity-100",
                            )}
                          >
                            进入
                          </span>
                        </Link>
                        {ring === "deep" && i < mods.length - 1 ? (
                          <div
                            className="modules-chain my-1 flex justify-center"
                            aria-hidden
                          >
                            <span className="modules-chain-dot" />
                            <span className="modules-chain-line" />
                            <span className="modules-chain-dot" />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <p className="relative z-10 mt-5 text-center text-[11px] leading-6 text-[var(--muted)]">
          答辩叙事：学生提问经①答疑 → 未解进②专题 → 共性进③论坛回灌；④⑤⑥讲透课堂；⑦⑧讲活岗位与成果。
        </p>
      </div>
    </div>
  );
}
