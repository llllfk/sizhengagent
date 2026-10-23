import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireTeacher } from "@/lib/auth/session";
import { ensurePg } from "@/lib/repo/ensure";
import { DbUnavailableError } from "@/lib/repo";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from "@/lib/repo/users";

export async function GET() {
  try {
    if (!(await ensurePg())) throw new DbUnavailableError();
    await requireTeacher();
    return NextResponse.json({ data: await listUsers() });
  } catch (e) {
    return jsonError(e, "读取账号失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await ensurePg())) throw new DbUnavailableError();
    await requireTeacher();
    const body = await request.json();
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");
    const role = String(body.role ?? "student") as "teacher" | "student";
    const displayName = String(body.display_name ?? "").trim();
    const studentId = body.student_id ? String(body.student_id).trim() : null;

    if (!username || !password || !displayName) {
      return NextResponse.json(
        { error: "username、password、display_name 必填" },
        { status: 400 },
      );
    }
    if (role !== "teacher" && role !== "student") {
      return NextResponse.json({ error: "role 无效" }, { status: 400 });
    }

    const user = await createUser({
      username,
      password,
      role,
      display_name: displayName,
      student_id: studentId,
    });
    return NextResponse.json({ data: user }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "账号已存在" }, { status: 409 });
    }
    return jsonError(e, "创建账号失败");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await ensurePg())) throw new DbUnavailableError();
    await requireTeacher();
    const body = await request.json();
    const userId = String(body.user_id ?? "");
    if (!userId) {
      return NextResponse.json({ error: "user_id 必填" }, { status: 400 });
    }
    const updated = await updateUser(userId, {
      display_name: body.display_name != null ? String(body.display_name) : undefined,
      active: body.active != null ? Boolean(body.active) : undefined,
      password: body.password ? String(body.password) : undefined,
      student_id:
        body.student_id !== undefined
          ? body.student_id
            ? String(body.student_id)
            : null
          : undefined,
    });
    if (!updated) {
      return NextResponse.json({ error: "账号不存在" }, { status: 404 });
    }
    return NextResponse.json({ data: updated });
  } catch (e) {
    return jsonError(e, "更新失败");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await ensurePg())) throw new DbUnavailableError();
    const me = await requireTeacher();
    const userId =
      request.nextUrl.searchParams.get("user_id") ||
      String((await request.json().catch(() => ({}))).user_id ?? "");
    if (!userId) {
      return NextResponse.json({ error: "user_id 必填" }, { status: 400 });
    }
    if (userId === me.user_id) {
      return NextResponse.json({ error: "不能删除当前登录账号" }, { status: 400 });
    }
    const ok = await deleteUser(userId);
    if (!ok) {
      return NextResponse.json({ error: "账号不存在" }, { status: 404 });
    }
    return NextResponse.json({ data: { ok: true } });
  } catch (e) {
    return jsonError(e, "删除失败");
  }
}
