import { NextRequest, NextResponse } from "next/server";
import {
  listHighlights,
  pinHighlight,
  promoteTopicToHighlight,
  refluxHighlight,
} from "@/lib/mock/community";

/** GET /api/highlights */
export async function GET() {
  return NextResponse.json({ data: listHighlights(), mock: true });
}

/**
 * POST /api/highlights
 * action: pin | unpin | reflux | promote
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body.action ?? "");

    if (action === "promote") {
      const topicId = String(body.topic_id ?? "");
      if (!topicId) {
        return NextResponse.json({ error: "topic_id 必填" }, { status: 400 });
      }
      const item = promoteTopicToHighlight(topicId);
      if (!item) {
        return NextResponse.json({ error: "议题不存在" }, { status: 404 });
      }
      return NextResponse.json({ data: item, mock: true }, { status: 201 });
    }

    const highlightId = String(body.highlight_id ?? "");
    if (!highlightId) {
      return NextResponse.json({ error: "highlight_id 必填" }, { status: 400 });
    }

    if (action === "pin" || action === "unpin") {
      const item = pinHighlight(highlightId, action === "pin");
      if (!item) {
        return NextResponse.json({ error: "精华不存在" }, { status: 404 });
      }
      return NextResponse.json({ data: item, mock: true });
    }

    if (action === "reflux") {
      const result = refluxHighlight(highlightId);
      if (!result) {
        return NextResponse.json({ error: "精华不存在" }, { status: 404 });
      }
      return NextResponse.json({ data: result, mock: true });
    }

    return NextResponse.json(
      { error: "action 须为 pin|unpin|reflux|promote" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
