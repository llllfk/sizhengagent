"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { SAFETY_DEMO_SAMPLES } from "@/lib/ai";
import { DEMO_PROMPTS } from "@/lib/mock/qaEngine";

type Msg = {
  role: "user" | "assistant" | "system";
  content: string;
};

type SafetyBanner = {
  gate: "sensitive" | "value";
  reason: string;
  flagged: string[];
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

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || loading || escalated) return;
    setLoading(true);
    setSafety(null);
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");

    try {
      if (!sessionId) {
        const res = await fetch("/api/qa/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_id: "demo-student", question: text }),
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
          return;
        }
        if (!res.ok) throw new Error(json.error || "发起失败");
        setSessionId(json.data.session_id);
        setQType(json.data.q_type);
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
          return;
        }
        if (!res.ok) throw new Error(json.error || "追问失败");
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
    }
  }

  function reset() {
    setSessionId(null);
    setQType(null);
    setMessages([]);
    setEscalated(false);
    setInput("");
    setSafety(null);
  }

  return (
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
          <span className="text-[var(--muted)]">等待首问 · 双闸门已启用</span>
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
            内容安全 · {safety.gate === "sensitive" ? "敏感词闸门" : "价值导向闸门"}
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
              点选示例开场。价值/情境类走追问链；下方可演示双闸门拦截。
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
            <span className="inline-block animate-pulse">智能学伴思考中…</span>
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
          {loading ? "思考中" : "发送"}
        </Button>
      </div>
    </div>
  );
}
