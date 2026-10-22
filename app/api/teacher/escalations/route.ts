import { NextRequest, NextResponse } from "next/server";
import {
  findStudent,
  getStore,
  updateEscalationStatus,
} from "@/lib/mock/store";

/** GET /api/teacher/escalations — 教师端拉取疑难转接队列 */
export async function GET() {
  const list = getStore().escalations.map((e) => ({
    ...e,
    student_name: findStudent(e.student_id)?.name ?? e.student_id,
  }));
  return NextResponse.json({ data: list, mock: true });
}

/** PATCH /api/teacher/escalations — 更新处理状态 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = String(body.escalation_id ?? "");
    const status = String(body.teacher_status ?? "") as
      | "pending"
      | "accepted"
      | "scheduled"
      | "done";

    if (!id || !status) {
      return NextResponse.json(
        { error: "escalation_id 与 teacher_status 必填" },
        { status: 400 },
      );
    }

    const updated = updateEscalationStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: "未找到该转接" }, { status: 404 });
    }
    return NextResponse.json({ data: updated, mock: true });
  } catch {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
