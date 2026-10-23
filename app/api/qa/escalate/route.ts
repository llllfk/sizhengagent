import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireStudentId } from "@/lib/auth/session";
import { createEscalation, getSession } from "@/lib/repo";

export async function POST(request: NextRequest) {
  try {
    const studentId = await requireStudentId();
    const body = await request.json();
    const sessionId = String(body.session_id ?? "");
    const summary = String(body.summary ?? "").trim();

    if (!sessionId) {
      return NextResponse.json({ error: "session_id 必填" }, { status: 400 });
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "会话不存在" }, { status: 404 });
    }
    if (session.student_id !== studentId) {
      return NextResponse.json({ error: "无权转接此会话" }, { status: 403 });
    }

    const item = await createEscalation({
      session_id: sessionId,
      student_id: studentId,
      summary:
        summary ||
        `手动转接：${session.question?.slice(0, 40) ?? "未命名议题"}`,
    });

    return NextResponse.json({ data: item }, { status: 201 });
  } catch (e) {
    return jsonError(e, "转接失败");
  }
}
