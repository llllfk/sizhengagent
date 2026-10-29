"use client";

import { useEffect, useState } from "react";

type DbState = "loading" | "ok" | "off";

/** 跨路由复用，避免 PortalShell 重挂时每次卡住 */
let healthCache: { state: Exclude<DbState, "loading">; at: number } | null =
  null;
const HEALTH_TTL_MS = 5 * 60_000;
let healthInflight: Promise<Exclude<DbState, "loading">> | null = null;

function probeHealth(): Promise<Exclude<DbState, "loading">> {
  if (healthCache && Date.now() - healthCache.at < HEALTH_TTL_MS) {
    return Promise.resolve(healthCache.state);
  }
  if (healthInflight) return healthInflight;
  healthInflight = fetch("/api/health", { credentials: "include" })
    .then((r) => r.json())
    .then((j) => {
      const next: Exclude<DbState, "loading"> =
        j.data?.db === "ok" ? "ok" : "off";
      healthCache = { state: next, at: Date.now() };
      return next;
    })
    .catch(() => {
      const next: Exclude<DbState, "loading"> = "off";
      healthCache = { state: next, at: Date.now() };
      return next;
    })
    .finally(() => {
      healthInflight = null;
    });
  return healthInflight;
}

/**
 * 库探活门闸。
 * 探活中先渲染业务（八模块等静态页不必干等）；确认不可用再提示。
 */
export function DbGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DbState>(() => {
    if (healthCache && Date.now() - healthCache.at < HEALTH_TTL_MS) {
      return healthCache.state;
    }
    return "loading";
  });

  useEffect(() => {
    let cancelled = false;
    void probeHealth().then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
