import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { getSessionUser, parsePortal } from "@/lib/auth/session";

/** 会话在 Cookie 里自包含签名，读身份不必先连库（避免库抖动被当成「未登录」） */
export async function GET(request: NextRequest) {
  try {
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
