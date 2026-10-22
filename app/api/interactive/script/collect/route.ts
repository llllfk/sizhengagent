import { NextRequest, NextResponse } from "next/server";
import { collectScriptLine, getRoom } from "@/lib/mock/interactive";
import { findStudent } from "@/lib/mock/store";

/** POST /api/interactive/script/collect */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const roomId = String(body.room_id ?? "");
    const studentId = String(body.student_id ?? "demo-student");
    const sentence = String(body.sentence ?? "").trim();

    if (!roomId || !sentence) {
      return NextResponse.json(
        { error: "room_id 与 sentence 必填" },
        { status: 400 },
      );
    }

    const room = getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: "场次不存在" }, { status: 404 });
    }

    const student = findStudent(studentId);
    const updated = collectScriptLine({
      room_id: roomId,
      student_id: studentId,
      name: student?.name ?? "演示学员",
      sentence,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "当前场次不可接龙（需剧本模式且进行中）" },
        { status: 400 },
      );
    }

    return NextResponse.json({ data: updated, mock: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "收集失败" }, { status: 500 });
  }
}
