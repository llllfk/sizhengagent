import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireTeacher } from "@/lib/auth/session";
import { workbenchStats } from "@/lib/repo";

export async function GET() {
  try {
    await requireTeacher();
    return NextResponse.json({ data: await workbenchStats() });
  } catch (e) {
    return jsonError(e, "读取统计失败");
  }
}
