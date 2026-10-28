import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireUser } from "@/lib/auth/session";
import { addReply, deleteReply, getReply, listReplies } from "@/lib/repo";

function authorIdsOf(me: {
  username: string;
  student_id: string | null;
}) {
  return [me.student_id, me.username].filter(Boolean) as string[];
}

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

/** DELETE ?reply_id= / body.reply_id — 仅跟帖人可删 */
export async function DELETE(request: NextRequest) {
  try {
    const me = await requireUser();
    const body =
      request.headers.get("content-type")?.includes("json")
        ? await request.json().catch(() => ({}))
        : {};
    const replyId = String(
      request.nextUrl.searchParams.get("reply_id") ??
        (body as { reply_id?: string }).reply_id ??
        "",
    ).trim();
    if (!replyId) {
      return NextResponse.json({ error: "reply_id 必填" }, { status: 400 });
    }
    const existing = await getReply(replyId);
    if (!existing) {
      return NextResponse.json({ error: "跟帖不存在" }, { status: 404 });
    }
    const mine = authorIdsOf(me);
    if (!mine.includes(existing.author_id)) {
      return NextResponse.json(
        { error: "只能删除自己的跟帖" },
        { status: 403 },
      );
    }
    const deleted = await deleteReply(replyId);
    return NextResponse.json({ data: deleted });
  } catch (e) {
    return jsonError(e, "删除跟帖失败");
  }
}
