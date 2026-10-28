import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireStudentId } from "@/lib/auth/session";
import { listStudentEscalations } from "@/lib/repo";

export async function GET() {
  try {
    const studentId = await requireStudentId();
    const list = await listStudentEscalations(studentId);
    return NextResponse.json({
      data: list.filter((e) => e.teacher_reply),
    });
  } catch (e) {
    return jsonError(e, "读取教师答复失败");
  }
}
