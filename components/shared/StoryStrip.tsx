"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type StoryStep = {
  href: string;
  label: string;
  tip: string;
};

const studentStory: StoryStep[] = [
  { href: "/modules", label: "总览", tip: "八模块地图" },
  { href: "/companion", label: "答疑", tip: "苏格拉底追问" },
  { href: "/interactive", label: "五式", tip: "课中剧场" },
  { href: "/tasks", label: "任务", tip: "分层练" },
  { href: "/industry", label: "行业", tip: "问题对接" },
  { href: "/video-workshop", label: "短视频", tip: "AI 工坊" },
  { href: "/works", label: "成果库", tip: "成片墙" },
];

const teacherStory: StoryStep[] = [
  { href: "/modules", label: "总览", tip: "八模块地图" },
  { href: "/workbench", label: "中枢", tip: "今日课堂" },
  { href: "/escalations", label: "转接", tip: "疑难队列" },
  { href: "/interactive-control", label: "调度", tip: "一键五式" },
  { href: "/works", label: "成果库", tip: "成片墙" },
  { href: "/analytics", label: "看板", tip: "学情" },
  { href: "/weekly-report", label: "周报", tip: "建议草稿" },
  { href: "/classes", label: "班级", tip: "班级管理" },
  { href: "/accounts", label: "账号", tip: "账号管理" },
];

const communityStory: StoryStep[] = [
  { href: "/forum", label: "论坛", tip: "观点碰撞" },
  { href: "/highlights", label: "精华", tip: "回灌学伴" },
];

export function StoryStrip({
  tone,
}: {
  tone: "student" | "teacher" | "community";
}) {
  const pathname = usePathname();
  const steps =
    tone === "student"
      ? studentStory
      : tone === "teacher"
        ? teacherStory
        : communityStory;

  return (
    <nav
      aria-label="学习路径"
      className="mb-5 flex flex-wrap items-center gap-1.5 rounded-sm border border-[var(--line)] bg-white/70 px-3 py-2 backdrop-blur-sm"
    >
      <span className="mr-1 text-xs font-bold tracking-[0.18em] text-[var(--orange)]">
        学习路径
      </span>
      {steps.map((s, i) => {
        const active =
          pathname === s.href || pathname.startsWith(`${s.href}/`);
        return (
          <span key={s.href} className="flex items-center gap-1.5">
            {i > 0 ? (
              <span className="text-[10px] text-[var(--line)]" aria-hidden>
                →
              </span>
            ) : null}
            <Link
              href={s.href}
              className={cn(
                "rounded-sm px-2.5 py-1.5 text-sm font-semibold transition",
                active
                  ? "bg-gradient-to-r from-[var(--orange)] to-[var(--orange-deep)] text-white shadow-[0_4px_14px_rgba(232,120,47,0.28)]"
                  : "text-[var(--muted)] hover:bg-[var(--orange-fog)] hover:text-[var(--orange-deep)]",
              )}
              title={s.tip}
            >
              {s.label}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
