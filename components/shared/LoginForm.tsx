"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { writeTabPortal } from "@/lib/auth/portalClient";
import { cn } from "@/lib/utils";

type Portal = "student" | "teacher" | "community";

const portals: Array<{
  id: Portal;
  label: string;
  hint: string;
}> = [
  { id: "student", label: "学生学伴", hint: "答疑 · 互动 · 创作" },
  { id: "teacher", label: "教师工作台", hint: "调度 · 学情 · 账号" },
  { id: "community", label: "研讨社区", hint: "议题 · 精华" },
];

const DEMO_ACCOUNTS = [
  { portal: "teacher" as const, user: "T001", pass: "123456", name: "李老师" },
  {
    portal: "student" as const,
    user: "S2026001",
    pass: "123456",
    name: "林晓航",
  },
  {
    portal: "student" as const,
    user: "S2026008",
    pass: "123456",
    name: "陈思远",
  },
];

const SAFE_NEXT = [
  "/companion",
  "/workbench",
  "/forum",
  "/interactive",
  "/tasks",
  "/industry",
  "/video-workshop",
  "/works",
  "/profile",
  "/modules",
  "/escalations",
  "/interactive-control",
  "/analytics",
  "/weekly-report",
  "/accounts",
  "/highlights",
];

function safeNext(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  if (SAFE_NEXT.some((p) => raw === p || raw.startsWith(`${p}/`))) return raw;
  return null;
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const [portal, setPortal] = useState<Portal>("student");
  const [account, setAccount] = useState("S2026001");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const p = searchParams.get("portal");
    if (p === "student" || p === "teacher" || p === "community") {
      setPortal(p);
      if (p === "teacher") {
        setAccount("T001");
      } else if (p === "student") {
        setAccount("S2026001");
      }
    }
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!account.trim() || !password.trim()) {
      setError("请填写账号与密码");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: account.trim(),
          password,
          portal,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "登录失败");
      writeTabPortal(portal);
      const dest =
        safeNext(searchParams.get("next")) ||
        String(json.data.href || "/companion");
      // 整页跳转，确保随后请求带上刚写入的 Set-Cookie
      window.location.assign(
        `/embark?to=${encodeURIComponent(dest)}&portal=${encodeURIComponent(portal)}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(row: (typeof DEMO_ACCOUNTS)[number]) {
    setPortal(row.portal === "teacher" ? "teacher" : "student");
    setAccount(row.user);
    setPassword(row.pass);
    setError("");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-3 gap-2">
        {portals.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setPortal(r.id)}
            className={cn(
              "rounded-sm border px-2 py-2.5 text-left transition duration-200",
              portal === r.id
                ? "border-[var(--orange)] bg-[var(--orange-fog)] text-[var(--orange-deep)] shadow-[0_0_16px_rgba(232,120,47,0.18)]"
                : "border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--orange-soft)]",
            )}
          >
            <div className="text-xs font-medium tracking-wide">{r.label}</div>
            <div className="mt-0.5 text-[10px] opacity-70">{r.hint}</div>
          </button>
        ))}
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs tracking-widest text-[var(--muted)]">账号</span>
        <input
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          className="w-full rounded-sm border border-[var(--line)] bg-[var(--paper)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)]/50 focus:border-[var(--orange)] focus:shadow-[0_0_0_3px_rgba(232,120,47,0.12)]"
          placeholder="工号 / 学号"
          autoComplete="username"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs tracking-widest text-[var(--muted)]">密码</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-sm border border-[var(--line)] bg-[var(--paper)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)]/50 focus:border-[var(--orange)] focus:shadow-[0_0_0_3px_rgba(232,120,47,0.12)]"
          placeholder="请输入密码"
          autoComplete="current-password"
        />
      </label>

      {error ? (
        <p className="text-xs text-[var(--vermilion)]" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="login-btn w-full rounded-sm py-3 text-sm font-semibold tracking-[0.18em] text-white disabled:cursor-wait disabled:opacity-80"
        style={{
          background:
            "linear-gradient(105deg, #f6c79a 0%, #e8782f 45%, #c45c1a 100%)",
        }}
      >
        <span className="relative z-10 inline-flex items-center justify-center gap-2">
          {loading ? (
            <>
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              启航中…
            </>
          ) : (
            "进入课堂"
          )}
        </span>
      </button>

      <div className="space-y-2 border-t border-[var(--line)] pt-3">
        <p className="text-[10px] tracking-[0.2em] text-[var(--muted)]">
          测试账号（密码均为 123456）
        </p>
        <div className="flex flex-col gap-1.5">
          {DEMO_ACCOUNTS.map((d) => (
            <button
              key={d.user}
              type="button"
              onClick={() => fillDemo(d)}
              className="rounded-sm border border-dashed border-[var(--line)] bg-white px-2.5 py-1.5 text-left text-[11px] text-[var(--ink)] transition hover:border-[var(--orange)] hover:bg-[var(--orange-fog)]"
            >
              <span className="text-[var(--orange-deep)]">
                {d.portal === "teacher" ? "教师" : "学生"}
              </span>
              {" · "}
              {d.name}（{d.user}）
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
