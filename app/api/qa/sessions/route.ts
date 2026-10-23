import { NextRequest, NextResponse } from "next/server";
import { contentSafetyGate } from "@/lib/ai";
import { jsonError } from "@/lib/api/errors";
import { requireStudentId } from "@/lib/auth/session";
import { buildFirstPrompt } from "@/lib/content/qaEngine";
import { createSession, findStudent } from "@/lib/repo";

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

    const { q_type, prompt, retrieval } = buildFirstPrompt(question);
    const session = await createSession({
      student_id: studentId,
      question,
      q_type,
      firstPrompt: prompt,
    });
    const student = await findStudent(studentId);

    return NextResponse.json(
      {
        data: {
          session_id: session.session_id,
          student_id: studentId,
          student_name: student?.name ?? studentId,
          q_type,
          prompt,
          retrieval,
          status: session.status,
        },
      },
      { status: 201 },
    );
  } catch (e) {
    return jsonError(e, "发起答疑失败");
  }
}
