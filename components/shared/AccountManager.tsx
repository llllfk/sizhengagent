"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/components/shared/useSession";
import { WorksArchiveList } from "@/components/shared/WorksArchiveList";
import { cn } from "@/lib/utils";
import { TYPE_LABEL, TYPE_TAGS } from "@/lib/content/typeTags";
import type { ClassGroup } from "@/types";

type Account = {
  user_id: string;
  username: string;
  role: "teacher" | "student";
  display_name: string;
  student_id: string | null;
  class_id: string | null;
  class_name: string | null;
  class_code: string | null;
  last_login_at: string | null;
  login_count: number;
  active: boolean;
  created_at: string;
};

type LoginEvent = {
  event_id: string;
  logged_at: string;
  portal: string | null;
};

function formatLoginAt(iso: string | null | undefined) {
  if (!iso) return "尚未登录";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "尚未登录";
  return d.toLocaleString("zh-CN", {
    hour12: false,
    timeZone: "Asia/Shanghai",
  });
}

const PORTAL_LABEL: Record<string, string> = {
  student: "学生学伴",
  teacher: "教师工作台",
  community: "研讨社区",
};

const PAGE_SIZE = 20;

export function AccountManager() {
  const { user: me, refresh } = useSession();
  const [list, setList] = useState<Account[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [logUserId, setLogUserId] = useState<string | null>(null);
  const [logItems, setLogItems] = useState<LoginEvent[]>([]);
  const [logBusy, setLogBusy] = useState(false);
  const [worksStudentId, setWorksStudentId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    username: "",
    display_name: "",
  });
  const [selfDraft, setSelfDraft] = useState({
    username: "",
    display_name: "",
  });
  const [form, setForm] = useState({
    username: "",
    password: "123456",
    display_name: "",
    role: "student" as "teacher" | "student",
    student_id: "",
    class_id: "",
    type_tag: "",
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
    const cls = await fetch("/api/teacher/classes");
    const clsJson = await cls.json();
    if (cls.ok) {
      setClasses(clsJson.data?.classes ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!me) return;
    setSelfDraft({
      username: me.username,
      display_name: me.display_name,
    });
  }, [me]);

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  }, [list, currentPage]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function startEdit(a: Account) {
    setEditingId(a.user_id);
    setEditDraft({
      username: a.username,
      display_name: a.display_name,
    });
  }

  async function saveAccount(
    userId: string,
    draft: { username: string; display_name: string },
    isSelf = false,
  ) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/teacher/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          username: draft.username.trim(),
          display_name: draft.display_name.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "保存失败");
      setMsg(isSelf ? "已更新本人账号信息" : "已更新账号信息");
      setEditingId(null);
      await load();
      if (isSelf) await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

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
          class_id: form.class_id || undefined,
          type_tag:
            form.role === "student" && form.type_tag
              ? form.type_tag
              : undefined,
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
        class_id: "",
        type_tag: "",
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

  async function toggleLogins(a: Account) {
    if (logUserId === a.user_id) {
      setLogUserId(null);
      setLogItems([]);
      return;
    }
    setLogBusy(true);
    setLogUserId(a.user_id);
    setLogItems([]);
    try {
      const res = await fetch(
        `/api/teacher/accounts/logins?user_id=${encodeURIComponent(a.user_id)}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "读取登录记录失败");
      setLogItems(json.data?.events ?? []);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "读取登录记录失败");
      setLogUserId(null);
    } finally {
      setLogBusy(false);
    }
  }

  async function changeClass(a: Account, classId: string) {
    if (a.role !== "student" || !a.student_id) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/teacher/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: a.user_id,
          class_id: classId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "分班失败");
      setMsg(
        classId
          ? `已将 ${a.display_name} 分入所选班级`
          : `已取消 ${a.display_name} 的班级`,
      );
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "分班失败");
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
      {me ? (
        <section className="space-y-3 rounded-sm border border-[var(--orange)]/35 bg-[var(--orange-fog)]/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs tracking-wider text-[var(--orange-deep)]">
              本人账号
            </p>
            <span className="rounded-sm bg-[var(--orange)] px-1.5 py-0.5 text-[10px] text-white">
              教师
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-[10px] tracking-wider text-[var(--muted)]">
                名称
              </span>
              <input
                className="w-full rounded-sm border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
                value={selfDraft.display_name}
                onChange={(e) =>
                  setSelfDraft({ ...selfDraft, display_name: e.target.value })
                }
                placeholder="显示名称"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] tracking-wider text-[var(--muted)]">
                账号
              </span>
              <input
                className="w-full rounded-sm border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
                value={selfDraft.username}
                onChange={(e) =>
                  setSelfDraft({ ...selfDraft, username: e.target.value })
                }
                placeholder="登录账号"
              />
            </label>
          </div>
          <Button
            type="button"
            loading={busy}
            disabled={
              !selfDraft.display_name.trim() ||
              !selfDraft.username.trim() ||
              (selfDraft.display_name === me.display_name &&
                selfDraft.username === me.username)
            }
            onClick={() => void saveAccount(me.user_id, selfDraft, true)}
          >
            {busy ? "保存中…" : "保存本人信息"}
          </Button>
        </section>
      ) : null}

      <section className="space-y-3 rounded-sm border border-[var(--line)] bg-white p-4">
        <p className="text-xs tracking-wider text-[var(--muted)]">新建账号</p>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded-sm border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
            placeholder="账号（如学号）"
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
            <>
              <input
                className="rounded-sm border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
                placeholder="学号（可与账号相同）"
                value={form.student_id}
                onChange={(e) =>
                  setForm({ ...form, student_id: e.target.value })
                }
              />
              <select
                className="rounded-sm border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
                value={form.type_tag}
                onChange={(e) =>
                  setForm({ ...form, type_tag: e.target.value })
                }
              >
                <option value="">暂不指定 · 完成操作后再生成</option>
                {TYPE_TAGS.map((k) => (
                  <option key={k} value={k}>
                    {TYPE_LABEL[k]}
                  </option>
                ))}
              </select>
              <select
                className="rounded-sm border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
                value={form.class_id}
                onChange={(e) =>
                  setForm({ ...form, class_id: e.target.value })
                }
              >
                <option value="">未分班</option>
                {classes.map((c) => (
                  <option key={c.class_id} value={c.class_id}>
                    {c.name}（{c.code}）
                  </option>
                ))}
              </select>
            </>
          ) : null}
        </div>
        <Button type="button" loading={busy} onClick={() => void create()}>
          {busy ? "创建中…" : "创建账号"}
        </Button>
      </section>

      {msg ? (
        <p className="text-sm text-[var(--orange-deep)]">{msg}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--muted)]">
        <span>
          共 {list.length} 个账号
          {list.length > 0 ? ` · 第 ${currentPage}/${totalPages} 页` : ""}
        </span>
        <span>每页 {PAGE_SIZE} 条</span>
      </div>

      <ul className="space-y-2">
        {pageItems.map((a) => {
          const editing = editingId === a.user_id;
          const isSelf = me?.user_id === a.user_id;
          return (
            <li
              key={a.user_id}
              className={cn(
                "space-y-3 rounded-sm border bg-white px-4 py-3",
                a.active ? "border-[var(--line)]" : "border-dashed opacity-60",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {editing ? (
                    <div className="grid max-w-xl gap-2 sm:grid-cols-2">
                      <input
                        className="rounded-sm border border-[var(--line)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--orange)]"
                        value={editDraft.display_name}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            display_name: e.target.value,
                          })
                        }
                        placeholder="名称"
                      />
                      <input
                        className="rounded-sm border border-[var(--line)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--orange)]"
                        value={editDraft.username}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            username: e.target.value,
                          })
                        }
                        placeholder="账号"
                      />
                    </div>
                  ) : (
                    <>
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
                        {isSelf ? (
                          <span className="rounded-sm border border-[var(--orange)]/40 px-1.5 py-0.5 text-[10px] text-[var(--orange-deep)]">
                            本人
                          </span>
                        ) : null}
                        <span className="font-display text-[var(--ink)]">
                          {a.display_name}
                        </span>
                        <span className="text-xs text-[var(--muted)]">
                          {a.username}
                        </span>
                        {!a.active ? (
                          <span className="text-[10px] text-[var(--vermilion)]">
                            已停用
                          </span>
                        ) : null}
                      </div>
                      {a.student_id ? (
                        <p className="mt-1 text-[11px] text-[var(--muted)]">
                          学号 {a.student_id}
                          {a.class_name
                            ? ` · ${a.class_name}${a.class_code ? `（${a.class_code}）` : ""}`
                            : " · 未分班"}
                        </p>
                      ) : null}
                      {a.role === "student" ? (
                        <p className="mt-1 text-[11px] font-medium text-[var(--ink)]">
                          最近登录 {formatLoginAt(a.last_login_at)}
                          {a.login_count > 0 ? ` · 共 ${a.login_count} 次` : ""}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {editing ? (
                    <>
                      <Button
                        type="button"
                        loading={busy}
                        onClick={() =>
                          void saveAccount(a.user_id, editDraft, isSelf)
                        }
                      >
                        {busy ? "保存中…" : "保存"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => setEditingId(null)}
                      >
                        取消
                      </Button>
                    </>
                  ) : (
                    <>
                      {a.role === "student" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          loading={logBusy}
                          disabled={busy}
                          onClick={() => void toggleLogins(a)}
                        >
                          {logBusy
                            ? "加载中…"
                            : logUserId === a.user_id
                              ? "收起记录"
                              : "登录记录"}
                        </Button>
                      ) : null}
                      {a.role === "student" && a.student_id ? (
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={busy}
                          onClick={() =>
                            setWorksStudentId((cur) =>
                              cur === a.student_id ? null : a.student_id,
                            )
                          }
                        >
                          {worksStudentId === a.student_id
                            ? "收起作品"
                            : "查看作品"}
                        </Button>
                      ) : null}
                      {a.role === "student" && a.student_id ? (
                        <select
                          className="rounded-sm border border-[var(--line)] px-2 py-1.5 text-[11px] outline-none focus:border-[var(--orange)]"
                          value={a.class_id ?? ""}
                          disabled={busy}
                          onChange={(e) => void changeClass(a, e.target.value)}
                        >
                          <option value="">未分班</option>
                          {classes.map((c) => (
                            <option key={c.class_id} value={c.class_id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => startEdit(a)}
                      >
                        编辑
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        loading={busy}
                        onClick={() => void toggleActive(a)}
                      >
                        {busy ? "处理中…" : a.active ? "停用" : "启用"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        loading={busy}
                        onClick={() => void resetPassword(a)}
                      >
                        {busy ? "重置中…" : "重置密码"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        loading={busy}
                        disabled={isSelf}
                        onClick={() => void remove(a)}
                      >
                        {busy ? "删除中…" : "删除"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {logUserId === a.user_id ? (
                <div className="mt-3 rounded-sm border border-[var(--line)] bg-[var(--paper)] px-3 py-2">
                  <p className="mb-1.5 text-xs font-semibold text-[var(--orange-deep)]">
                    登录时间记录
                  </p>
                  {logBusy ? (
                    <p className="text-sm text-[var(--muted)]">读取中…</p>
                  ) : logItems.length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">暂无登录记录</p>
                  ) : (
                    <ul className="max-h-48 space-y-1 overflow-y-auto">
                      {logItems.map((ev) => (
                        <li
                          key={ev.event_id}
                          className="flex flex-wrap items-center justify-between gap-2 text-sm"
                        >
                          <span className="font-medium text-[var(--ink)]">
                            {formatLoginAt(ev.logged_at)}
                          </span>
                          <span className="text-xs text-[var(--muted)]">
                            {ev.portal
                              ? PORTAL_LABEL[ev.portal] ?? ev.portal
                              : "登录"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
              {a.student_id && worksStudentId === a.student_id ? (
                <WorksArchiveList
                  className="mt-3"
                  studentId={a.student_id}
                  title={`${a.display_name} · 成片`}
                />
              ) : null}
            </li>
          );
        })}
      </ul>

      {list.length > PAGE_SIZE ? (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            disabled={busy || currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            上一页
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((n) => {
              if (totalPages <= 7) return true;
              if (n === 1 || n === totalPages) return true;
              return Math.abs(n - currentPage) <= 2;
            })
            .reduce<number[]>((acc, n, idx, arr) => {
              if (idx > 0 && n - arr[idx - 1]! > 1) acc.push(-n);
              acc.push(n);
              return acc;
            }, [])
            .map((n) =>
              n < 0 ? (
                <span
                  key={`gap-${n}`}
                  className="px-1 text-[11px] text-[var(--muted)]"
                >
                  …
                </span>
              ) : (
                <button
                  key={n}
                  type="button"
                  disabled={busy}
                  onClick={() => setPage(n)}
                  className={cn(
                    "min-w-8 rounded-sm px-2.5 py-1.5 text-[11px] transition",
                    n === currentPage
                      ? "bg-[var(--orange)] text-white shadow-[0_6px_16px_rgba(232,120,47,0.28)]"
                      : "border border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--orange)] hover:text-[var(--orange)]",
                  )}
                >
                  {n}
                </button>
              ),
            )}
          <Button
            type="button"
            variant="ghost"
            disabled={busy || currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            下一页
          </Button>
        </div>
      ) : null}
    </div>
  );
}
