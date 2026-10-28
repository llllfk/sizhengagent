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
          左侧点开个案，右侧看完整提问与学伴对话，再写在线答复或排期专题答疑。
        </p>
      </header>
      <Panel title="待办与流转" hint="在线答复会同步到学生学伴">
        <EscalationQueue />
      </Panel>
    </div>
  );
}
