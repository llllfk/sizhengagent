import { NextRequest, NextResponse } from "next/server";
import {
  getActiveRoom,
  listRooms,
  startRoom,
  type InteractiveMode,
} from "@/lib/mock/interactive";

/** GET /api/interactive/rooms — 当前场次与列表 */
export async function GET() {
  return NextResponse.json({
    data: {
      active: getActiveRoom(),
      rooms: listRooms().slice(0, 10),
    },
    mock: true,
  });
}

/** POST /api/interactive/rooms — 教师发起一场互动 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mode = String(body.mode ?? "") as InteractiveMode;
    const allowed: InteractiveMode[] = [
      "cabin",
      "script",
      "wordcard",
      "quiz",
      "debate",
    ];
    if (!allowed.includes(mode)) {
      return NextResponse.json({ error: "无效的互动模式" }, { status: 400 });
    }
    const room = startRoom(mode, body.theme ? String(body.theme) : undefined);
    return NextResponse.json({ data: room, mock: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "发起失败" }, { status: 500 });
  }
}
