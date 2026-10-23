import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireTeacher } from "@/lib/auth/session";
import { analyticsBundle, weeklyReportDraft } from "@/lib/repo";

export async function GET() {
  try {
    await requireTeacher();
    return NextResponse.json({ data: await analyticsBundle() });
  } catch (e) {
    return jsonError(e, "读取学情失败");
  }
}

export async function POST() {
  try {
    await requireTeacher();
    return NextResponse.json({ data: await weeklyReportDraft() });
  } catch (e) {
    return jsonError(e, "生成周报失败");
  }
}
