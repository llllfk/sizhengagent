import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireTeacher } from "@/lib/auth/session";
import { ensurePg } from "@/lib/repo/ensure";
import { DbUnavailableError } from "@/lib/repo";
import { listLoginEvents } from "@/lib/repo/users";

/** GET /api/teacher/accounts/logins?user_id= */
export async function GET(request: NextRequest) {
  try {
    if (!(await ensurePg())) throw new DbUnavailableError();
    await requireTeacher();
    const userId = request.nextUrl.searchParams.get("user_id")?.trim() ?? "";
    if (!userId) {
      return NextResponse.json({ error: "user_id 必填" }, { status: 400 });
    }
    const events = await listLoginEvents(userId, 80);
    return NextResponse.json({ data: { events, total: events.length } });
  } catch (e) {
    return jsonError(e, "读取登录记录失败");
  }
}
