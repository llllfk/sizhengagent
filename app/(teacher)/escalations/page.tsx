import { Panel } from "@/components/ui/Card";
import { EscalationQueue } from "@/components/shared/EscalationQueue";

export default function EscalationsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-[11px] tracking-[0.3em] text-[var(--orange)]">
          讲深 · 二阶 · 疑难转接
        </p>
        <h1 className="font-brand text-4xl text-[var(--ink)] md:text-5xl">
          转接队列
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
          AI 把「真问题」送来，教师一键接受、排期专题答疑——答辩时最能体现人机协同。
        </p>
      </header>
      <Panel title="待办与流转" hint="每 8 秒自动刷新">
        <EscalationQueue />
      </Panel>
    </div>
  );
}
