import { Panel } from "@/components/ui/Card";
import { AnalyticsDashboard } from "@/components/shared/AnalyticsDashboard";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-[11px] tracking-[0.3em] text-[var(--orange)]">
          学情 · 看板
        </p>
        <h1 className="font-brand text-4xl text-[var(--ink)]">学情看板</h1>
        <p className="max-w-xl text-sm text-[var(--muted)]">
          画像分布、任务完成、薄弱点与学员明细——答辩大屏可视化。
        </p>
      </header>
      <Panel title="班级全景">
        <AnalyticsDashboard />
      </Panel>
    </div>
  );
}
