import { NextRequest, NextResponse } from "next/server";
import { contentSafetyGate, withAiDisclaimer } from "@/lib/ai";
import { jsonError } from "@/lib/api/errors";
import { requireQaActorId } from "@/lib/auth/session";
import {
  chatWithCozeBot,
  cozeUserId,
  isCozeChatConfigured,
} from "@/lib/coze/chat";
import { withCompanionGuard } from "@/lib/content/companionPrompt";
import { buildFirstPrompt } from "@/lib/content/qaEngine";
import { createSession, findStudent } from "@/lib/repo";

export const maxDuration = 25;

/** 首轮：固定脚本问 → 固定答；其余 → Coze 智能体（失败回落本地） */
export async function POST(request: NextRequest) {
  try {
    const studentId = await requireQaActorId();
    const body = await request.json();
    const question = String(body.question ?? "").trim();

    if (!question) {
      return NextResponse.json({ error: "question 必填" }, { status: 400 });
    }

    const safety = contentSafetyGate(question);
    if (!safety.ok) {
      return NextResponse.json(
        { error: safety.reason, safety },
        { status: 422 },
      );
    }

    const stub = buildFirstPrompt(question);
    let prompt = stub.prompt;
    let cozeConversationId: string | null = null;
    let source: "fixed_script" | "coze" | "local" =
      stub.mode === "fixed" ? "fixed_script" : "local";

    if (stub.mode === "agent" && isCozeChatConfigured()) {
      try {
        const coze = await chatWithCozeBot({
          message: withCompanionGuard(question),
          userId: cozeUserId(studentId),
          maxPolls: 14,
          pollMs: 650,
        });
        const gated = contentSafetyGate(withAiDisclaimer(coze.content));
        prompt = gated.text;
        cozeConversationId = coze.conversationId;
        source = "coze";
      } catch (e) {
        console.error("[qa/sessions] Coze 回退本地追问", e);
      }
    }

    const session = await createSession({
      student_id: studentId,
      question,
      q_type: stub.q_type,
      firstPrompt: prompt,
      coze_conversation_id: cozeConversationId,
    });
    const student = await findStudent(studentId);

    return NextResponse.json(
      {
        data: {
          session_id: session.session_id,
          student_id: studentId,
          student_name: student?.name ?? studentId,
          q_type: stub.q_type,
          prompt,
          retrieval: stub.retrieval,
          status: session.status,
          source,
          script_index: stub.script_index,
        },
      },
      { status: 201 },
    );
  } catch (e) {
    return jsonError(e, "发起答疑失败");
  }
}
