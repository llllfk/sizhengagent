import { Panel } from "@/components/ui/Card";
import { WeeklyReportPanel } from "@/components/shared/WeeklyReportPanel";

export default function WeeklyReportPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-[11px] tracking-[0.3em] text-[var(--orange)]">
          学情 · 周报
        </p>
        <h1 className="font-brand text-4xl text-[var(--ink)]">学情周报</h1>
        <p className="max-w-xl text-sm text-[var(--muted)]">
          系统生成教学建议草稿，教师确认后发布。
        </p>
      </header>
      <Panel title="本周草稿">
        <WeeklyReportPanel />
      </Panel>
    </div>
  );
}
