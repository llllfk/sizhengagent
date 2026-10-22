import { Panel } from "@/components/ui/Card";
import { InteractiveLive } from "@/components/shared/InteractiveLive";

const modes = [
  { id: "01", title: "客舱情景模拟", time: "8–10 分钟" },
  { id: "02", title: "一句话 AI 剧本", time: "8–10 分钟" },
  { id: "03", title: "你来比划我来猜", time: "4–5 分钟" },
  { id: "04", title: "闯关答题", time: "5–6 分钟" },
  { id: "05", title: "课堂辩论", time: "8–10 分钟" },
] as const;

export default function InteractivePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-[11px] tracking-[0.3em] text-[var(--orange)]">
          讲透 · 互动剧场
        </p>
        <h1 className="font-brand text-4xl text-[var(--ink)] md:text-5xl">
          课中五式
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
          老师发起课后，此处实时出现本场活动。可参与剧本接龙、闯关答题等。
        </p>
      </header>

      <Panel title="本场互动" hint="每 4 秒同步教师调度状态">
        <InteractiveLive />
      </Panel>

      <div className="grid gap-3 sm:grid-cols-5">
        {modes.map((m, i) => (
          <div
            key={m.id}
            className="animate-rise rounded-sm border border-[var(--line)] bg-white/80 px-3 py-3 text-center transition hover:-translate-y-0.5 hover:border-[var(--orange)]/45 hover:shadow-[0_10px_24px_rgba(232,120,47,0.12)]"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="font-display text-lg text-[var(--orange)]">{m.id}</div>
            <div className="mt-1 text-xs text-[var(--ink)]">{m.title}</div>
            <div className="mt-1 text-[10px] text-[var(--muted)]">{m.time}</div>
          </div>
        ))}
      </div>

    </div>
  );
}
