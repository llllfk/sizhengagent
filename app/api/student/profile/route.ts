import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireStudentId, requireTeacher } from "@/lib/auth/session";
import { findStudent, listStudents } from "@/lib/repo";

export async function GET(request: NextRequest) {
  try {
    const paramId = request.nextUrl.searchParams.get("student_id");
    const studentId = paramId || (await requireStudentId());
    if (paramId) {
      // 指定学号：教师可查任意；学生只能查自己
      try {
        await requireTeacher();
      } catch {
        const mine = await requireStudentId();
        if (paramId !== mine) {
          return NextResponse.json({ error: "只能查看本人画像" }, { status: 403 });
        }
      }
    }
    const profile = await findStudent(studentId);
    if (!profile) {
      return NextResponse.json({ error: "未找到学员" }, { status: 404 });
    }
    return NextResponse.json({ data: profile });
  } catch (e) {
    return jsonError(e, "读取画像失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireTeacher();
    const body = await request.json().catch(() => ({}));
    if (body?.list) {
      return NextResponse.json({ data: await listStudents() });
    }
    return NextResponse.json({ error: "unsupported" }, { status: 400 });
  } catch (e) {
    return jsonError(e, "读取列表失败");
  }
}
