import { NextRequest, NextResponse } from "next/server";
import { createEscalation, getSession } from "@/lib/mock/store";

/** POST /api/qa/escalate — 触发疑难转接，写入教师工作台队列 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = String(body.session_id ?? "");
    const studentId = String(body.student_id ?? "");
    const summary = String(body.summary ?? "").trim();

    if (!sessionId || !studentId) {
      return NextResponse.json(
        { error: "session_id、student_id 必填" },
        { status: 400 },
      );
    }

    const session = getSession(sessionId);
    const item = createEscalation({
      session_id: sessionId,
      student_id: studentId,
      summary:
        summary ||
        `手动转接：${session?.question?.slice(0, 40) ?? "未命名议题"}`,
    });

    return NextResponse.json({ data: { ...item, mock: true } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "转接失败" }, { status: 500 });
  }
}
