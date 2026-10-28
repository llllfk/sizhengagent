import { ForumBoard } from "@/components/shared/ForumBoard";

export default function ForumPage() {
  return (
    <div className="forum-page space-y-4 md:space-y-5">
      <header className="forum-hero relative overflow-hidden rounded-sm border border-[var(--glass-border)] bg-white/80 px-5 py-4 md:px-6 md:py-5">
        <div className="forum-hero-glow" aria-hidden />
        <div className="relative z-10 space-y-2">
          <p className="text-[11px] tracking-[0.3em] text-[var(--orange)]">
            讲深 · 三阶研讨
          </p>
          <h1 className="font-brand text-3xl text-[var(--ink)] md:text-4xl">
            研讨论坛
          </h1>
          <p className="max-w-xl text-sm text-[var(--muted)]">
            左轨选题 · 右舱跟帖。讨论串在舱内滚动，整页不再被撑长。
          </p>
        </div>
      </header>
      <ForumBoard />
    </div>
  );
}
