import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireTeacher, studentIdFromSession } from "@/lib/auth/session";
import { archiveWork, listWorks, saveVideoStep } from "@/lib/repo";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("student_id");
    let studentId: string | undefined;
    try {
      studentId = await studentIdFromSession();
    } catch {
      await requireTeacher();
      studentId = q ?? undefined;
    }
    return NextResponse.json({
      data: await listWorks(studentId),
    });
  } catch (e) {
    return jsonError(e, "读取作品失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    const studentId = await studentIdFromSession();
    const body = await request.json();
    const type = String(body.type ?? "short_video");
    const title = String(body.title ?? "未命名作品").trim();
    const fileUri = String(body.file_uri ?? "").trim();

    if (!fileUri) {
      return NextResponse.json(
        { error: "file_uri 必填" },
        { status: 400 },
      );
    }

    const work = await archiveWork({
      student_id: studentId,
      type,
      title,
      file_uri: fileUri,
    });

    await saveVideoStep(studentId, { file_uri: fileUri, step: 4 });

    return NextResponse.json(
      { data: { ...work, note: "已入库作品成果库" } },
      { status: 201 },
    );
  } catch (e) {
    return jsonError(e, "归档失败");
  }
}
