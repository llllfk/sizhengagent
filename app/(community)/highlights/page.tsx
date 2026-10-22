import { HighlightsGallery } from "@/components/shared/HighlightsGallery";

export default function HighlightsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-[11px] tracking-[0.3em] text-[var(--orange)]">
          精华沉淀 · 回灌学伴
        </p>
        <h1 className="font-brand text-4xl text-[var(--ink)] md:text-5xl">
          精华集
        </h1>
        <div
          className="h-px w-24 origin-left bg-gradient-to-r from-[var(--orange)] to-transparent"
          style={{ animation: "line-draw 0.8s ease both" }}
        />
      </header>
      <HighlightsGallery />
    </div>
  );
}
