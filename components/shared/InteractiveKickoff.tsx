"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type KickoffRoom = {
  room_id: string;
  mode: string;
  title: string;
  theme: string;
  cabin_case?: {
    title: string;
    scenario: string;
    focus?: string;
  };
  wordcard?: { term: string; hint: string };
  debate_background?: string;
};

const MODE_EYEBROW: Record<string, string> = {
  cabin: "课中五式 · 01 客舱情景",
  script: "课中五式 · 02 AI剧本",
  wordcard: "课中五式 · 03 你比我猜",
  quiz: "课中五式 · 04 闯关答题",
  debate: "课中五式 · 05 课堂辩论",
};

function storageKey(id: string) {
  return `qihang-kickoff-${id}`;
}

function buildBody(room: KickoffRoom) {
  if (room.mode === "cabin" && room.cabin_case) {
    return {
      headline: room.cabin_case.title,
      detail: room.cabin_case.scenario,
      focus: room.cabin_case.focus,
    };
  }
  if (room.mode === "wordcard" && room.wordcard) {
    return {
      headline: room.wordcard.term,
      detail: room.wordcard.hint || "按老师指令比划或描述",
      focus: undefined as string | undefined,
    };
  }
  if (room.mode === "debate" && room.debate_background) {
    const line = room.debate_background.split("\n").find((l) => l.trim());
    return {
      headline: room.title,
      detail: line?.slice(0, 120) || room.theme,
      focus: undefined as string | undefined,
    };
  }
  return {
    headline: room.title,
    detail: room.theme,
    focus: undefined as string | undefined,
  };
}

type Phase = "count" | "board" | "done";

/**
 * 全班同屏开场：3-2-1 → 题面/情景板 → 进入互动。
 * playToken 变化时触发；教师端每次发起可传 Date.now() 强制重播。
 */
export function InteractiveKickoff({
  room,
  playToken,
  onDone,
}: {
  room: KickoffRoom | null;
  playToken: string | null;
  onDone?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("done");
  const [count, setCount] = useState(3);
  const lastToken = useRef<string | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const body = useMemo(() => (room ? buildBody(room) : null), [room]);

  useEffect(() => {
    if (!room || !playToken) return;
    if (lastToken.current === playToken) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const force = playToken.includes(":force:");
    const seen =
      !force &&
      typeof window !== "undefined" &&
      window.sessionStorage.getItem(storageKey(room.room_id)) === "1";

    lastToken.current = playToken;

    if (seen || reduce) {
      setPhase("done");
      onDoneRef.current?.();
      return;
    }

    setPhase("count");
    setCount(3);

    const timers: number[] = [];
    timers.push(window.setTimeout(() => setCount(2), 750));
    timers.push(window.setTimeout(() => setCount(1), 1500));
    timers.push(window.setTimeout(() => setPhase("board"), 2250));
    timers.push(
      window.setTimeout(() => {
        window.sessionStorage.setItem(storageKey(room.room_id), "1");
        setPhase("done");
        onDoneRef.current?.();
      }, 4200),
    );

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [room, playToken]);

  function skip() {
    if (!room || phase === "done") return;
    window.sessionStorage.setItem(storageKey(room.room_id), "1");
    setPhase("done");
    onDoneRef.current?.();
  }

  if (!room || !playToken || phase === "done" || !body) return null;

  return (
    <div
      className={cn(
        "kickoff-stage fixed inset-0 z-[80] flex cursor-pointer flex-col items-center justify-center overflow-hidden",
        phase === "board" && "kickoff-stage-board",
      )}
      onClick={skip}
      role="presentation"
      aria-live="polite"
    >
      <div className="kickoff-glow" aria-hidden />
      <div className="kickoff-rays" aria-hidden />

      {phase === "count" ? (
        <div key={count} className="kickoff-count relative z-10">
          <p className="mb-4 text-[11px] tracking-[0.45em] text-[var(--orange)]">
            全班同屏 · 即将开场
          </p>
          <div className="font-display text-[7rem] leading-none text-[var(--orange)] md:text-[9rem]">
            {count}
          </div>
        </div>
      ) : (
        <div className="kickoff-board relative z-10 mx-auto max-w-3xl px-6 text-center">
          <p className="text-[11px] tracking-[0.35em] text-[var(--orange)]">
            {MODE_EYEBROW[room.mode] ?? "课中五式"}
          </p>
          <h2 className="mt-4 font-brand text-5xl text-[var(--ink)] md:text-6xl">
            {body.headline}
          </h2>
          <div className="mx-auto mt-5 h-px w-24 bg-gradient-to-r from-transparent via-[var(--orange)] to-transparent" />
          <p className="mt-5 text-base leading-8 text-[var(--muted)] md:text-lg">
            {body.detail}
          </p>
          {body.focus ? (
            <p className="mt-4 text-sm text-[var(--orange-deep)]">
              聚焦：{body.focus}
            </p>
          ) : null}
          <p className="mt-8 font-display text-sm tracking-[0.28em] text-[var(--ink)]">
            人机同飞 · 开始
          </p>
        </div>
      )}

      <p className="absolute bottom-8 z-10 text-[10px] tracking-[0.22em] text-[var(--muted)]">
        点击跳过
      </p>
    </div>
  );
}
