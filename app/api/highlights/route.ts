import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import {
  listHighlights,
  promoteTopicToHighlight,
  refluxHighlight,
} from "@/lib/repo";

export async function GET() {
  try {
    return NextResponse.json({ data: await listHighlights() });
  } catch (e) {
    return jsonError(e, "读取精华失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body.action ?? "");

    if (action === "promote") {
      const topicId = String(body.topic_id ?? "");
      if (!topicId) {
        return NextResponse.json({ error: "topic_id 必填" }, { status: 400 });
      }
      const item = await promoteTopicToHighlight(topicId);
      if (!item) {
        return NextResponse.json({ error: "议题不存在" }, { status: 404 });
      }
      return NextResponse.json({ data: item }, { status: 201 });
    }

    const highlightId = String(body.highlight_id ?? "");
    if (!highlightId) {
      return NextResponse.json({ error: "highlight_id 必填" }, { status: 400 });
    }

    if (action === "reflux") {
      const result = await refluxHighlight(highlightId);
      if (!result) {
        return NextResponse.json({ error: "精华不存在" }, { status: 404 });
      }
      return NextResponse.json({ data: result });
    }

    return NextResponse.json(
      { error: "action 须为 reflux|promote" },
      { status: 400 },
    );
  } catch (e) {
    return jsonError(e, "操作失败");
  }
}
