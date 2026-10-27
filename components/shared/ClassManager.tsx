"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ClassGroup, StudentProfile } from "@/types";

type Payload = {
  classes: ClassGroup[];
  students: StudentProfile[];
};

export function ClassManager() {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", code: "", remark: "" });
  const [edit, setEdit] = useState({ name: "", code: "", remark: "" });

  const load = useCallback(async () => {
    const res = await fetch("/api/teacher/classes");
    const json = await res.json();
    if (!res.ok) {
      setMsg(json.error || "加载失败（需教师登录）");
      setClasses([]);
      setStudents([]);
      return;
    }
    const data = (json.data ?? {}) as Payload;
    setMsg("");
    setClasses(data.classes ?? []);
    setStudents(data.students ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const active = useMemo(
    () => classes.find((c) => c.class_id === activeId) ?? null,
    [classes, activeId],
  );

  useEffect(() => {
    if (!active) {
      setEdit({ name: "", code: "", remark: "" });
      return;
    }
    setEdit({
      name: active.name,
      code: active.code,
      remark: active.remark,
    });
  }, [active]);

  async function create() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/teacher/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "创建失败");
      setForm({ name: "", code: "", remark: "" });
      setMsg("已创建班级");
      await load();
      if (json.data?.class_id) setActiveId(json.data.class_id);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "创建失败");
    } finally {
      setBusy(false);
    }
  }

  async function saveMeta() {
    if (!active) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/teacher/classes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_id: active.class_id, ...edit }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "保存失败");
      setMsg("已更新班级信息");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: ClassGroup) {
    if (!window.confirm(`确认删除班级「${item.name}」？学员将变为未分班。`)) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(
        `/api/teacher/classes?class_id=${encodeURIComponent(item.class_id)}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "删除失败");
      if (activeId === item.class_id) setActiveId(null);
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "删除失败");
    } finally {
      setBusy(false);
    }
  }

  const unassigned = students.filter((s) => !s.class_id).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2">
        {[
          { k: "班级", v: classes.length },
          { k: "在籍学员", v: students.length },
          { k: "未分班", v: unassigned },
        ].map((item, i) => (
          <div
            key={item.k}
            className="animate-rise rounded-sm border border-[var(--line)] bg-white px-3 py-3"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <p className="text-[10px] tracking-[0.2em] text-[var(--muted)]">
              {item.k}
            </p>
            <p className="font-display text-2xl text-[var(--orange)]">
              {item.v}
            </p>
          </div>
        ))}
      </div>
      <section className="space-y-3 rounded-sm border border-[var(--line)] bg-white p-4">
        <p className="text-xs tracking-wider text-[var(--muted)]">新建班级</p>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="rounded-sm border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
            placeholder="班级名称（如 空乘 2301 班）"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="rounded-sm border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
            placeholder="编号（如 KM2301，可空）"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
          <input
            className="rounded-sm border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
            placeholder="备注"
            value={form.remark}
            onChange={(e) => setForm({ ...form, remark: e.target.value })}
          />
        </div>
        <Button type="button" disabled={busy} onClick={() => void create()}>
          创建班级
        </Button>
      </section>

      {msg ? (
        <p className="text-sm text-[var(--orange-deep)]">{msg}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.15fr]">
        <ul className="space-y-2">
          {classes.length === 0 ? (
            <li className="rounded-sm border border-dashed border-[var(--line)] bg-white px-4 py-6 text-sm text-[var(--muted)]">
              还没有班级。先在上方创建一个。
            </li>
          ) : (
            classes.map((c) => (
              <li key={c.class_id}>
                <button
                  type="button"
                  onClick={() => setActiveId(c.class_id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-sm border bg-white px-4 py-3 text-left transition",
                    activeId === c.class_id
                      ? "border-[var(--orange)] shadow-[0_8px_22px_rgba(232,120,47,0.14)]"
                      : "border-[var(--line)] hover:border-[var(--orange)]/50",
                  )}
                >
                  <div>
                    <p className="font-display text-[var(--ink)]">{c.name}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                      {c.code}
                      {c.remark ? ` · ${c.remark}` : ""}
                    </p>
                  </div>
                  <span className="rounded-sm bg-[var(--orange-fog)] px-2 py-0.5 text-xs text-[var(--orange-deep)]">
                    {c.student_count} 人
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>

        {active ? (
          <section className="space-y-4 rounded-sm border border-[var(--line)] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs tracking-wider text-[var(--muted)]">
                编辑班级
              </p>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => void remove(active)}
              >
                删除班级
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded-sm border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
                value={edit.name}
                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              />
              <input
                className="rounded-sm border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
                value={edit.code}
                onChange={(e) => setEdit({ ...edit, code: e.target.value })}
              />
              <input
                className="rounded-sm border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--orange)] md:col-span-2"
                placeholder="备注"
                value={edit.remark}
                onChange={(e) => setEdit({ ...edit, remark: e.target.value })}
              />
            </div>
            <Button type="button" disabled={busy} onClick={() => void saveMeta()}>
              保存信息
            </Button>
          </section>
        ) : (
          <p className="rounded-sm border border-dashed border-[var(--line)] bg-white px-4 py-8 text-center text-sm text-[var(--muted)]">
            点选左侧班级，即可修改信息。
          </p>
        )}
      </div>
    </div>
  );
}
