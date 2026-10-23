"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Account = {
  user_id: string;
  username: string;
  role: "teacher" | "student";
  display_name: string;
  student_id: string | null;
  active: boolean;
  created_at: string;
};

export function AccountManager() {
  const [list, setList] = useState<Account[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    username: "",
    password: "123456",
    display_name: "",
    role: "student" as "teacher" | "student",
    student_id: "",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/teacher/accounts");
    const json = await res.json();
    if (!res.ok) {
      setMsg(json.error || "加载失败（需教师登录）");
      setList([]);
      return;
    }
    setMsg("");
    setList(json.data ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/teacher/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          display_name: form.display_name,
          role: form.role,
          student_id: form.student_id || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "创建失败");
      setForm({
        username: "",
        password: "123456",
        display_name: "",
        role: "student",
        student_id: "",
      });
      setMsg("已创建账号");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "创建失败");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(a: Account) {
    setBusy(true);
    try {
      await fetch("/api/teacher/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: a.user_id, active: !a.active }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(a: Account) {
    const pwd = window.prompt(`重置「${a.username}」的密码`, "123456");
    if (!pwd) return;
    setBusy(true);
    try {
      const res = await fetch("/api/teacher/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: a.user_id, password: pwd }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "重置失败");
      setMsg(`已重置 ${a.username} 密码`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "重置失败");
    } finally {
      setBusy(false);
    }
  }

  async function remove(a: Account) {
    if (!window.confirm(`确认删除账号 ${a.username}？`)) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/teacher/accounts?user_id=${encodeURIComponent(a.user_id)}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "删除失败");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "删除失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-sm border border-[var(--line)] bg-white p-4">
        <p className="text-xs tracking-wider text-[var(--muted)]">新建账号</p>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded-sm border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
            placeholder="账号（如 S2026016）"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <input
            className="rounded-sm border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
            placeholder="显示姓名"
            value={form.display_name}
            onChange={(e) =>
              setForm({ ...form, display_name: e.target.value })
            }
          />
          <input
            className="rounded-sm border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
            placeholder="初始密码"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <select
            className="rounded-sm border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
            value={form.role}
            onChange={(e) =>
              setForm({
                ...form,
                role: e.target.value as "teacher" | "student",
              })
            }
          >
            <option value="student">学生</option>
            <option value="teacher">教师</option>
          </select>
          {form.role === "student" ? (
            <input
              className="rounded-sm border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--orange)] md:col-span-2"
              placeholder="学号（可与账号相同）"
              value={form.student_id}
              onChange={(e) =>
                setForm({ ...form, student_id: e.target.value })
              }
            />
          ) : null}
        </div>
        <Button type="button" disabled={busy} onClick={() => void create()}>
          创建账号
        </Button>
      </section>

      {msg ? (
        <p className="text-sm text-[var(--orange-deep)]">{msg}</p>
      ) : null}

      <ul className="space-y-2">
        {list.map((a) => (
          <li
            key={a.user_id}
            className={cn(
              "flex flex-wrap items-center justify-between gap-3 rounded-sm border bg-white px-4 py-3",
              a.active ? "border-[var(--line)]" : "border-dashed opacity-60",
            )}
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-sm px-1.5 py-0.5 text-[10px]",
                    a.role === "teacher"
                      ? "bg-[var(--orange)] text-white"
                      : "bg-[var(--orange-fog)] text-[var(--orange-deep)]",
                  )}
                >
                  {a.role === "teacher" ? "教师" : "学生"}
                </span>
                <span className="font-display text-[var(--ink)]">
                  {a.display_name}
                </span>
                <span className="text-xs text-[var(--muted)]">{a.username}</span>
                {!a.active ? (
                  <span className="text-[10px] text-[var(--vermilion)]">已停用</span>
                ) : null}
              </div>
              {a.student_id ? (
                <p className="mt-1 text-[11px] text-[var(--muted)]">
                  学号 {a.student_id}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => void toggleActive(a)}
              >
                {a.active ? "停用" : "启用"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => void resetPassword(a)}
              >
                重置密码
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => void remove(a)}
              >
                删除
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
