import { NextRequest, NextResponse } from "next/server";
import { assignTask, listTasks, updateTask } from "@/lib/mock/tasks";
import type { StudentTypeTag } from "@/types";

/** GET /api/task/assign?student_id= — 我的任务列表 */
export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get("student_id") ?? undefined;
  return NextResponse.json({
    data: listTasks(studentId ?? undefined),
    mock: true,
  });
}

/** POST /api/task/assign — 按画像推送分层任务 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const studentId = String(body.student_id ?? "demo-student");
    const typeTag = body.type_tag
      ? (String(body.type_tag) as StudentTypeTag)
      : undefined;
    const task = assignTask(studentId, typeTag);
    return NextResponse.json({ data: task, mock: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "任务分发失败" }, { status: 500 });
  }
}

/** PATCH /api/task/assign — 更新进度 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const taskId = String(body.task_id ?? "");
    if (!taskId) {
      return NextResponse.json({ error: "task_id 必填" }, { status: 400 });
    }
    const updated = updateTask(taskId, {
      status: body.status,
      progress:
        body.progress != null ? Number(body.progress) : undefined,
    });
    if (!updated) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }
    return NextResponse.json({ data: updated, mock: true });
  } catch {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
