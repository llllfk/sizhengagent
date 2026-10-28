"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type ChainItem = { role: string; content: string };

type Item = {
  escalation_id: string;
  session_id: string;
  student_id: string;
  student_name?: string;
  class_name?: string;
  q_type?: string;
  summary: string;
  question?: string;
  followup_chain?: ChainItem[];
  created_at: string;
  teacher_status: "pending" | "accepted" | "scheduled" | "done";
  teacher_reply?: string;
  teacher_name?: string;
  teacher_replied_at?: string;
};

const statusLabel: Record<Item["teacher_status"], string> = {
  pending: "待处理",
  accepted: "已接受",
  scheduled: "已排期",
  done: "已完成",
};

const typeLabel: Record<string, string> = {
  knowledge: "知识类",
  scenario: "情境类",
  value: "价值类",
};

function roleLabel(role: string) {
  if (role === "student") return "学生";
  if (role === "teacher") return "教师";
  return "学伴";
}

export function EscalationQueue() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState("");
  const [msg, setMsg] = useState("");
  const composing = useRef(false);

  const load = useCallback(async () => {
    if (composing.current) return;
    setLoading(true);
    try {
      const res = await fetch("/api/teacher/escalations");
      const json = await res.json();
      const list = (json.data ?? []) as Item[];
      setItems(list);
      setOpenId((cur) => {
        if (cur && list.some((x) => x.escalation_id === cur)) return cur;
        return list[0]?.escalation_id ?? null;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 12000);
    return () => window.clearInterval(t);
  }, [load]);

  const current = useMemo(
    () => items.find((x) => x.escalation_id === openId) ?? null,
    [items, openId],
  );

  async function setStatus(id: string, teacher_status: Item["teacher_status"]) {
    setBusyId(id);
    try {
      await fetch("/api/teacher/escalations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escalation_id: id, teacher_status }),
      });
      await load();
    } finally {
      setBusyId("");
    }
  }

  async function sendReply(id: string) {
    const reply = (drafts[id] ?? "").trim();
    if (!reply) {
      setMsg("请先写答复");
      return;
    }
    setBusyId(id);
    setMsg("");
    try {
      const res = await fetch("/api/teacher/escalations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escalation_id: id, reply }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "发送失败");
      setDrafts((d) => ({ ...d, [id]: "" }));
      setMsg("已发送在线答复，学生可在学伴端看到");
      composing.current = false;
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "发送失败");
    } finally {
      setBusyId("");
    }
  }

  if (loading && items.length === 0) {
    return <p className="text-sm text-[var(--muted)]">加载队列…</p>;
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        暂无转接。在学伴端追问满轮后，系统会自动入队。
      </p>
    );
  }

  const chain = current?.followup_chain ?? [];
  const question = current?.question || current?.summary || "（未见提问正文）";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
      <ul className="space-y-2">
        {items.map((item) => {
          const title = item.question || item.summary;
          return (
            <li key={item.escalation_id}>
              <button
                type="button"
                onClick={() => setOpenId(item.escalation_id)}
                className={cn(
                  "w-full rounded-sm border px-3 py-3 text-left transition",
                  openId === item.escalation_id
                    ? "border-[var(--orange)] bg-[var(--orange-fog)] shadow-[0_8px_24px_rgba(232,120,47,0.12)]"
                    : "border-[var(--line)] bg-white hover:border-[var(--orange)]/50",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-sm px-2 py-0.5 text-[11px]",
                      item.teacher_status === "pending" &&
                        "bg-[var(--vermilion)]/10 text-[var(--vermilion)]",
                      item.teacher_status === "accepted" &&
                        "bg-white text-[var(--orange-deep)]",
                      item.teacher_status === "scheduled" &&
                        "bg-[var(--orange)]/15 text-[var(--orange)]",
                      item.teacher_status === "done" &&
                        "bg-black/5 text-[var(--muted)]",
                    )}
                  >
                    {statusLabel[item.teacher_status]}
                  </span>
                  {item.teacher_reply ? (
                    <span className="text-[11px] text-[var(--orange-deep)]">
                      已答复
                    </span>
                  ) : null}
                  <span className="font-display text-sm text-[var(--ink)]">
                    {item.student_name ?? item.student_id}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--ink)]/75">
                  {title}
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      {current ? (
        <article className="animate-rise space-y-4 rounded-sm border border-[var(--orange)]/25 bg-[var(--paper)] p-4">
          <header className="space-y-1">
            <p className="text-[10px] tracking-[0.22em] text-[var(--orange-deep)]">
              疑难个案
            </p>
            <h2 className="font-display text-xl text-[var(--ink)]">
              {current.student_name ?? current.student_id}
            </h2>
            <p className="text-xs text-[var(--muted)]">
              {current.class_name ? `${current.class_name} · ` : ""}
              学号 {current.student_id}
              {current.q_type ? ` · ${typeLabel[current.q_type] || current.q_type}` : ""}
              {" · "}
              {new Date(current.created_at).toLocaleString("zh-CN")}
            </p>
          </header>

          {msg ? (
            <p className="text-sm text-[var(--orange-deep)]">{msg}</p>
          ) : null}

          <section className="rounded-sm border border-[var(--line)] bg-white p-4">
            <p className="text-[10px] tracking-[0.2em] text-[var(--muted)]">
              学生原问
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--ink)]">
              {question}
            </p>
            {current.summary && current.summary !== question ? (
              <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
                转接摘要：{current.summary}
              </p>
            ) : null}
          </section>

          <section>
            <p className="mb-2 text-[10px] tracking-[0.2em] text-[var(--orange-deep)]">
              学伴对话全过程
            </p>
            <div className="scroll-soft max-h-[46vh] space-y-2 overflow-y-auto rounded-sm border border-[var(--line)] bg-white p-3">
              {chain.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">
                  本条未关联到完整会话，可按上方原问直接答复。
                </p>
              ) : (
                chain.map((c, i) => (
                  <div
                    key={`${current.escalation_id}-${i}`}
                    className={cn(
                      "rounded-sm px-3 py-2 text-sm leading-6",
                      c.role === "student" &&
                        "bg-gradient-to-r from-[var(--orange)] to-[var(--orange-deep)] text-white",
                      c.role === "ai" &&
                        "border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]",
                      c.role === "teacher" &&
                        "border border-[var(--orange)]/35 bg-[var(--orange-fog)] text-[var(--ink)]",
                    )}
                  >
                    <p
                      className={cn(
                        "text-[10px] tracking-[0.18em]",
                        c.role === "student" ? "text-white/80" : "text-[var(--muted)]",
                      )}
                    >
                      {roleLabel(c.role)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{c.content}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          {current.teacher_reply ? (
            <section className="rounded-sm border border-[var(--orange)]/30 bg-[var(--orange-fog)] px-4 py-3 text-sm leading-6">
              <p className="text-[10px] tracking-[0.2em] text-[var(--orange-deep)]">
                已发送给学生
                {current.teacher_name ? ` · ${current.teacher_name}` : ""}
                {current.teacher_replied_at
                  ? ` · ${new Date(current.teacher_replied_at).toLocaleString("zh-CN")}`
                  : ""}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{current.teacher_reply}</p>
            </section>
          ) : null}

          <section className="space-y-2">
            <p className="text-[10px] tracking-[0.2em] text-[var(--muted)]">
              在线答复（学生学伴可见）
            </p>
            <textarea
              className="min-h-32 w-full rounded-sm border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
              placeholder="针对上面的提问写给学生：底线是什么、现场三步怎么做。需要课堂展开的再用右侧按钮排期。"
              value={drafts[current.escalation_id] ?? ""}
              onFocus={() => {
                composing.current = true;
              }}
              onBlur={() => {
                composing.current = false;
              }}
              onChange={(e) =>
                setDrafts((d) => ({
                  ...d,
                  [current.escalation_id]: e.target.value,
                }))
              }
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                loading={busyId === current.escalation_id}
                onClick={() => void sendReply(current.escalation_id)}
              >
                {busyId === current.escalation_id
                  ? "发送中…"
                  : current.teacher_reply
                    ? "追发一条"
                    : "发送在线答复"}
              </Button>
              {current.teacher_status === "pending" ? (
                <Button
                  type="button"
                  variant="ghost"
                  loading={busyId === current.escalation_id}
                  onClick={() =>
                    void setStatus(current.escalation_id, "accepted")
                  }
                >
                  一键接受
                </Button>
              ) : null}
              {current.teacher_status === "accepted" ? (
                <Button
                  type="button"
                  variant="ghost"
                  loading={busyId === current.escalation_id}
                  onClick={() =>
                    void setStatus(current.escalation_id, "scheduled")
                  }
                >
                  排期专题答疑
                </Button>
              ) : null}
              {current.teacher_status === "scheduled" ? (
                <Button
                  type="button"
                  variant="ghost"
                  loading={busyId === current.escalation_id}
                  onClick={() => void setStatus(current.escalation_id, "done")}
                >
                  标记完成
                </Button>
              ) : null}
            </div>
          </section>
        </article>
      ) : null}
    </div>
  );
}
