import Link from "next/link";
import { Panel } from "@/components/ui/Card";
import { WorkbenchStats } from "@/components/shared/WorkbenchStats";

const views = [
  {
    href: "/escalations",
    title: "转接队列",
    desc: "模块①自动转入的疑难清单，一键接受与排期",
    tag: "讲深",
  },
  {
    href: "/interactive-control",
    title: "互动调度",
    desc: "课中一键发起五式，实时进度与计分",
    tag: "讲透",
  },
  {
    href: "/analytics",
    title: "学情看板",
    desc: "班级/个人画像分布、薄弱点、任务完成率",
    tag: "画像",
  },
  {
    href: "/weekly-report",
    title: "学情周报",
    desc: "自动汇总互动与作品，生成教学建议草稿",
    tag: "周报",
  },
];

export default function WorkbenchPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-[11px] tracking-[0.3em] text-[var(--orange)]">
          中枢 · 人机协同调度
        </p>
        <h1 className="font-brand text-4xl text-[var(--ink)] md:text-5xl">
          今日课堂
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
          把教师从重复答疑中解放出来，聚焦真正需要价值引导的学生与课中五式节奏。
        </p>
      </header>

      <Panel title="实时态势" hint="Mock 指标随答疑/转接动态变化">
        <WorkbenchStats />
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        {views.map((v, i) => (
          <Link
            key={v.href}
            href={v.href}
            className="group block transition hover:-translate-y-0.5"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <Panel className="animate-rise h-full transition group-hover:border-[var(--orange)]/40 group-hover:shadow-[0_16px_40px_rgba(232,120,47,0.12)]">
              <p className="text-[10px] tracking-[0.25em] text-[var(--orange)]">
                {v.tag}
              </p>
              <h2 className="mt-2 font-display text-xl text-[var(--ink)] group-hover:text-[var(--orange)]">
                {v.title}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{v.desc}</p>
              <p className="mt-3 text-[11px] text-[var(--orange)] opacity-0 transition group-hover:opacity-100">
                进入 →
              </p>
            </Panel>
          </Link>
        ))}
      </div>
    </div>
  );
}
