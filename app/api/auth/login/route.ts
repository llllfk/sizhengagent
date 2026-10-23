import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import {
  encodeSession,
  parsePortal,
  sessionCookieName,
  sessionCookieOptions,
  SESSION_COOKIE,
  type PortalKind,
} from "@/lib/auth/session";
import { ensurePg } from "@/lib/repo/ensure";
import { authenticate } from "@/lib/repo/users";
import { DbUnavailableError } from "@/lib/repo";

export async function POST(request: NextRequest) {
  try {
    const ok = await ensurePg();
    if (!ok) throw new DbUnavailableError();

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

    const token = encodeSession(user);
    const res = NextResponse.json({
      data: { user, href, portal },
    });
    // 分端写入，不覆盖另一端，便于同浏览器双开师生
    res.cookies.set(sessionCookieName(portal), token, sessionCookieOptions);
    // 清掉旧版单 cookie，避免后登录的一端覆盖前一端的「当前身份」误读
    res.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch (e) {
    return jsonError(e, "登录失败");
  }
}
