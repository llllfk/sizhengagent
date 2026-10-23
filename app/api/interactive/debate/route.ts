import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireStudent, requireUser } from "@/lib/auth/session";
import {
  getActiveRoom,
  getRoom,
  submitDebateSpeech,
  type DebateSide,
} from "@/lib/interactive/rooms";
import { findStudent } from "@/lib/repo";

export async function GET(request: NextRequest) {
  try {
    await requireUser();
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
    });
  } catch (e) {
    return jsonError(e, "读取辩论失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    const me = await requireStudent();
    const studentId = me.student_id || me.username;
    const body = await request.json();
    const roomId = String(body.room_id ?? "");
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

    const student = await findStudent(studentId);
    const room = submitDebateSpeech({
      room_id: roomId,
      student_id: studentId,
      name: student?.name ?? me.display_name,
      side,
      content,
    });

    if (!room) {
      return NextResponse.json(
        { error: "场次无效或非辩论进行中" },
        { status: 400 },
      );
    }

    return NextResponse.json({ data: room }, { status: 201 });
  } catch (e) {
    return jsonError(e, "发言失败");
  }
}
