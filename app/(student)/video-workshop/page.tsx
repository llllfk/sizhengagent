import { Panel } from "@/components/ui/Card";
import { VideoWorkshop } from "@/components/shared/VideoWorkshop";

export default function VideoWorkshopPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-[11px] tracking-[0.3em] text-[var(--orange)]">
          讲活 · 成果孵化
        </p>
        <h1 className="font-brand text-4xl text-[var(--ink)]">
          AI 短视频工坊
        </h1>
        <p className="max-w-xl text-sm text-[var(--muted)]">
          脚本 → 分镜 → 字幕 → 成片归档，四步完成可展示作品。
        </p>
      </header>
      <Panel title="创作脚手架" hint="Mock 生成，答辩可逐步点亮">
        <VideoWorkshop />
      </Panel>
    </div>
  );
}
