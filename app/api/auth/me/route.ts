import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { getSessionUser, parsePortal } from "@/lib/auth/session";
import { ensurePg } from "@/lib/repo/ensure";
import { DbUnavailableError } from "@/lib/repo";

export async function GET(request: NextRequest) {
  try {
    const ok = await ensurePg();
    if (!ok) throw new DbUnavailableError();
    const portal = parsePortal(request.nextUrl.searchParams.get("portal"));
    const user = await getSessionUser(portal);
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json({ data: user, portal: portal ?? null });
  } catch (e) {
    return jsonError(e, "读取会话失败");
  }
}
