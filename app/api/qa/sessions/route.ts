import { NextRequest, NextResponse } from "next/server";
import { contentSafetyGate, withAiDisclaimer } from "@/lib/ai";
import { jsonError } from "@/lib/api/errors";
import { requireStudentId } from "@/lib/auth/session";
import {
  chatWithCozeBot,
  cozeUserId,
  isCozeChatConfigured,
} from "@/lib/coze/chat";
import { buildFirstPrompt } from "@/lib/content/qaEngine";
import { retrieveForQuestion } from "@/lib/content/retrieval";
import { createSession, findStudent } from "@/lib/repo";

/** Coze 知识库召回可能较慢 */
export const maxDuration = 90;

export async function POST(request: NextRequest) {
  try {
    const studentId = await requireStudentId();
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
    let source: "coze" | "local" = "local";

    if (isCozeChatConfigured()) {
      try {
        const coze = await chatWithCozeBot({
          message: question,
          userId: cozeUserId(studentId),
        });
        const gated = contentSafetyGate(withAiDisclaimer(coze.content));
        prompt = gated.text;
        cozeConversationId = coze.conversationId;
        source = "coze";
      } catch (e) {
        console.error("[qa/sessions] Coze 回退本地追问", e);
      }
    }

    const retrieval =
      stub.retrieval.length > 0
        ? stub.retrieval
        : retrieveForQuestion(question, 4);

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
          retrieval,
          status: session.status,
          source,
        },
      },
      { status: 201 },
    );
  } catch (e) {
    return jsonError(e, "发起答疑失败");
  }
}
