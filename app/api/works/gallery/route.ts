import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireUser } from "@/lib/auth/session";
import { listWorkGallery } from "@/lib/repo";

/** GET /api/works/gallery — 成果库成片元数据（来自 PostgreSQL） */
export async function GET() {
  try {
    await requireUser();
    const clips = await listWorkGallery();
    return NextResponse.json({
      data: { total: clips.length, clips },
    });
  } catch (e) {
    return jsonError(e, "读取成果库失败");
  }
}
