"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

function PageProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [pct, setPct] = useState(0);
  const timers = useRef<number[]>([]);
  const key = `${pathname}?${searchParams?.toString() ?? ""}`;
  const first = useRef(true);

  function clearTimers() {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }

  function finish() {
    setPct(100);
    const t = window.setTimeout(() => {
      setActive(false);
      setPct(0);
    }, 240);
    timers.current.push(t);
  }

  function start() {
    clearTimers();
    setActive(true);
    setPct(8);
    timers.current.push(window.setTimeout(() => setPct(38), 60));
    timers.current.push(window.setTimeout(() => setPct(62), 220));
    timers.current.push(window.setTimeout(() => setPct(82), 520));
    timers.current.push(window.setTimeout(() => finish(), 900));
  }

  // 路由变化 → 走完进度
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    start();
    return () => clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // 点击站内链接立刻抬头，观感更跟手
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const el = (e.target as HTMLElement | null)?.closest?.("a");
      if (!el) return;
      const href = el.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
      if (el.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) return;
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        ) {
          return;
        }
      } catch {
        return;
      }
      start();
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!active && pct === 0) return null;

  return (
    <div
      className="page-progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-hidden={!active}
    >
      <div
        className="page-progress-bar"
        style={{
          width: `${pct}%`,
          opacity: active || pct > 0 ? 1 : 0,
        }}
      />
    </div>
  );
}

/** 全站顶部页面进度条（路由切换） */
export function PageProgress() {
  return (
    <Suspense fallback={null}>
      <PageProgressInner />
    </Suspense>
  );
}
