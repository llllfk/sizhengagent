"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { InteractiveKickoff } from "@/components/shared/InteractiveKickoff";
import { cn } from "@/lib/utils";

type Room = {
  room_id: string;
  mode: string;
  title: string;
  status: string;
  theme: string;
  script_lines: Array<{ name: string; sentence: string }>;
  script_body?: string;
  wordcard?: { term: string; hint: string };
  quiz_submits: unknown[];
  participants: number;
  cabin_case?: {
    case_id: string;
    title: string;
    scenario: string;
    roles: string[];
    focus: string;
  };
  cabin_perfs?: Array<{
    name: string;
    role: string;
    feedback: string;
    plan: string;
  }>;
  debate_background?: string;
  debate_tree?: { pro: string[]; con: string[] };
  debate_speeches?: Array<{
    name: string;
    side: "pro" | "con";
    content: string;
  }>;
};

type QuizItem = {
  id: string;
  stem: string;
  options: string[];
  difficulty: number;
};

export function InteractiveLive() {
  const [room, setRoom] = useState<Room | null>(null);
  const [sentence, setSentence] = useState("");
  const [scriptOut, setScriptOut] = useState("");
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{
    score: number;
    total: number;
    followup_prompt: string;
  } | null>(null);
  const [cabinRole, setCabinRole] = useState("乘务员");
  const [cabinText, setCabinText] = useState("");
  const [cabinFeedback, setCabinFeedback] = useState("");
  const [cabinPlan, setCabinPlan] = useState("");
  const [debateSide, setDebateSide] = useState<"pro" | "con">("pro");
  const [debateText, setDebateText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/interactive/rooms");
    const json = await res.json();
    const active = json.data?.active ?? null;
    setRoom(active);
    if (active?.mode === "quiz" && active.status === "live") {
      const p = await fetch(
        `/api/interactive/quiz/paper?room_id=${active.room_id}`,
      );
      if (p.ok) {
        const pj = await p.json();
        setQuizItems(pj.data.items ?? []);
      }
    } else {
      setQuizItems([]);
    }
    if (active?.script_body) setScriptOut(active.script_body);
    if (active?.mode === "cabin" && active.cabin_case?.roles?.length) {
      setCabinRole((r) =>
        active.cabin_case.roles.includes(r) ? r : active.cabin_case.roles[0],
      );
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = window.setInterval(() => void refresh(), 4000);
    return () => window.clearInterval(t);
  }, [refresh]);

  async function sendLine() {
    if (!room || !sentence.trim()) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/interactive/script/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: room.room_id,
          sentence: sentence.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "提交失败");
      setSentence("");
      setRoom(json.data);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "失败");
    } finally {
      setBusy(false);
    }
  }

  async function genScript() {
    if (!room) return;
    setBusy(true);
    try {
      const res = await fetch("/api/interactive/script/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: room.room_id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "生成失败");
      setScriptOut(json.data.body);
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "失败");
    } finally {
      setBusy(false);
    }
  }

  async function submitQuiz() {
    if (!room) return;
    setBusy(true);
    try {
      const res = await fetch("/api/interactive/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: room.room_id,
          answers,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "提交失败");
      setQuizResult(json.data);
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "失败");
    } finally {
      setBusy(false);
    }
  }

  async function submitCabin() {
    if (!room || !cabinText.trim()) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/interactive/cabin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: room.room_id,
          role: cabinRole,
          performance: cabinText.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "提交失败");
      setCabinFeedback(json.data.feedback);
      setCabinPlan(json.data.plan);
      setCabinText("");
      setRoom(json.data.room);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "失败");
    } finally {
      setBusy(false);
    }
  }

  async function submitDebate() {
    if (!room || !debateText.trim()) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/interactive/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: room.room_id,
          side: debateSide,
          content: debateText.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "提交失败");
      setDebateText("");
      setRoom(json.data);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "失败");
    } finally {
      setBusy(false);
    }
  }

  const kickoffToken =
    room && room.status === "live" ? room.room_id : null;

  if (!room || room.status !== "live") {
    const idleModes = [
      "客舱情景",
      "AI 剧本",
      "你比我猜",
      "闯关答题",
      "课堂辩论",
    ];
    return (
      <div className="relative overflow-hidden rounded-sm border border-[var(--line)] bg-gradient-to-br from-[var(--orange-fog)] via-white to-[var(--paper)] p-6">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
          style={{ background: "rgba(246,199,154,0.55)" }}
          aria-hidden
        />
        <div className="relative space-y-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--orange)] opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--orange)]" />
            </span>
            <p className="text-sm font-medium text-[var(--ink)]">
              等待教师一键发起 · 五式剧场待命
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {idleModes.map((m, i) => (
              <span
                key={m}
                className="animate-rise rounded-sm border border-[var(--orange)]/30 bg-white/90 px-3 py-2 text-xs text-[var(--orange-deep)] shadow-sm"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                {String(i + 1).padStart(2, "0")} · {m}
              </span>
            ))}
          </div>
          <p className="text-xs leading-6 text-[var(--muted)]">
            老师在「互动调度」发起后，这里会自动切换为 LIVE 参与面。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <InteractiveKickoff room={room} playToken={kickoffToken} />
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-sm bg-[var(--orange)] px-2 py-0.5 text-[11px] text-white">
          LIVE
        </span>
        <span className="font-display text-lg text-[var(--ink)]">
          {room.title}
        </span>
        <span className="text-xs text-[var(--muted)]">主题：{room.theme}</span>
        <span className="text-xs text-[var(--muted)]">
          参与 {room.participants} 人
        </span>
      </div>

      {msg ? <p className="text-xs text-[var(--vermilion)]">{msg}</p> : null}

      {room.mode === "script" ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)]">
            每人贡献一句，AI 将按「人物—冲突—转折—结局」合成完整剧本。
          </p>
          <ul className="max-h-40 space-y-2 overflow-y-auto rounded-sm border border-[var(--line)] bg-white p-3 text-sm">
            {room.script_lines.length === 0 ? (
              <li className="text-[var(--muted)]">还没有接龙，抢沙发吧</li>
            ) : (
              room.script_lines.map((l, i) => (
                <li key={`${i}-${l.sentence}`}>
                  <strong className="text-[var(--orange)]">{l.name}</strong>
                  <span className="text-[var(--ink)]"> ：{l.sentence}</span>
                </li>
              ))
            )}
          </ul>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-sm border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              placeholder="写下你的一句…"
              disabled={busy}
            />
            <Button type="button" onClick={() => void sendLine()} disabled={busy}>
              接龙
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => void genScript()}
              disabled={busy}
            >
              AI成剧
            </Button>
          </div>
          {scriptOut ? (
            <pre className="whitespace-pre-wrap rounded-sm border border-[var(--orange)]/25 bg-[var(--orange-fog)] p-4 text-xs leading-6 text-[var(--ink)]">
              {scriptOut}
            </pre>
          ) : null}
        </div>
      ) : null}

      {room.mode === "quiz" ? (
        <div className="space-y-4">
          {quizItems.map((q, qi) => (
            <div
              key={q.id}
              className="rounded-sm border border-[var(--line)] bg-white p-4"
            >
              <p className="text-sm font-medium text-[var(--ink)]">
                {qi + 1}. {q.stem}
              </p>
              <div className="mt-3 grid gap-2">
                {q.options.map((opt, oi) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() =>
                      setAnswers((a) => ({ ...a, [q.id]: oi }))
                    }
                    className={cn(
                      "border px-3 py-2 text-left text-xs transition",
                      answers[q.id] === oi
                        ? "border-[var(--orange)] bg-[var(--orange-fog)] text-[var(--orange-deep)]"
                        : "border-[var(--line)] hover:border-[var(--orange-soft)]",
                    )}
                  >
                    {String.fromCharCode(65 + oi)}. {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <Button type="button" onClick={() => void submitQuiz()} disabled={busy}>
            提交闯关
          </Button>
          {quizResult ? (
            <div className="rounded-sm border border-[var(--orange)]/30 bg-[var(--orange-fog)] p-4 text-sm">
              <p className="font-display text-[var(--orange-deep)]">
                得分 {quizResult.score} / {quizResult.total}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-[var(--ink)]">
                {quizResult.followup_prompt}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {room.mode === "wordcard" && room.wordcard ? (
        <div className="rounded-sm border border-[var(--line)] bg-white p-8 text-center">
          <p className="text-xs tracking-[0.3em] text-[var(--muted)]">本轮词卡</p>
          <p className="mt-3 font-brand text-4xl text-[var(--orange)]">
            {room.wordcard.term}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">{room.wordcard.hint}</p>
          <p className="mt-6 text-xs text-[var(--muted)]">
            请按老师指令比划或描述该词，本轮由课堂统一计时。
          </p>
        </div>
      ) : null}

      {room.mode === "cabin" && room.cabin_case ? (
        <div className="space-y-4">
          <div className="rounded-sm border border-[var(--line)] bg-white p-4">
            <p className="text-[10px] tracking-[0.25em] text-[var(--orange)]">
              案例 · {room.cabin_case.case_id}
            </p>
            <h3 className="mt-1 font-display text-lg text-[var(--ink)]">
              {room.cabin_case.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {room.cabin_case.scenario}
            </p>
            <p className="mt-2 text-xs text-[var(--orange-deep)]">
              聚焦：{room.cabin_case.focus}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {room.cabin_case.roles.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setCabinRole(r)}
                className={cn(
                  "rounded-sm border px-3 py-1.5 text-xs",
                  cabinRole === r
                    ? "border-[var(--orange)] bg-[var(--orange-fog)] text-[var(--orange-deep)]"
                    : "border-[var(--line)] text-[var(--muted)]",
                )}
              >
                {r}
              </button>
            ))}
          </div>

          <textarea
            className="min-h-28 w-full rounded-sm border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
            placeholder={`以「${cabinRole}」身份描述你的现场应对（说了什么、做了什么）…`}
            value={cabinText}
            onChange={(e) => setCabinText(e.target.value)}
            disabled={busy}
          />
          <Button type="button" onClick={() => void submitCabin()} disabled={busy}>
            提交扮演 · 获取点评
          </Button>

          {cabinFeedback ? (
            <div className="space-y-3">
              <pre className="whitespace-pre-wrap rounded-sm border border-[var(--orange)]/25 bg-[var(--orange-fog)] p-4 text-xs leading-6 text-[var(--ink)]">
                {cabinFeedback}
              </pre>
              <div className="rounded-sm border border-[var(--line)] bg-white p-4 text-sm">
                <p className="text-xs text-[var(--muted)]">修订预案建议</p>
                <pre className="mt-2 whitespace-pre-wrap text-xs leading-6 text-[var(--ink)]">
                  {cabinPlan}
                </pre>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {room.mode === "debate" ? (
        <div className="space-y-4">
          {room.debate_background ? (
            <pre className="whitespace-pre-wrap rounded-sm border border-[var(--line)] bg-white p-4 text-xs leading-6 text-[var(--ink)]">
              {room.debate_background}
            </pre>
          ) : null}

          {room.debate_tree ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-sm border border-[var(--orange)]/30 bg-[var(--orange-fog)] p-4">
                <p className="text-xs font-medium text-[var(--orange-deep)]">
                  正方论点树
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-[var(--ink)]">
                  {room.debate_tree.pro.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-sm border border-[var(--line)] bg-white p-4">
                <p className="text-xs font-medium text-[var(--ink)]">反方论点树</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-[var(--muted)]">
                  {room.debate_tree.con.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDebateSide("pro")}
              className={cn(
                "rounded-sm border px-3 py-1.5 text-xs",
                debateSide === "pro"
                  ? "border-[var(--orange)] bg-[var(--orange-fog)] text-[var(--orange-deep)]"
                  : "border-[var(--line)] text-[var(--muted)]",
              )}
            >
              正方发言
            </button>
            <button
              type="button"
              onClick={() => setDebateSide("con")}
              className={cn(
                "rounded-sm border px-3 py-1.5 text-xs",
                debateSide === "con"
                  ? "border-[var(--orange)] bg-[var(--orange-fog)] text-[var(--orange-deep)]"
                  : "border-[var(--line)] text-[var(--muted)]",
              )}
            >
              反方发言
            </button>
          </div>

          <textarea
            className="min-h-24 w-full rounded-sm border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
            placeholder="写出你的论点或反驳…"
            value={debateText}
            onChange={(e) => setDebateText(e.target.value)}
            disabled={busy}
          />
          <Button
            type="button"
            onClick={() => void submitDebate()}
            disabled={busy}
          >
            提交发言
          </Button>

          <ul className="max-h-48 space-y-2 overflow-y-auto rounded-sm border border-[var(--line)] bg-[var(--paper)] p-3 text-sm">
            {(room.debate_speeches ?? []).length === 0 ? (
              <li className="text-[var(--muted)]">暂无发言，来做第一个亮点</li>
            ) : (
              (room.debate_speeches ?? []).map((s, i) => (
                <li key={`${i}-${s.content.slice(0, 12)}`}>
                  <span
                    className={cn(
                      "mr-2 text-[11px]",
                      s.side === "pro"
                        ? "text-[var(--orange)]"
                        : "text-[var(--muted)]",
                    )}
                  >
                    [{s.side === "pro" ? "正方" : "反方"}]
                  </span>
                  <strong>{s.name}</strong>
                  <span> ：{s.content}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
