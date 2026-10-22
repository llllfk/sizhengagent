import { NextResponse } from "next/server";
import { analyticsBundle, weeklyReportDraft } from "@/lib/mock/tasks";

/** GET /api/teacher/analytics */
export async function GET() {
  return NextResponse.json({
    data: analyticsBundle(),
    mock: true,
  });
}

/** POST /api/teacher/analytics — 生成周报草稿 */
export async function POST() {
  return NextResponse.json({
    data: weeklyReportDraft(),
    mock: true,
  });
}
