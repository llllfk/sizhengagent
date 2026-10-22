"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Role = "student" | "teacher" | "community";

const roles: Array<{ id: Role; label: string; hint: string; href: string }> = [
  {
    id: "student",
    label: "学生学伴",
    hint: "答疑 · 互动 · 创作",
    href: "/companion",
  },
  {
    id: "teacher",
    label: "教师工作台",
    hint: "调度 · 学情 · 周报",
    href: "/workbench",
  },
  {
    id: "community",
    label: "研讨社区",
    hint: "议题 · 精华",
    href: "/forum",
  },
];

export function LoginForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("student");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!account.trim() || !password.trim()) {
      setError("请填写账号与密码");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 720));
    const target = roles.find((r) => r.id === role)?.href ?? "/companion";
    router.push(target);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-3 gap-2">
        {roles.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRole(r.id)}
            className={cn(
              "rounded-sm border px-2 py-2.5 text-left transition duration-200",
              role === r.id
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

      <p className="text-center text-[11px] leading-relaxed text-[var(--muted)]">
        演示环境可任意账号密码登录
      </p>
    </form>
  );
}
