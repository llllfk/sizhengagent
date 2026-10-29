import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireQaActorId } from "@/lib/auth/session";
import { getQaSession } from "@/lib/repo";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const studentId = await requireQaActorId();
    const { id } = await ctx.params;
    const session = await getQaSession(id);
    if (!session || session.student_id !== studentId) {
      return NextResponse.json({ error: "会话不存在" }, { status: 404 });
    }
    return NextResponse.json({ data: session });
  } catch (e) {
    return jsonError(e, "读取答疑失败");
  }
}
