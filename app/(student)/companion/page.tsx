import { Panel } from "@/components/ui/Card";
import { CompanionChat } from "@/components/shared/CompanionChat";

export default function CompanionPage() {
  return (
    <div className="space-y-6">
      <header className="animate-rise space-y-3">
        <p className="text-[11px] tracking-[0.3em] text-[var(--orange)]">
          讲深 · 一阶 · 苏格拉底追问
        </p>
        <h1 className="font-brand text-4xl text-[var(--ink)] md:text-5xl">
          启发式答疑
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
          「人民至上 / 东航下跪」等示范问走固定脚本；其他问题由智能学伴追问。右侧检索首条固定展示习著作依据，满轮未解可转教师。
        </p>
      </header>

      <Panel
        title="与学伴对话"
        hint="左侧追问 · 右侧检索命中闪现 · 未解自动进教师队列"
      >
        <CompanionChat />
      </Panel>
    </div>
  );
}
