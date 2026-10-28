import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireTeacher } from "@/lib/auth/session";
import { TYPE_TAGS } from "@/lib/content/typeTags";
import { updateStudentType } from "@/lib/repo";
import type { StudentTypeTag } from "@/types";

export async function PATCH(request: NextRequest) {
  try {
    await requireTeacher();
    const body = await request.json();
    const studentId = String(body.student_id ?? "").trim();
    const typeTag = String(body.type_tag ?? "") as StudentTypeTag;
    if (
      !studentId ||
      (typeTag !== "untyped" && !TYPE_TAGS.includes(typeTag as (typeof TYPE_TAGS)[number]))
    ) {
      return NextResponse.json({ error: "学号与分型必填" }, { status: 400 });
    }
    const ok = await updateStudentType(studentId, typeTag);
    if (!ok) {
      return NextResponse.json({ error: "未找到该学员" }, { status: 404 });
    }
    return NextResponse.json({ data: { student_id: studentId, type_tag: typeTag } });
  } catch (e) {
    return jsonError(e, "更新画像失败");
  }
}
