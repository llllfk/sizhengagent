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
      </header>

      <Panel title="与学伴对话">
        <CompanionChat />
      </Panel>
    </div>
  );
}
