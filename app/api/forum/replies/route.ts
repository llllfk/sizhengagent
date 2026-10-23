import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireUser } from "@/lib/auth/session";
import { addReply, listReplies } from "@/lib/repo";

export async function GET(request: NextRequest) {
  try {
    await requireUser();
    const topicId = request.nextUrl.searchParams.get("topic_id");
    if (!topicId) {
      return NextResponse.json({ error: "topic_id 必填" }, { status: 400 });
    }
    return NextResponse.json({ data: await listReplies(topicId) });
  } catch (e) {
    return jsonError(e, "读取跟帖失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    const me = await requireUser();
    const body = await request.json();
    const topicId = String(body.topic_id ?? "").trim();
    const content = String(body.content ?? "").trim();
    if (!topicId || !content) {
      return NextResponse.json(
        { error: "topic_id 与 content 必填" },
        { status: 400 },
      );
    }
    const reply = await addReply({
      topic_id: topicId,
      content,
      author_id: me.student_id || me.username,
      author_name: me.display_name,
      author_role: me.role === "teacher" ? "teacher" : "student",
    });
    if (!reply) {
      return NextResponse.json({ error: "议题不存在" }, { status: 404 });
    }
    return NextResponse.json({ data: reply }, { status: 201 });
  } catch (e) {
    return jsonError(e, "跟帖失败");
  }
}
