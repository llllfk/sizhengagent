import { Panel } from "@/components/ui/Card";
import { TaskCenter } from "@/components/shared/TaskCenter";

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-[11px] tracking-[0.3em] text-[var(--orange)]">
          讲透 · 课后分层
        </p>
        <h1 className="font-brand text-4xl text-[var(--ink)]">分层任务</h1>
        <p className="max-w-xl text-sm text-[var(--muted)]">
          表达型→街头采访 · 创作型→微电影/AI短视频 · 体验型→行走的思政课
        </p>
      </header>
      <Panel title="我的任务" hint="按画像自动分发 · 可推进进度">
        <TaskCenter />
      </Panel>
    </div>
  );
}
