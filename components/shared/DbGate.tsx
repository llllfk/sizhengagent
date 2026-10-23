"use client";

import { useEffect, useState } from "react";

/** 无 DATABASE_URL / 库不可用时，不渲染业务内容 */
export function DbGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "ok" | "off">("loading");

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/health")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setState(j.data?.db === "ok" ? "ok" : "off");
      })
      .catch(() => {
        if (!cancelled) setState("off");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <p className="animate-pulse text-sm text-[var(--muted)]">
        正在连接数据库…
      </p>
    );
  }

  if (state === "off") {
    return (
      <div className="rounded-sm border border-dashed border-[var(--line)] bg-white/80 px-5 py-10 text-center">
        <p className="font-display text-lg text-[var(--ink)]">数据库未就绪</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          请配置环境变量 <code className="text-[var(--orange)]">DATABASE_URL</code>
          后刷新。未连接时不展示业务数据。
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
