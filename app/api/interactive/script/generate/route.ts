import { NextRequest, NextResponse } from "next/server";
import { generateScript } from "@/lib/mock/interactive";

/** POST /api/interactive/script/generate */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const roomId = String(body.room_id ?? "");
    if (!roomId) {
      return NextResponse.json({ error: "room_id 必填" }, { status: 400 });
    }
    const room = generateScript(roomId);
    if (!room) {
      return NextResponse.json({ error: "场次不存在或非剧本模式" }, { status: 404 });
    }
    return NextResponse.json({
      data: {
        content_id: `script_${Date.now()}`,
        room_id: room.room_id,
        body: room.script_body,
        lines: room.script_lines.length,
      },
      mock: true,
    });
  } catch {
    return NextResponse.json({ error: "剧本生成失败" }, { status: 500 });
  }
}
