import { NextRequest, NextResponse } from "next/server";
import { contentSafetyGate } from "@/lib/ai";
import { buildFollowupPrompt } from "@/lib/mock/qaEngine";
import {
  appendFollowup,
  createEscalation,
  getSession,
} from "@/lib/mock/store";

/** POST /api/qa/followup — 提交学生答复，AI 生成下一轮追问 */
export async function POST(request: NextRequest) {
  try {
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

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "会话不存在" }, { status: 404 });
    }

    const { prompt, shouldEscalate } = buildFollowupPrompt({
      q_type: session.q_type,
      round: session.round,
      answer,
    });

    appendFollowup(sessionId, answer, prompt, shouldEscalate);

    let escalation = null;
    if (shouldEscalate) {
      escalation = createEscalation({
        session_id: sessionId,
        student_id: session.student_id,
        summary: `学员就「${session.question.slice(0, 36)}」追问多轮后仍难形成可执行预案，已转入教师队列。`,
      });
    }

    return NextResponse.json({
      data: {
        session_id: sessionId,
        prompt,
        escalate_hint: shouldEscalate,
        escalation,
        round: session.round,
        status: session.status,
        mock: true,
      },
    });
  } catch {
    return NextResponse.json({ error: "追问失败" }, { status: 500 });
  }
}
