import { NextRequest, NextResponse } from "next/server";
import { contentSafetyGate } from "@/lib/ai";
import { buildFirstPrompt } from "@/lib/mock/qaEngine";
import { createSession, findStudent } from "@/lib/mock/store";

/** POST /api/qa/sessions — 发起答疑会话，返回首轮追问 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const studentId = String(body.student_id ?? "demo-student");
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

    const { q_type, prompt } = buildFirstPrompt(question);
    const session = createSession({
      student_id: studentId,
      question,
      q_type,
      firstPrompt: prompt,
    });
    const student = findStudent(studentId);

    return NextResponse.json(
      {
        data: {
          session_id: session.session_id,
          student_id: studentId,
          student_name: student?.name ?? studentId,
          q_type,
          prompt,
          status: session.status,
          created_at: session.messages[0]?.at,
          mock: true,
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "发起答疑失败" }, { status: 500 });
  }
}
