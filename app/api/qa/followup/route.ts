import { NextRequest, NextResponse } from "next/server";
import { contentSafetyGate, withAiDisclaimer } from "@/lib/ai";
import { jsonError } from "@/lib/api/errors";
import { requireQaActor, requireQaActorId } from "@/lib/auth/session";
import {
  chatWithCozeBot,
  cozeUserId,
  isCozeChatConfigured,
} from "@/lib/coze/chat";
import { withCompanionGuard } from "@/lib/content/companionPrompt";
import { FIXED_SCRIPT_THINK_MS } from "@/lib/content/fixedQaScript";
import { buildFollowupPrompt } from "@/lib/content/qaEngine";
import {
  appendFollowup,
  createEscalation,
  getSession,
  setCozeConversationId,
} from "@/lib/repo";

export const maxDuration = 25;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** 追问：固定链路继续脚本；开放题走 Coze */
export async function POST(request: NextRequest) {
  try {
    await requireQaActor();
    const myId = await requireQaActorId();
    const body = await request.json();
    const sessionId = String(body.session_id ?? "");
    const answer = String(body.answer ?? "").trim();

    if (!sessionId || !answer) {
      return NextResponse.json(
        { error: "session_id 与 answer 必填" },
        { status: 400 },
      );
    }

    const safety = contentSafetyGate(answer);
    if (!safety.ok) {
      return NextResponse.json(
        { error: safety.reason, safety },
        { status: 422 },
      );
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "会话不存在" }, { status: 404 });
    }
    if (session.student_id !== myId) {
      return NextResponse.json({ error: "无权操作此会话" }, { status: 403 });
    }

    const local = buildFollowupPrompt({
      openingQuestion: session.question,
      q_type: session.q_type,
      round: session.round,
      answer,
    });

    let prompt = local.prompt;
    let source: "fixed_script" | "coze" | "local" =
      local.mode === "fixed" ? "fixed_script" : "local";

    if (local.mode === "fixed") {
      await sleep(FIXED_SCRIPT_THINK_MS);
    }

    if (local.mode === "agent" && isCozeChatConfigured() && !local.shouldEscalate) {
      try {
        const coze = await chatWithCozeBot({
          message: withCompanionGuard(answer),
          userId: cozeUserId(session.student_id),
          conversationId: session.coze_conversation_id,
          maxPolls: 14,
          pollMs: 650,
        });
        const gated = contentSafetyGate(withAiDisclaimer(coze.content));
        prompt = gated.text;
        source = "coze";
        if (
          coze.conversationId &&
          coze.conversationId !== session.coze_conversation_id
        ) {
          await setCozeConversationId(sessionId, coze.conversationId);
        }
      } catch (e) {
        console.error("[qa/followup] Coze 回退本地追问", e);
      }
    }

    const updated = await appendFollowup(
      sessionId,
      answer,
      prompt,
      local.shouldEscalate,
    );

    let escalation = null;
    if (local.shouldEscalate) {
      escalation = await createEscalation({
        session_id: sessionId,
        student_id: session.student_id,
        summary: `学员就「${session.question.slice(0, 36)}」追问多轮后仍难形成可执行预案，已转入教师队列。`,
      });
    }

    return NextResponse.json({
      data: {
        session_id: sessionId,
        prompt,
        escalate_hint: local.shouldEscalate,
        escalate_note: local.escalateHint,
        escalation,
        retrieval: local.retrieval,
        round: updated?.round ?? session.round,
        status: updated?.status ?? session.status,
        source,
        script_index: local.script_index,
      },
    });
  } catch (e) {
    return jsonError(e, "追问失败");
  }
}
