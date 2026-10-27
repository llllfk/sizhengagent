import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireTeacher } from "@/lib/auth/session";
import { ensurePg } from "@/lib/repo/ensure";
import { DbUnavailableError } from "@/lib/repo";
import {
  createClass,
  deleteClass,
  ensureClassSeed,
  getClass,
  listClasses,
  listClassMembers,
  setClassMembers,
  updateClass,
} from "@/lib/repo/classes";
import { listStudents } from "@/lib/repo";

export async function GET(request: NextRequest) {
  try {
    if (!(await ensurePg())) throw new DbUnavailableError();
    await requireTeacher();
    await ensureClassSeed();
    const classId = request.nextUrl.searchParams.get("class_id");
    if (classId) {
      const item = await getClass(classId);
      if (!item) {
        return NextResponse.json({ error: "班级不存在" }, { status: 404 });
      }
      const members = await listClassMembers(classId);
      const students = await listStudents();
      return NextResponse.json({ data: { ...item, members, students } });
    }
    const [classes, students] = await Promise.all([
      listClasses(),
      listStudents(),
    ]);
    return NextResponse.json({ data: { classes, students } });
  } catch (e) {
    return jsonError(e, "读取班级失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await ensurePg())) throw new DbUnavailableError();
    const me = await requireTeacher();
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const code = body.code ? String(body.code).trim() : "";
    const remark = body.remark ? String(body.remark) : "";
    if (!name) {
      return NextResponse.json({ error: "班级名称必填" }, { status: 400 });
    }
    const item = await createClass({
      name,
      code,
      remark,
      created_by: me.user_id,
    });
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "班级编号已存在" }, { status: 409 });
    }
    return jsonError(e, "创建班级失败");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await ensurePg())) throw new DbUnavailableError();
    await requireTeacher();
    const body = await request.json();
    const classId = String(body.class_id ?? "").trim();
    if (!classId) {
      return NextResponse.json({ error: "class_id 必填" }, { status: 400 });
    }
    if (Array.isArray(body.student_ids)) {
      const updated = await setClassMembers(
        classId,
        body.student_ids.map((id: unknown) => String(id)),
      );
      if (!updated) {
        return NextResponse.json({ error: "班级不存在" }, { status: 404 });
      }
      return NextResponse.json({ data: updated });
    }
    const updated = await updateClass(classId, {
      name: body.name != null ? String(body.name) : undefined,
      code: body.code != null ? String(body.code) : undefined,
      remark: body.remark != null ? String(body.remark) : undefined,
    });
    if (!updated) {
      return NextResponse.json({ error: "班级不存在" }, { status: 404 });
    }
    return NextResponse.json({ data: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "班级编号已存在" }, { status: 409 });
    }
    return jsonError(e, "更新班级失败");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await ensurePg())) throw new DbUnavailableError();
    await requireTeacher();
    const classId =
      request.nextUrl.searchParams.get("class_id") ||
      String((await request.json().catch(() => ({}))).class_id ?? "");
    if (!classId) {
      return NextResponse.json({ error: "class_id 必填" }, { status: 400 });
    }
    const ok = await deleteClass(classId);
    if (!ok) {
      return NextResponse.json({ error: "班级不存在" }, { status: 404 });
    }
    return NextResponse.json({ data: { ok: true } });
  } catch (e) {
    return jsonError(e, "删除班级失败");
  }
}
