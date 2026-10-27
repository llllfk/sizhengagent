import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { parsePortal, requireUser } from "@/lib/auth/session";
import { ensurePg } from "@/lib/repo/ensure";
import { DbUnavailableError } from "@/lib/repo";
import { changeOwnPassword } from "@/lib/repo/users";

/** 登录用户修改本人密码（需验证当前密码） */
export async function POST(request: NextRequest) {
  try {
    if (!(await ensurePg())) throw new DbUnavailableError();
    const portal = parsePortal(request.nextUrl.searchParams.get("portal"));
    const me = await requireUser(portal);
    const body = await request.json().catch(() => ({}));
    const currentPassword = String(body.current_password ?? "");
    const newPassword = String(body.new_password ?? "");
    const confirmPassword = String(body.confirm_password ?? newPassword);

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "请填写当前密码与新密码" },
        { status: 400 },
      );
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "两次新密码不一致" }, { status: 400 });
    }

    const result = await changeOwnPassword(
      me.user_id,
      currentPassword,
      newPassword,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ data: { ok: true } });
  } catch (e) {
    return jsonError(e, "修改密码失败");
  }
}
