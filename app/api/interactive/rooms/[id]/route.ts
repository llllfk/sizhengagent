import { NextRequest, NextResponse } from "next/server";
import { endRoom, getRoom } from "@/lib/mock/interactive";

/** GET /api/interactive/rooms/:id */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const room = getRoom(id);
  if (!room) {
    return NextResponse.json({ error: "场次不存在" }, { status: 404 });
  }
  return NextResponse.json({ data: room, mock: true });
}

/** PATCH /api/interactive/rooms/:id — 结束场次 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  if (body?.action === "end") {
    const room = endRoom(id);
    if (!room) {
      return NextResponse.json({ error: "场次不存在" }, { status: 404 });
    }
    return NextResponse.json({ data: room, mock: true });
  }
  return NextResponse.json({ error: "不支持的操作" }, { status: 400 });
}
