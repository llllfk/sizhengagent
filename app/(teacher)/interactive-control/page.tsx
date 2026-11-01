import { Panel } from "@/components/ui/Card";
import { InteractiveControl } from "@/components/shared/InteractiveControl";

export default function InteractiveControlPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-[11px] tracking-[0.3em] text-[var(--orange)]">
          讲透 · 课中调度
        </p>
        <h1 className="font-brand text-4xl text-[var(--ink)]">互动调度台</h1>
        <p className="max-w-xl text-sm text-[var(--muted)]">
          一键发起 · 同屏看学员互动 · 教师也可直接参与，无需再切学生账号
        </p>
      </header>
      <Panel title="发起与同屏互动">
        <InteractiveControl />
      </Panel>
    </div>
  );
}
