import { NextRequest, NextResponse } from "next/server";
import {
  getActiveRoom,
  getRoom,
  submitDebateSpeech,
  type DebateSide,
} from "@/lib/mock/interactive";
import { findStudent } from "@/lib/mock/store";

/** GET /api/interactive/debate?room_id= — 拉取辩题材料 */
export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get("room_id");
  const room = roomId ? getRoom(roomId) : getActiveRoom();
  if (!room || room.mode !== "debate") {
    return NextResponse.json({ error: "当前没有辩论场次" }, { status: 404 });
  }
  return NextResponse.json({
    data: {
      room_id: room.room_id,
      topic: room.theme,
      background: room.debate_background,
      argument_tree: room.debate_tree,
      speeches: room.debate_speeches,
    },
    mock: true,
  });
}

/** POST /api/interactive/debate — 提交发言 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const roomId = String(body.room_id ?? "");
    const studentId = String(body.student_id ?? "demo-student");
    const side = String(body.side ?? "pro") as DebateSide;
    const content = String(body.content ?? "").trim();

    if (!roomId || !content) {
      return NextResponse.json(
        { error: "room_id 与 content 必填" },
        { status: 400 },
      );
    }
    if (side !== "pro" && side !== "con") {
      return NextResponse.json({ error: "side 须为 pro 或 con" }, { status: 400 });
    }

    const student = findStudent(studentId);
    const room = submitDebateSpeech({
      room_id: roomId,
      student_id: studentId,
      name: student?.name ?? "演示学员",
      side,
      content,
    });

    if (!room) {
      return NextResponse.json({ error: "场次无效或非辩论进行中" }, { status: 400 });
    }

    return NextResponse.json({ data: room, mock: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "发言失败" }, { status: 500 });
  }
}
