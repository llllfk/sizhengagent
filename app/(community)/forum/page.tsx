import { ForumBoard } from "@/components/shared/ForumBoard";

export default function ForumPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-[11px] tracking-[0.3em] text-[var(--orange)]">
          讲深 · 三阶研讨
        </p>
        <h1 className="font-brand text-4xl text-[var(--ink)] md:text-5xl">
          研讨论坛
        </h1>
        <div
          className="h-px w-24 origin-left bg-gradient-to-r from-[var(--orange)] to-transparent"
          style={{ animation: "line-draw 0.8s ease both" }}
        />
      </header>
      <ForumBoard />
    </div>
  );
}
