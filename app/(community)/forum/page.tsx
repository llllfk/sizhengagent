import { ForumBoard } from "@/components/shared/ForumBoard";

export default function ForumPage() {
  return (
    <div className="forum-page space-y-3 md:space-y-4">
      <header className="forum-hero relative overflow-hidden rounded-sm border border-[var(--glass-border)] bg-white/80 px-5 py-3 md:px-6 md:py-3.5">
        <div className="forum-hero-glow" aria-hidden />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] tracking-[0.3em] text-[var(--orange)]">
              讲深 · 三阶研讨
            </p>
            <h1 className="font-brand text-3xl text-[var(--ink)] md:text-4xl">
              「云思坞」研讨站
            </h1>
          </div>
        </div>
      </header>
      <ForumBoard />
    </div>
  );
}
