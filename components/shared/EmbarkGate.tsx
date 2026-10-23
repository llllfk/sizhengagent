"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { writeTabPortal, type TabPortal } from "@/lib/auth/portalClient";
import { cn } from "@/lib/utils";

const PORTAL_LINE: Record<string, string> = {
  student: "智能学伴 · 每一位都被听见",
  teacher: "教师工作台 · 人机协同调度",
  community: "研讨社区 · 观点碰撞回灌",
};

const SAFE_PREFIXES = [
  "/companion",
  "/workbench",
  "/forum",
  "/interactive",
  "/tasks",
  "/industry",
  "/video-workshop",
  "/works",
  "/profile",
  "/escalations",
  "/interactive-control",
  "/analytics",
  "/weekly-report",
  "/accounts",
  "/highlights",
  "/modules",
];

function safeNext(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/companion";
  if (SAFE_PREFIXES.some((p) => raw === p || raw.startsWith(`${p}/`))) {
    return raw;
  }
  return "/companion";
}

export function EmbarkGate({
  next,
  portal,
}: {
  next: string;
  portal: string;
}) {
  const router = useRouter();
  const href = useMemo(() => safeNext(next), [next]);
  const line = PORTAL_LINE[portal] ?? PORTAL_LINE.student;
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (portal === "student" || portal === "teacher" || portal === "community") {
      writeTabPortal(portal as TabPortal);
    }

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      router.replace(href);
      return;
    }

    const tHold = window.setTimeout(() => setPhase("hold"), 480);
    const tOut = window.setTimeout(() => setPhase("out"), 1680);
    const tGo = window.setTimeout(() => {
      setGone(true);
      router.replace(href);
    }, 2100);

    return () => {
      window.clearTimeout(tHold);
      window.clearTimeout(tOut);
      window.clearTimeout(tGo);
    };
  }, [href, router]);

  function skip() {
    if (gone) return;
    setGone(true);
    router.replace(href);
  }

  return (
    <main
      className={cn(
        "embark-stage relative flex min-h-dvh w-full cursor-pointer flex-col items-center justify-center overflow-hidden",
        phase === "out" && "embark-stage-out",
      )}
      onClick={skip}
      role="presentation"
    >
      <div className="embark-glow embark-glow-a" aria-hidden />
      <div className="embark-glow embark-glow-b" aria-hidden />
      <div className="embark-rays" aria-hidden />
      <div className="embark-vignette" aria-hidden />

      <div
        className={cn(
          "embark-core relative z-10 flex flex-col items-center px-6 text-center",
          phase === "in" && "embark-core-in",
          phase === "hold" && "embark-core-hold",
          phase === "out" && "embark-core-out",
        )}
      >
        <p className="embark-eyebrow mb-4 text-[10px] tracking-[0.5em] text-[var(--orange)] md:text-[11px]">
          QI HANG · TAKEOFF
        </p>
        <h1 className="embark-brand font-brand gold-shimmer-text text-[4.5rem] leading-none text-[var(--ink)] md:text-[6.5rem]">
          启航
        </h1>
        <div className="embark-rule mx-auto mt-6 h-px w-0 bg-gradient-to-r from-transparent via-[var(--orange)] to-transparent" />
        <p className="embark-tagline mt-5 font-display text-base tracking-[0.28em] text-[var(--ink)] md:text-xl">
          人机同飞
        </p>
        <p className="embark-sub mt-2 text-xs text-[var(--muted)] md:text-sm">
          {line}
        </p>
      </div>

      <p className="embark-hint absolute bottom-8 z-10 text-[10px] tracking-[0.22em] text-[var(--muted)]">
        点击跳过 · 即将进入课堂
      </p>
    </main>
  );
}
