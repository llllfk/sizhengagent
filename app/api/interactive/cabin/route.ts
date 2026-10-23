import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireStudent, requireStudentId } from "@/lib/auth/session";
import { submitCabinPerf } from "@/lib/interactive/rooms";
import { findStudent } from "@/lib/repo";

export async function POST(request: NextRequest) {
  try {
    const me = await requireStudent();
    const studentId = await requireStudentId();
    const body = await request.json();
    const roomId = String(body.room_id ?? "");
    const role = String(body.role ?? "乘务员");
    const performance = String(body.performance ?? "").trim();

    if (!roomId || !performance) {
      return NextResponse.json(
        { error: "room_id 与 performance 必填" },
        { status: 400 },
      );
    }

    const student = await findStudent(studentId);
    const result = submitCabinPerf({
      room_id: roomId,
      student_id: studentId,
      name: student?.name ?? me.display_name,
      role,
      performance,
    });

    if (!result) {
      return NextResponse.json(
        { error: "场次无效或非客舱模拟进行中" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      data: {
        room: result.room,
        feedback: result.item.feedback,
        plan: result.item.plan,
        case_id: result.room.cabin_case?.case_id,
      },
    });
  } catch (e) {
    return jsonError(e, "提交失败");
  }
}
