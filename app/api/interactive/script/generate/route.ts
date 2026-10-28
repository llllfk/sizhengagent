import { NextRequest, NextResponse } from "next/server";
import { contentSafetyGate } from "@/lib/ai";
import { jsonError } from "@/lib/api/errors";
import { getSessionUser, requireUser } from "@/lib/auth/session";
import { generateWorkshopCopy } from "@/lib/content/video";
import { generateScript, getRoom, scriptLineDigest } from "@/lib/interactive/rooms";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    await requireUser();
    const body = await request.json();
    const roomId = String(body.room_id ?? "");
    if (!roomId) {
      return NextResponse.json({ error: "room_id 必填" }, { status: 400 });
    }
    const current = getRoom(roomId);
    if (!current || current.mode !== "script") {
      return NextResponse.json({ error: "场次不存在或非剧本模式" }, { status: 404 });
    }

    const session = await getSessionUser();
    const studentId =
      session?.student_id || session?.username || session?.user_id || "class";
    const gen = await generateWorkshopCopy({
      kind: "play",
      theme: current.theme,
      valuePoint: "人民至上 · 安全优先",
      script: scriptLineDigest(current),
      studentId,
    });
    const gated = contentSafetyGate(gen.text);
    if (!gated.ok) {
      return NextResponse.json(
        { error: gated.reason, safety: gated },
        { status: 422 },
      );
    }

    const room = generateScript(roomId, gated.text);
    if (!room) {
      return NextResponse.json({ error: "场次不存在或非剧本模式" }, { status: 404 });
    }
    return NextResponse.json({
      data: {
        content_id: `script_${Date.now()}`,
        room_id: room.room_id,
        body: room.script_body,
        lines: room.script_lines.length,
        gen_source: gen.source,
      },
    });
  } catch (e) {
    return jsonError(e, "剧本生成失败");
  }
}
