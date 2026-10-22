"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ForumReply, ForumTopic } from "@/types";

type TopicDetail = ForumTopic & { replies: ForumReply[] };

const sourceLabel: Record<string, string> = {
  debate: "课中辩论回流",
  escalation: "疑难转接回流",
  manual: "师生共创",
};

function timeAgo(iso: string) {
  const h = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 36e5));
  if (h < 1) return "刚刚";
  if (h < 24) return `${h} 小时前`;
  return `${Math.round(h / 24)} 天前`;
}

export function ForumBoard() {
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TopicDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");

  const loadList = useCallback(async () => {
    const res = await fetch("/api/forum/topics");
    const json = await res.json();
    const list = (json.data ?? []) as ForumTopic[];
    setTopics(list);
    setActiveId((cur) => cur ?? list[0]?.topic_id ?? null);
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    const res = await fetch(`/api/forum/topics?id=${encodeURIComponent(id)}`);
    const json = await res.json();
    if (json.data) setDetail(json.data as TopicDetail);
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (activeId) void loadDetail(activeId);
  }, [activeId, loadDetail]);

  async function submitTopic() {
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    setFlash("");
    try {
      const res = await fetch("/api/forum/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, tags: ["师生共创"] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "发帖失败");
      setTitle("");
      setBody("");
      setComposeOpen(false);
      setFlash("议题已发布");
      setActiveId(json.data.topic_id);
      await loadList();
    } catch (e) {
      setFlash(e instanceof Error ? e.message : "发帖失败");
    } finally {
      setBusy(false);
    }
  }

  async function submitReply() {
    if (!activeId || !reply.trim()) return;
    setBusy(true);
    setFlash("");
    try {
      const res = await fetch("/api/forum/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_id: activeId, content: reply }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "跟帖失败");
      setReply("");
      setFlash("跟帖已发出");
      await Promise.all([loadDetail(activeId), loadList()]);
    } catch (e) {
      setFlash(e instanceof Error ? e.message : "跟帖失败");
    } finally {
      setBusy(false);
    }
  }

  async function promote() {
    if (!activeId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "promote", topic_id: activeId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "沉淀失败");
      setFlash("已沉淀至精华集");
    } catch (e) {
      setFlash(e instanceof Error ? e.message : "沉淀失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-xl text-sm leading-relaxed text-[var(--muted)]">
          课中辩论与疑难转接自动回流至此；跟帖碰撞后可一键沉淀精华、回灌答疑库。
        </p>
        <Button
          type="button"
          variant={composeOpen ? "ghost" : "primary"}
          onClick={() => setComposeOpen((v) => !v)}
        >
          {composeOpen ? "收起发帖" : "发起议题"}
        </Button>
      </div>

      {composeOpen ? (
        <div className="animate-rise space-y-3 rounded-sm border border-[var(--orange)]/35 bg-white/90 p-4 shadow-[0_12px_36px_rgba(232,120,47,0.12)]">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="议题标题"
            className="w-full border-b border-[var(--line)] bg-transparent py-2 text-base text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--orange)]"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="背景与讨论引导…"
            className="w-full resize-none rounded-sm border border-[var(--line)] bg-[var(--orange-fog)]/40 px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--orange)]"
          />
          <div className="flex justify-end">
            <Button type="button" disabled={busy} onClick={() => void submitTopic()}>
              发布
            </Button>
          </div>
        </div>
      ) : null}

      {flash ? (
        <p className="animate-rise text-sm text-[var(--orange)]">{flash}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)]">
        <ul className="space-y-2">
          {topics.map((t, i) => {
            const active = t.topic_id === activeId;
            return (
              <li
                key={t.topic_id}
                className="animate-rise"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <button
                  type="button"
                  onClick={() => setActiveId(t.topic_id)}
                  className={cn(
                    "w-full rounded-sm border px-4 py-3 text-left transition",
                    active
                      ? "border-[var(--orange)] bg-gradient-to-br from-[var(--orange-fog)] to-white shadow-[0_10px_28px_rgba(232,120,47,0.18)]"
                      : "border-[var(--line)] bg-white/80 hover:border-[var(--orange)]/50 hover:bg-[var(--orange-fog)]/40",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {t.pinned ? (
                      <span className="rounded-sm bg-[var(--orange)] px-1.5 py-0.5 text-[10px] text-white">
                        置顶
                      </span>
                    ) : null}
                    <span className="rounded-sm bg-[var(--orange-fog)] px-1.5 py-0.5 text-[10px] text-[var(--orange-deep)]">
                      {sourceLabel[t.source] ?? t.source}
                    </span>
                    <span className="text-[10px] text-[var(--muted)]">
                      热度 {t.hot}
                    </span>
                  </div>
                  <p className="mt-2 font-display text-base text-[var(--ink)]">
                    {t.title}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--muted)]">
                    {t.author_name} · {t.reply_count} 跟帖 · {timeAgo(t.created_at)}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="portal-panel relative min-h-[320px] overflow-hidden rounded-sm border border-[var(--glass-border)] p-5">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl"
            style={{ background: "rgba(246,199,154,0.55)" }}
            aria-hidden
          />
          {!detail ? (
            <p className="text-sm text-[var(--muted)]">选择左侧议题…</p>
          ) : (
            <div className="relative space-y-4 animate-rise">
              <header className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {detail.tags.map((tag) => (
                    <span
                      key={tag}
                      className="border border-[var(--orange)]/25 bg-white/80 px-2 py-0.5 text-[11px] text-[var(--orange-deep)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="font-display text-2xl text-[var(--ink)]">
                  {detail.title}
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted)]">
                  {detail.body}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => void promote()}
                  >
                    沉淀精华
                  </Button>
                </div>
              </header>

              <div className="space-y-3 border-t border-[var(--line)] pt-4">
                <p className="text-xs tracking-wider text-[var(--muted)]">
                  讨论串 · {detail.replies.length}
                </p>
                {detail.replies.map((r, i) => (
                  <article
                    key={r.reply_id}
                    className="animate-rise rounded-sm border border-[var(--line)] bg-white/90 px-3 py-2.5"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-center gap-2 text-[11px]">
                      <span
                        className={cn(
                          "rounded-sm px-1.5 py-0.5",
                          r.author_role === "teacher"
                            ? "bg-[var(--orange)] text-white"
                            : "bg-[var(--orange-fog)] text-[var(--orange-deep)]",
                        )}
                      >
                        {r.author_role === "teacher" ? "教师" : "学员"}
                      </span>
                      <span className="font-medium text-[var(--ink)]">
                        {r.author_name}
                      </span>
                      <span className="text-[var(--muted)]">
                        {timeAgo(r.created_at)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink)]/90">
                      {r.content}
                    </p>
                  </article>
                ))}
              </div>

              <div className="space-y-2 border-t border-[var(--line)] pt-3">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={2}
                  placeholder="写下你的观点…"
                  className="w-full resize-none rounded-sm border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    disabled={busy || !reply.trim()}
                    onClick={() => void submitReply()}
                  >
                    跟帖
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
