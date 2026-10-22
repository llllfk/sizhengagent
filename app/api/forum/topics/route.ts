import { NextRequest, NextResponse } from "next/server";
import { createTopic, getTopic, listReplies, listTopics } from "@/lib/mock/community";

/** GET /api/forum/topics — 议题列表；?id= 拉详情含跟帖 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (id) {
    const topic = getTopic(id);
    if (!topic) {
      return NextResponse.json({ error: "议题不存在" }, { status: 404 });
    }
    return NextResponse.json({
      data: { ...topic, replies: listReplies(id) },
      mock: true,
    });
  }
  return NextResponse.json({ data: listTopics(), mock: true });
}

/** POST /api/forum/topics — 发起议题 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const content = String(body.body ?? body.content ?? "").trim();
    if (!title || !content) {
      return NextResponse.json({ error: "title 与 body 必填" }, { status: 400 });
    }
    const tags = Array.isArray(body.tags)
      ? body.tags.map(String).slice(0, 5)
      : undefined;
    const topic = createTopic({
      title,
      body: content,
      tags,
      author_id: body.author_id ? String(body.author_id) : undefined,
      author_name: body.author_name ? String(body.author_name) : undefined,
      author_role: body.author_role === "teacher" ? "teacher" : "student",
    });
    return NextResponse.json({ data: topic, mock: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "发帖失败" }, { status: 500 });
  }
}
