import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import {
  interactiveDisplayName,
  requireInteractiveActor,
  requireInteractiveActorId,
} from "@/lib/auth/session";
import { collectScriptLine, getRoom } from "@/lib/interactive/rooms";
import { findStudent } from "@/lib/repo";

export async function POST(request: NextRequest) {
  try {
    const me = await requireInteractiveActor();
    const actorId = await requireInteractiveActorId();
    const body = await request.json();
    const roomId = String(body.room_id ?? "");
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

    const student =
      me.role === "student" ? await findStudent(actorId) : null;
    const updated = collectScriptLine({
      room_id: roomId,
      student_id: actorId,
      name: interactiveDisplayName(me, student?.name),
      sentence,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "当前非剧本接龙进行中" },
        { status: 400 },
      );
    }

    return NextResponse.json({ data: updated }, { status: 201 });
  } catch (e) {
    return jsonError(e, "收集失败");
  }
}
