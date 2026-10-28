import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireUser } from "@/lib/auth/session";
import {
  createTopic,
  deleteTopic,
  getTopic,
  listReplies,
  listTopics,
} from "@/lib/repo";

export async function GET(request: NextRequest) {
  try {
    await requireUser();
    const id = request.nextUrl.searchParams.get("id");
    if (id) {
      const topic = await getTopic(id);
      if (!topic) {
        return NextResponse.json({ error: "议题不存在" }, { status: 404 });
      }
      return NextResponse.json({
        data: { ...topic, replies: await listReplies(id) },
      });
    }
    return NextResponse.json({ data: await listTopics() });
  } catch (e) {
    return jsonError(e, "读取议题失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    const me = await requireUser();
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const content = String(body.body ?? body.content ?? "").trim();
    if (!title || !content) {
      return NextResponse.json({ error: "title 与 body 必填" }, { status: 400 });
    }
    const tags = Array.isArray(body.tags)
      ? body.tags.map(String).slice(0, 5)
      : undefined;
    const topic = await createTopic({
      title,
      body: content,
      tags,
      author_id: me.student_id || me.username,
      author_name: me.display_name,
      author_role: me.role === "teacher" ? "teacher" : "student",
    });
    return NextResponse.json({ data: topic }, { status: 201 });
  } catch (e) {
    return jsonError(e, "发帖失败");
  }
}

/** DELETE ?id= / body.topic_id — 仅教师可删议题 */
export async function DELETE(request: NextRequest) {
  try {
    const me = await requireUser();
    if (me.role !== "teacher") {
      return NextResponse.json(
        { error: "仅教师可删除议题" },
        { status: 403 },
      );
    }
    const body =
      request.headers.get("content-type")?.includes("json")
        ? await request.json().catch(() => ({}))
        : {};
    const topicId = String(
      request.nextUrl.searchParams.get("id") ??
        (body as { topic_id?: string; id?: string }).topic_id ??
        (body as { id?: string }).id ??
        "",
    ).trim();
    if (!topicId) {
      return NextResponse.json({ error: "议题 id 必填" }, { status: 400 });
    }
    const existing = await getTopic(topicId);
    if (!existing) {
      return NextResponse.json({ error: "议题不存在" }, { status: 404 });
    }
    const deleted = await deleteTopic(topicId);
    return NextResponse.json({ data: deleted });
  } catch (e) {
    return jsonError(e, "删除议题失败");
  }
}
