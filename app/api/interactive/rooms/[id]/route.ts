import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireTeacher, requireUser } from "@/lib/auth/session";
import { endRoom, getRoom } from "@/lib/interactive/rooms";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser();
    const { id } = await params;
    const room = getRoom(id);
    if (!room) {
      return NextResponse.json({ error: "场次不存在" }, { status: 404 });
    }
    return NextResponse.json({ data: room });
  } catch (e) {
    return jsonError(e, "读取场次失败");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireTeacher();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    if (body?.action === "end") {
      const room = endRoom(id);
      if (!room) {
        return NextResponse.json({ error: "场次不存在" }, { status: 404 });
      }
      return NextResponse.json({ data: room });
    }
    return NextResponse.json({ error: "不支持的操作" }, { status: 400 });
  } catch (e) {
    return jsonError(e, "更新场次失败");
  }
}
