"use client";

import { useEffect, useState } from "react";

export function LoginReveal() {
  const [phase, setPhase] = useState<"hold" | "open" | "done">("hold");

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPhase("done");
      return;
    }
    // 首页开场幕：静置后拉开，动画 1.5s
    const t1 = window.setTimeout(() => setPhase("open"), 400);
    const t2 = window.setTimeout(() => setPhase("done"), 1900);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  if (phase === "done") return null;

  const opening = phase === "open";

  return (
    <div className="pointer-events-none fixed inset-0 z-50" aria-hidden>
      <div
        className={`absolute inset-y-0 left-0 w-1/2 bg-[#fff4ea] transition-transform duration-[1500ms] ease-[cubic-bezier(0.65,0,0.35,1)] ${
          opening ? "-translate-x-full" : "translate-x-0"
        }`}
        style={{ boxShadow: "inset -24px 0 48px rgba(232,120,47,0.12)" }}
      />
      <div
        className={`absolute inset-y-0 right-0 w-1/2 bg-[#fff4ea] transition-transform duration-[1500ms] ease-[cubic-bezier(0.65,0,0.35,1)] ${
          opening ? "translate-x-full" : "translate-x-0"
        }`}
        style={{ boxShadow: "inset 24px 0 48px rgba(232,120,47,0.12)" }}
      />
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-500 ${
          opening ? "opacity-0" : "opacity-100"
        }`}
      >
        <p className="mb-3 text-[10px] tracking-[0.45em] text-[var(--orange)]">
          QI HANG
        </p>
        <div className="font-brand gold-shimmer-text text-5xl md:text-6xl">
          启航
        </div>
        <div className="mx-auto mt-5 h-px w-28 bg-gradient-to-r from-transparent via-[var(--orange)] to-transparent" />
        <p className="mt-4 font-display text-sm tracking-widest text-[var(--muted)]">
          智能学伴 · 思政入云
        </p>
      </div>
    </div>
  );
}
