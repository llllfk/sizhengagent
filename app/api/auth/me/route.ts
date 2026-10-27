import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { getSessionUser, parsePortal } from "@/lib/auth/session";
import { hasDb } from "@/lib/db";
import { findStudentClass } from "@/lib/repo/users";

/** 会话在 Cookie 里自包含签名，读身份不必先连库（避免库抖动被当成「未登录」） */
export async function GET(request: NextRequest) {
  try {
    const portal = parsePortal(request.nextUrl.searchParams.get("portal"));
    const user = await getSessionUser(portal);
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    let classInfo: {
      class_id: string | null;
      class_name: string | null;
      class_code: string | null;
    } = { class_id: null, class_name: null, class_code: null };

    if (user.role === "student" && hasDb()) {
      const sid = user.student_id || user.username;
      if (sid) {
        try {
          classInfo = (await findStudentClass(sid)) ?? classInfo;
        } catch {
          /* 班级查询失败不影响登录态 */
        }
      }
    }

    return NextResponse.json({
      data: { ...user, ...classInfo },
      portal: portal ?? null,
    });
  } catch (e) {
    return jsonError(e, "读取会话失败");
  }
}
