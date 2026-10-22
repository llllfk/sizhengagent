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
          一键发起五式 · 实时看参与人数 · AI 异常时可结束本场降级处理
        </p>
      </header>
      <Panel title="发起与监控" hint="推荐先发起「剧本」或「闯关」">
        <InteractiveControl />
      </Panel>
    </div>
  );
}
