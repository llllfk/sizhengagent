import { NextRequest, NextResponse } from "next/server";
import { archiveWork, listWorks, saveVideoStep } from "@/lib/mock/tasks";

/** GET /api/works/upload?student_id= */
export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get("student_id") ?? undefined;
  return NextResponse.json({
    data: listWorks(studentId ?? undefined),
    mock: true,
  });
}

/** POST /api/works/upload — 作品归档 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const studentId = String(body.student_id ?? "demo-student");
    const type = String(body.type ?? "short_video");
    const title = String(body.title ?? "未命名作品").trim();
    const fileUri = String(body.file_uri ?? "").trim();

    if (!fileUri) {
      return NextResponse.json(
        { error: "file_uri 必填（演示可填任意路径）" },
        { status: 400 },
      );
    }

    const work = archiveWork({
      student_id: studentId,
      type,
      title,
      file_uri: fileUri,
    });

    saveVideoStep(studentId, { file_uri: fileUri, step: 4 });

    return NextResponse.json(
      {
        data: {
          ...work,
          note: "已入库作品成果库（Mock）",
        },
        mock: true,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "归档失败" }, { status: 500 });
  }
}
