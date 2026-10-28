"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/components/shared/useSession";
import { cn } from "@/lib/utils";
import type { ForumReply, ForumTopic } from "@/types";

type TopicDetail = ForumTopic & { replies: ForumReply[] };

const sourceLabel: Record<string, string> = {
  debate: "课中辩论回流",
  escalation: "疑难转接回流",
  manual: "师生共创",
};

function timeAgo(iso: string) {
  const h = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 36e5),
  );
  if (h < 1) return "刚刚";
  if (h < 24) return `${h} 小时前`;
  return `${Math.round(h / 24)} 天前`;
}

export function ForumBoard() {
  const { user, isTeacher } = useSession();
  const myIds = useMemo(
    () =>
      user
        ? ([user.student_id, user.username].filter(Boolean) as string[])
        : [],
    [user],
  );
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
    const list = ((json.data ?? []) as ForumTopic[])
      .slice()
      .sort((a, b) => b.hot - a.hot || b.created_at.localeCompare(a.created_at));
    setTopics(list);
    setActiveId((cur) => {
      if (cur && list.some((t) => t.topic_id === cur)) return cur;
      return list[0]?.topic_id ?? null;
    });
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
    const t = title.trim();
    const b = body.trim();
    if (!t) {
      setFlash("请填写议题标题");
      return;
    }
    if (!b) {
      setFlash("请填写讨论背景或引导（标题下方输入框）");
      return;
    }
    setBusy(true);
    setFlash("");
    try {
      const res = await fetch("/api/forum/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, body: b, tags: ["师生共创"] }),
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
    if (!activeId) {
      setFlash("请先选择左侧议题");
      return;
    }
    if (!reply.trim()) {
      setFlash("请先写下跟帖内容");
      return;
    }
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

  async function removeReply(r: ForumReply) {
    if (!myIds.includes(r.author_id)) {
      setFlash("只能删除自己的跟帖");
      return;
    }
    const ok = window.confirm(
      `确认删除这条跟帖？\n\n「${r.content.slice(0, 48)}${r.content.length > 48 ? "…" : ""}」\n\n删除后不可恢复。`,
    );
    if (!ok) return;
    setBusy(true);
    setFlash("");
    try {
      const res = await fetch(
        `/api/forum/replies?reply_id=${encodeURIComponent(r.reply_id)}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "删除跟帖失败");
      setFlash("跟帖已删除");
      if (activeId) {
        await Promise.all([loadDetail(activeId), loadList()]);
      }
    } catch (e) {
      setFlash(e instanceof Error ? e.message : "删除跟帖失败");
    } finally {
      setBusy(false);
    }
  }

  async function removeTopic(topic: ForumTopic) {
    if (!isTeacher) {
      setFlash("仅教师可删除议题");
      return;
    }
    const ok = window.confirm(
      `确认删除议题「${topic.title}」？\n\n其下全部跟帖将一并删除，且不可恢复。`,
    );
    if (!ok) return;
    setBusy(true);
    setFlash("");
    try {
      const res = await fetch(
        `/api/forum/topics?id=${encodeURIComponent(topic.topic_id)}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "删除议题失败");
      setFlash("议题已删除");
      setDetail(null);
      setActiveId(null);
      await loadList();
    } catch (e) {
      setFlash(e instanceof Error ? e.message : "删除议题失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="forum-board space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-xl space-y-1.5">
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            课中辩论与疑难转接自动回流至此；跟帖碰撞后可一键沉淀精华、回灌答疑库。
          </p>
          <p className="text-[11px] leading-relaxed text-[var(--muted)]">
            <span className="text-[var(--orange-deep)]">热度规则</span>
            ：发帖起步 12 · 每条跟帖 +3 · 按热度排序
          </p>
        </div>
        <Button
          type="button"
          variant={composeOpen ? "ghost" : "primary"}
          onClick={() => setComposeOpen((v) => !v)}
        >
          {composeOpen ? "收起发帖" : "发起议题"}
        </Button>
      </div>

      {composeOpen ? (
        <div className="forum-compose animate-rise space-y-3 rounded-sm border border-[var(--orange)]/35 bg-white/95 p-4 shadow-[0_12px_36px_rgba(232,120,47,0.12)]">
          <label className="block space-y-1">
            <span className="text-[10px] tracking-[0.2em] text-[var(--orange)]">
              议题标题
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="一句话点出讨论焦点"
              className="w-full border-b border-[var(--line)] bg-transparent py-2 text-base text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--orange)]"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] tracking-[0.2em] text-[var(--orange)]">
              讨论背景（必填）
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="补充情境、规章依据或引导问题…"
              className="w-full resize-none rounded-sm border border-[var(--line)] bg-[var(--orange-fog)]/40 px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--orange)]"
            />
          </label>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-[var(--muted)]">
              标题 + 背景都填后才能发布
            </p>
            <Button
              type="button"
              loading={busy}
              onClick={() => void submitTopic()}
            >
              {busy ? "发布中…" : "发布"}
            </Button>
          </div>
        </div>
      ) : null}

      {flash ? (
        <p
          className="animate-rise rounded-sm border border-[var(--orange)]/25 bg-[var(--orange-fog)] px-3 py-2 text-sm text-[var(--orange-deep)]"
          role="status"
        >
          {flash}
        </p>
      ) : null}

      <div className="forum-stage grid gap-4 lg:grid-cols-[minmax(240px,0.88fr)_minmax(0,1.25fr)]">
        {/* 左侧议题轨：独立滚动 */}
        <aside className="forum-rail flex min-h-0 flex-col overflow-hidden rounded-sm border border-[var(--glass-border)] bg-white/75 shadow-[0_10px_28px_rgba(196,92,26,0.08)]">
          <div className="shrink-0 space-y-1 border-b border-[var(--line)] bg-[var(--orange-fog)]/55 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] tracking-[0.22em] text-[var(--orange-deep)]">
                议题轨 · {topics.length}
              </p>
              <span className="text-[10px] text-[var(--muted)]">点击展开讨论</span>
            </div>
            <p className="text-[10px] leading-snug text-[var(--muted)]">
              热度 = 12 + 跟帖数 × 3
            </p>
          </div>
          <ul className="forum-rail-scroll min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-2.5">
            {topics.length === 0 ? (
              <li className="px-2 py-8 text-center text-sm text-[var(--muted)]">
                暂无议题
              </li>
            ) : (
              topics.map((t, i) => {
                const active = t.topic_id === activeId;
                return (
                  <li
                    key={t.topic_id}
                    className="animate-rise"
                    style={{ animationDelay: `${i * 45}ms` }}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveId(t.topic_id)}
                      className={cn(
                        "forum-topic-card w-full rounded-sm border px-3.5 py-3 text-left transition duration-200",
                        active
                          ? "forum-topic-card-on border-[var(--orange)] bg-gradient-to-br from-[var(--orange-fog)] to-white shadow-[0_10px_28px_rgba(232,120,47,0.18)]"
                          : "border-[var(--line)] bg-white/90 hover:border-[var(--orange)]/50 hover:bg-[var(--orange-fog)]/35",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-sm bg-[var(--orange-fog)] px-1.5 py-0.5 text-[10px] text-[var(--orange-deep)]">
                          {sourceLabel[t.source] ?? t.source}
                        </span>
                        <span className="ml-auto text-[10px] tabular-nums text-[var(--muted)]">
                          热度 {t.hot}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 font-display text-[15px] leading-snug text-[var(--ink)]">
                        {t.title}
                      </p>
                      <p className="mt-1.5 text-[11px] text-[var(--muted)]">
                        {t.author_name} · {t.reply_count} 跟帖 ·{" "}
                        {timeAgo(t.created_at)}
                      </p>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </aside>

        {/* 右侧讨论舱：头固定 + 串滚动 + 底固定跟帖 */}
        <section className="forum-cabin portal-panel relative flex min-h-0 flex-col overflow-hidden rounded-sm border border-[var(--glass-border)]">
          <div
            className="pointer-events-none absolute -right-12 -top-14 h-48 w-48 rounded-full blur-3xl"
            style={{ background: "rgba(246,199,154,0.5)" }}
            aria-hidden
          />
          {!detail ? (
            <div className="relative flex flex-1 items-center justify-center p-8">
              <p className="text-sm text-[var(--muted)]">选择左侧议题…</p>
            </div>
          ) : (
            <div className="relative flex min-h-0 flex-1 flex-col animate-rise">
              <header className="forum-cabin-head shrink-0 space-y-2.5 border-b border-[var(--line)] bg-white/70 px-4 py-3.5 backdrop-blur-sm md:px-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap gap-1.5">
                    {detail.tags.map((tag) => (
                      <span
                        key={tag}
                        className="border border-[var(--orange)]/25 bg-white/90 px-2 py-0.5 text-[11px] text-[var(--orange-deep)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      loading={busy}
                      onClick={() => void promote()}
                    >
                      {busy ? "沉淀中…" : "沉淀精华"}
                    </Button>
                    {isTeacher ? (
                      <Button
                        type="button"
                        variant="ghost"
                        loading={busy}
                        className="border-[var(--vermilion)]/35 text-[var(--vermilion)] hover:border-[var(--vermilion)] hover:text-[var(--vermilion)]"
                        onClick={() => void removeTopic(detail)}
                      >
                        删除议题
                      </Button>
                    ) : null}
                  </div>
                </div>
                <h2 className="font-display text-xl leading-snug text-[var(--ink)] md:text-2xl">
                  {detail.title}
                </h2>
                <p className="line-clamp-3 text-sm leading-relaxed text-[var(--muted)] md:line-clamp-4">
                  {detail.body}
                </p>
                <p className="text-[11px] text-[var(--muted)]">
                  {detail.author_name} ·{" "}
                  {sourceLabel[detail.source] ?? detail.source} ·{" "}
                  {timeAgo(detail.created_at)}
                </p>
              </header>

              <div className="forum-thread min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-4 py-3 md:px-5">
                <p className="sticky top-0 z-[1] -mx-1 mb-1 bg-gradient-to-b from-[rgba(255,248,242,0.95)] to-transparent px-1 pb-2 text-[10px] tracking-[0.2em] text-[var(--muted)]">
                  讨论串 · {detail.replies.length}
                </p>
                {detail.replies.length === 0 ? (
                  <p className="rounded-sm border border-dashed border-[var(--line)] bg-white/60 px-3 py-6 text-center text-sm text-[var(--muted)]">
                    还没有跟帖，来抛出第一个观点
                  </p>
                ) : (
                  detail.replies.map((r, i) => {
                    const mine = myIds.includes(r.author_id);
                    return (
                      <article
                        key={r.reply_id}
                        className="forum-reply animate-rise rounded-sm border border-[var(--line)] bg-white/92 px-3 py-2.5 shadow-[0_4px_14px_rgba(61,42,26,0.04)]"
                        style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                      >
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
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
                          {mine ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void removeReply(r)}
                              className="ml-auto rounded-sm px-1.5 py-0.5 text-[10px] text-[var(--muted)] transition hover:bg-red-50 hover:text-[var(--vermilion)] disabled:opacity-50"
                            >
                              删除
                            </button>
                          ) : null}
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink)]/90">
                          {r.content}
                        </p>
                      </article>
                    );
                  })
                )}
              </div>

              <div className="forum-reply-bar shrink-0 space-y-2 border-t border-[var(--line)] bg-white/85 px-4 py-3 backdrop-blur-md md:px-5">
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
                    loading={busy}
                    disabled={!reply.trim()}
                    onClick={() => void submitReply()}
                  >
                    {busy ? "发送中…" : "跟帖"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
