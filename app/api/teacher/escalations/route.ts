import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireTeacher } from "@/lib/auth/session";
import {
  listEscalations,
  replyEscalation,
  updateEscalationStatus,
} from "@/lib/repo";

export async function GET() {
  try {
    await requireTeacher();
    return NextResponse.json({ data: await listEscalations() });
  } catch (e) {
    return jsonError(e, "读取转接队列失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    const teacher = await requireTeacher();
    const body = await request.json();
    const id = String(body.escalation_id ?? "");
    const reply = String(body.reply ?? "").trim();
    if (!id || !reply) {
      return NextResponse.json(
        { error: "请填写在线答复内容" },
        { status: 400 },
      );
    }
    const updated = await replyEscalation({
      escalation_id: id,
      reply,
      teacher_name: teacher.display_name || teacher.username,
    });
    if (!updated) {
      return NextResponse.json({ error: "未找到该转接" }, { status: 404 });
    }
    return NextResponse.json({ data: updated });
  } catch (e) {
    return jsonError(e, "在线答复失败");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireTeacher();
    const body = await request.json();
    const id = String(body.escalation_id ?? "");
    const status = String(body.teacher_status ?? "") as
      | "pending"
      | "accepted"
      | "scheduled"
      | "done";

    if (!id || !status) {
      return NextResponse.json(
        { error: "escalation_id 与 teacher_status 必填" },
        { status: 400 },
      );
    }

    const updated = await updateEscalationStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: "未找到该转接" }, { status: 404 });
    }
    return NextResponse.json({ data: updated });
  } catch (e) {
    return jsonError(e, "更新失败");
  }
}
