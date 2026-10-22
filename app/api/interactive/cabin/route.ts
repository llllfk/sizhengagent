import { NextRequest, NextResponse } from "next/server";
import { submitCabinPerf } from "@/lib/mock/interactive";
import { findStudent } from "@/lib/mock/store";

/** POST /api/interactive/cabin — 提交扮演并返回 AI 点评 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const roomId = String(body.room_id ?? "");
    const studentId = String(body.student_id ?? "demo-student");
    const role = String(body.role ?? "乘务员").trim();
    const performance = String(body.performance ?? "").trim();

    if (!roomId || !performance) {
      return NextResponse.json(
        { error: "room_id 与 performance 必填" },
        { status: 400 },
      );
    }

    const student = findStudent(studentId);
    const result = submitCabinPerf({
      room_id: roomId,
      student_id: studentId,
      name: student?.name ?? "演示学员",
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
        case_id: result.room.cabin_case?.case_id,
        feedback: result.item.feedback,
        plan: result.item.plan,
        room: result.room,
      },
      mock: true,
    });
  } catch {
    return NextResponse.json({ error: "点评失败" }, { status: 500 });
  }
}
