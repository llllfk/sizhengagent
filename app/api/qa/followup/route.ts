import { NextRequest, NextResponse } from "next/server";
import { contentSafetyGate } from "@/lib/ai";
import { jsonError } from "@/lib/api/errors";
import { requireStudent } from "@/lib/auth/session";
import { buildFollowupPrompt } from "@/lib/content/qaEngine";
import { retrieveForQuestion } from "@/lib/content/retrieval";
import {
  appendFollowup,
  createEscalation,
  getSession,
} from "@/lib/repo";

export async function POST(request: NextRequest) {
  try {
    const me = await requireStudent();
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
    const myId = me.student_id || me.username;
    if (session.student_id !== myId) {
      return NextResponse.json({ error: "无权操作此会话" }, { status: 403 });
    }

    const { prompt, shouldEscalate } = buildFollowupPrompt({
      q_type: session.q_type,
      round: session.round,
      answer,
    });

    const updated = await appendFollowup(
      sessionId,
      answer,
      prompt,
      shouldEscalate,
    );

    let escalation = null;
    if (shouldEscalate) {
      escalation = await createEscalation({
        session_id: sessionId,
        student_id: session.student_id,
        summary: `学员就「${session.question.slice(0, 36)}」追问多轮后仍难形成可执行预案，已转入教师队列。`,
      });
    }

    const retrieval = retrieveForQuestion(
      `${session.question} ${answer}`,
      4,
    );

    return NextResponse.json({
      data: {
        session_id: sessionId,
        prompt,
        escalate_hint: shouldEscalate,
        escalation,
        retrieval,
        round: updated?.round ?? session.round,
        status: updated?.status ?? session.status,
      },
    });
  } catch (e) {
    return jsonError(e, "追问失败");
  }
}
