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
          三型灯牌 + 班级雷达，一张图讲清因材施教。
        </p>
      </header>
      <AnalyticsDashboard />
    </div>
  );
}
