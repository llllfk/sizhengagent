"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { SAFETY_DEMO_SAMPLES } from "@/lib/ai";
import { DEMO_PROMPTS } from "@/lib/content/qaEngine";

type Msg = {
  role: "user" | "assistant" | "system";
  content: string;
};

type SafetyBanner = {
  gate: "sensitive" | "value";
  reason: string;
  flagged: string[];
};

type RetrievalHit = {
  id: string;
  library: "knowledge" | "cabin";
  kind_label: string;
  title: string;
  quote: string;
  source: string;
};

const SOCRATIC = ["你怎么看？", "依据是什么？", "换个情境还成立吗？"];

export function CompanionChat() {
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qType, setQType] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [safety, setSafety] = useState<SafetyBanner | null>(null);
  const [hits, setHits] = useState<RetrievalHit[]>([]);
  const [scanning, setScanning] = useState(false);
  const [flashKey, setFlashKey] = useState(0);

  useEffect(() => {
    if (!scanning) return;
    const t = window.setTimeout(() => setScanning(false), 900);
    return () => window.clearTimeout(t);
  }, [scanning]);

  function applyRetrieval(list: RetrievalHit[] | undefined) {
    if (!list?.length) return;
    setHits(list);
    setFlashKey((k) => k + 1);
  }

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || loading || escalated) return;
    setLoading(true);
    setSafety(null);
    setScanning(true);
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");

    try {
      if (!sessionId) {
        const res = await fetch("/api/qa/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: text }),
        });
        const json = await res.json();
        if (res.status === 422 && json.safety) {
          setSafety({
            gate: json.safety.gate,
            reason: json.safety.reason,
            flagged: json.safety.flagged ?? [],
          });
          setMessages((m) => m.slice(0, -1));
          setInput(text);
          setScanning(false);
          return;
        }
        if (!res.ok) throw new Error(json.error || "发起失败");
        setSessionId(json.data.session_id);
        setQType(json.data.q_type);
        applyRetrieval(json.data.retrieval);
        setMessages((m) => [
          ...m,
          { role: "assistant", content: json.data.prompt },
        ]);
      } else {
        const res = await fetch("/api/qa/followup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, answer: text }),
        });
        const json = await res.json();
        if (res.status === 422 && json.safety) {
          setSafety({
            gate: json.safety.gate,
            reason: json.safety.reason,
            flagged: json.safety.flagged ?? [],
          });
          setMessages((m) => m.slice(0, -1));
          setInput(text);
          setScanning(false);
          return;
        }
        if (!res.ok) throw new Error(json.error || "追问失败");
        applyRetrieval(json.data.retrieval);
        setMessages((m) => [
          ...m,
          { role: "assistant", content: json.data.prompt },
        ]);
        if (json.data.escalate_hint) {
          setEscalated(true);
          setMessages((m) => [
            ...m,
            {
              role: "system",
              content:
                "已生成疑难清单并自动推送给老师。老师将在专题答疑中继续引导，你可新开一轮提问。",
            },
          ]);
        }
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: e instanceof Error ? e.message : "请求失败",
        },
      ]);
    } finally {
      setLoading(false);
      setScanning(false);
    }
  }

  function reset() {
    setSessionId(null);
    setQType(null);
    setMessages([]);
    setEscalated(false);
    setInput("");
    setSafety(null);
    setHits([]);
    setScanning(false);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {qType ? (
            <span className="rounded-sm border border-[var(--orange)]/35 bg-[var(--orange-fog)] px-2 py-0.5 text-[var(--orange-deep)]">
              {qType === "value"
                ? "价值类"
                : qType === "scenario"
                  ? "情境类"
                  : "知识类"}
            </span>
          ) : (
            <span className="text-[var(--muted)]">
              等待首问 · 内容安全双闸门
            </span>
          )}
          {escalated ? (
            <span className="rounded-sm bg-[var(--vermilion)]/10 px-2 py-0.5 text-[var(--vermilion)]">
              已转教师
            </span>
          ) : null}
          {messages.length > 0 ? (
            <button
              type="button"
              onClick={reset}
              className="ml-auto text-[var(--orange)] underline underline-offset-2"
            >
              新开一轮
            </button>
          ) : null}
        </div>

        {safety ? (
          <div
            className={cn(
              "animate-rise rounded-sm border px-4 py-3",
              safety.gate === "sensitive"
                ? "border-rose-300/70 bg-rose-50"
                : "border-amber-300/70 bg-amber-50",
            )}
          >
            <p className="text-[10px] tracking-[0.22em] text-[var(--orange-deep)]">
              内容安全 ·{" "}
              {safety.gate === "sensitive" ? "敏感词闸门" : "价值导向闸门"}
            </p>
            <p className="mt-1 text-sm text-[var(--ink)]">{safety.reason}</p>
            {safety.flagged.length > 0 ? (
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                标记：{safety.flagged.join(" · ")}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="min-h-56 max-h-[52vh] space-y-3 overflow-y-auto rounded-sm border border-[var(--line)] bg-[var(--paper)] p-4">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {SOCRATIC.map((s, i) => (
                  <span
                    key={s}
                    className="animate-rise rounded-sm border border-[var(--orange)]/25 bg-white px-2.5 py-1 text-[11px] text-[var(--orange-deep)]"
                    style={{ animationDelay: `${i * 120}ms` }}
                  >
                    {i + 1}. {s}
                  </span>
                ))}
              </div>
              <p className="text-sm text-[var(--muted)]">
                点选示例开场；右侧将闪现知识库 / 客舱案例命中。
              </p>
              <div className="flex flex-col gap-2">
                {DEMO_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => void send(p)}
                    className="border border-[var(--line)] bg-white px-3 py-2.5 text-left text-xs text-[var(--ink)] transition hover:border-[var(--orange)] hover:bg-[var(--orange-fog)]"
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="border-t border-dashed border-[var(--line)] pt-3">
                <p className="mb-2 text-[10px] tracking-[0.2em] text-[var(--muted)]">
                  M4 双闸门演示
                </p>
                <div className="flex flex-wrap gap-2">
                  {SAFETY_DEMO_SAMPLES.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => void send(s.text)}
                      className="rounded-sm border border-dashed border-[var(--orange)]/40 bg-white px-2.5 py-1.5 text-[11px] text-[var(--orange-deep)] transition hover:bg-[var(--orange-fog)]"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={`${i}-${m.role}`}
                className={cn(
                  "animate-rise rounded-sm px-3 py-2.5 text-sm leading-6",
                  m.role === "user" &&
                    "ml-6 bg-gradient-to-r from-[var(--orange)] to-[var(--orange-deep)] text-white",
                  m.role === "assistant" &&
                    "mr-4 whitespace-pre-wrap border border-[var(--line)] bg-white text-[var(--ink)]",
                  m.role === "system" &&
                    "border border-dashed border-[var(--orange)]/50 bg-[var(--orange-fog)] text-xs text-[var(--orange-deep)]",
                )}
              >
                {m.content}
              </div>
            ))
          )}
          {loading ? (
            <p className="text-xs text-[var(--orange)]">
              <span className="inline-block animate-pulse">
                检索知识库 · 生成追问…
              </span>
            </p>
          ) : null}
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 rounded-sm border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]/50 focus:border-[var(--orange)] focus:shadow-[0_0_0_3px_rgba(232,120,47,0.12)]"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void send();
            }}
            placeholder={
              escalated ? "本轮已转教师，可新开一轮" : "输入你的问题或答复…"
            }
            disabled={loading || escalated}
          />
          <Button
            type="button"
            onClick={() => void send()}
            disabled={loading || escalated}
          >
            {loading ? "检索中" : "发送"}
          </Button>
        </div>
      </div>

      {/* 检索可见 · RAG 侧栏 */}
      <aside
        className={cn(
          "rag-rail relative overflow-hidden rounded-sm border border-[var(--glass-border)] bg-white/90 p-4",
          scanning && "rag-rail-scanning",
        )}
      >
        <div className="rag-rail-glow" aria-hidden />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] tracking-[0.28em] text-[var(--orange)]">
                检索可见 · RAG
              </p>
              <h3 className="mt-1 font-display text-lg text-[var(--ink)]">
                五库命中
              </h3>
            </div>
            {scanning ? (
              <span className="rag-scan-badge text-[10px] tracking-wider text-[var(--orange-deep)]">
                扫描中…
              </span>
            ) : hits.length > 0 ? (
              <span className="rounded-sm bg-[var(--orange-fog)] px-2 py-0.5 text-[10px] text-[var(--orange-deep)]">
                {hits.length} 条
              </span>
            ) : null}
          </div>

          {hits.length === 0 && !scanning ? (
            <p className="text-xs leading-6 text-[var(--muted)]">
              提问后此处闪现「答疑知识库 / 客舱案例库」命中片段，证明学伴有据可依。
            </p>
          ) : null}

          <ul className="space-y-2.5" key={flashKey}>
            {hits.map((h, i) => (
              <li
                key={`${flashKey}-${h.id}`}
                className="rag-hit rounded-sm border border-[var(--line)] bg-[var(--paper)]/80 p-3"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded-sm px-1.5 py-0.5 text-[9px] tracking-wider text-white",
                      h.library === "cabin"
                        ? "bg-[var(--orange-deep)]"
                        : "bg-[var(--orange)]",
                    )}
                  >
                    命中
                  </span>
                  <span className="text-[10px] text-[var(--orange-deep)]">
                    {h.kind_label}
                  </span>
                </div>
                <p className="mt-1.5 font-display text-sm text-[var(--ink)]">
                  {h.title}
                </p>
                <p className="mt-1 line-clamp-3 text-[11px] leading-5 text-[var(--muted)]">
                  「{h.quote}」
                </p>
                <p className="mt-1.5 text-[10px] text-[var(--muted)]">
                  来源 · {h.source}
                </p>
              </li>
            ))}
          </ul>

          {scanning ? (
            <div className="space-y-2" aria-hidden>
              {[0, 1].map((i) => (
                <div key={i} className="rag-skeleton h-16 rounded-sm" />
              ))}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
