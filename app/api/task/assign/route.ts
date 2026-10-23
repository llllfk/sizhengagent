import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireStudentId } from "@/lib/auth/session";
import { assignTask, listTasks, updateTask } from "@/lib/repo";
import type { StudentTypeTag } from "@/types";

export async function GET() {
  try {
    const studentId = await requireStudentId();
    return NextResponse.json({ data: await listTasks(studentId) });
  } catch (e) {
    return jsonError(e, "读取任务失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    const studentId = await requireStudentId();
    const body = await request.json().catch(() => ({}));
    const typeTag = body.type_tag
      ? (String(body.type_tag) as StudentTypeTag)
      : undefined;
    const task = await assignTask(studentId, typeTag);
    return NextResponse.json({ data: task }, { status: 201 });
  } catch (e) {
    return jsonError(e, "任务分发失败");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const studentId = await requireStudentId();
    const body = await request.json();
    const taskId = String(body.task_id ?? "");
    if (!taskId) {
      return NextResponse.json({ error: "task_id 必填" }, { status: 400 });
    }
    const mine = await listTasks(studentId);
    if (!mine.some((t) => t.task_id === taskId)) {
      return NextResponse.json({ error: "无权更新此任务" }, { status: 403 });
    }
    const updated = await updateTask(taskId, {
      status: body.status,
      progress: body.progress != null ? Number(body.progress) : undefined,
    });
    if (!updated) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }
    return NextResponse.json({ data: updated });
  } catch (e) {
    return jsonError(e, "更新失败");
  }
}
