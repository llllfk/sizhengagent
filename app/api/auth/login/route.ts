import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import {
  encodeSession,
  parsePortal,
  sessionCookieName,
  sessionCookieOptions,
  type PortalKind,
} from "@/lib/auth/session";
import { hasDb } from "@/lib/db";
import { authenticate, recordLogin } from "@/lib/repo/users";
import { DbUnavailableError } from "@/lib/repo";

/** 登录只验账号密码，不灌库、不跑种子 */
export async function POST(request: NextRequest) {
  try {
    if (!hasDb()) throw new DbUnavailableError();

    const body = await request.json();
    const username = String(body.username ?? body.account ?? "").trim();
    const password = String(body.password ?? "");
    const portal =
      parsePortal(String(body.portal ?? "student")) ?? ("student" as PortalKind);

    if (!username || !password) {
      return NextResponse.json({ error: "请填写账号与密码" }, { status: 400 });
    }

    const user = await authenticate(username, password);
    if (!user) {
      return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
    }

    if (portal === "teacher" && user.role !== "teacher") {
      return NextResponse.json(
        { error: "该账号不是教师，请选择「学生学伴」或「研讨社区」" },
        { status: 403 },
      );
    }
    if (portal === "student" && user.role !== "student") {
      return NextResponse.json(
        { error: "该账号不是学生，请选择「教师工作台」或「研讨社区」" },
        { status: 403 },
      );
    }

    const href =
      portal === "teacher"
        ? "/workbench"
        : portal === "community"
          ? "/forum"
          : "/companion";

    try {
      await recordLogin({
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        portal,
      });
    } catch (err) {
      console.error("[login] 写入登录记录失败", err);
    }

    const token = encodeSession(user);
    const res = NextResponse.json({
      data: { user, href, portal },
    });
    // 只写一条分端 Cookie。同响应写两条 Set-Cookie 时，
    // Coze CDN 常拼成一行，浏览器判无效 → 进页后 /api/auth/me 401 又踢回登录。
    res.cookies.set(sessionCookieName(portal), token, sessionCookieOptions);
    return res;
  } catch (e) {
    return jsonError(e, "登录失败");
  }
}
