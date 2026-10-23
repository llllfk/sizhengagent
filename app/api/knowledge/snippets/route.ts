import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireUser } from "@/lib/auth/session";
import { matchKnowledgeSnippets } from "@/lib/content/knowledgeCorpus";
import { listKnowledgeSnippets } from "@/lib/repo";

/** GET /api/knowledge/snippets?kind=&q= */
export async function GET(request: NextRequest) {
  try {
    await requireUser();
    const kind = request.nextUrl.searchParams.get("kind") || undefined;
    const q = request.nextUrl.searchParams.get("q")?.trim();
    if (q) {
      const matches = matchKnowledgeSnippets(q, 5);
      return NextResponse.json({
        data: { total: matches.length, matches },
      });
    }
    const list = await listKnowledgeSnippets(kind);
    return NextResponse.json({ data: { total: list.length, snippets: list } });
  } catch (e) {
    return jsonError(e, "读取知识库失败");
  }
}
