import { NextResponse } from "next/server";
import { workbenchStats } from "@/lib/mock/store";

/** GET /api/teacher/stats — 工作台概览数字 */
export async function GET() {
  return NextResponse.json({ data: workbenchStats(), mock: true });
}
