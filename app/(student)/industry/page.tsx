import { Panel } from "@/components/ui/Card";
import { IndustryDock } from "@/components/shared/IndustryDock";

export default function IndustryPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="animate-rise text-[11px] tracking-[0.3em] text-[var(--orange)]">
          讲活 · 向前 · 模块⑦
        </p>
        <h1 className="animate-rise-delay-1 font-brand text-4xl text-[var(--ink)] md:text-5xl">
          行业问题对接
        </h1>
        <p className="animate-rise-delay-2 max-w-2xl text-sm leading-7 text-[var(--muted)]">
          以真实客舱案例接通岗位现场：选问题、写预案、沉淀进行业问题库，再回流课中五式与答疑。
        </p>
      </header>

      <Panel
        className="animate-rise-delay-3"
        title="问题库 × 预案沉淀"
        hint="案例来自客舱案例库 · 演练记录可反哺教学闭环"
      >
        <IndustryDock />
      </Panel>
    </div>
  );
}
