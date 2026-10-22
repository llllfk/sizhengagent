import { NextRequest, NextResponse } from "next/server";
import { addReply, listReplies } from "@/lib/mock/community";

/** GET /api/forum/replies?topic_id= */
export async function GET(request: NextRequest) {
  const topicId = request.nextUrl.searchParams.get("topic_id");
  if (!topicId) {
    return NextResponse.json({ error: "topic_id 必填" }, { status: 400 });
  }
  return NextResponse.json({ data: listReplies(topicId), mock: true });
}

/** POST /api/forum/replies — 跟帖 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const topicId = String(body.topic_id ?? "").trim();
    const content = String(body.content ?? "").trim();
    if (!topicId || !content) {
      return NextResponse.json(
        { error: "topic_id 与 content 必填" },
        { status: 400 },
      );
    }
    const reply = addReply({
      topic_id: topicId,
      content,
      author_id: body.author_id ? String(body.author_id) : undefined,
      author_name: body.author_name ? String(body.author_name) : undefined,
      author_role: body.author_role === "teacher" ? "teacher" : "student",
    });
    if (!reply) {
      return NextResponse.json({ error: "议题不存在" }, { status: 404 });
    }
    return NextResponse.json({ data: reply, mock: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "跟帖失败" }, { status: 500 });
  }
}
