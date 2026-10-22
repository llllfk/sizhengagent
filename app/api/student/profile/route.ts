import { NextRequest, NextResponse } from "next/server";
import { findStudent, getStore } from "@/lib/mock/store";

/** GET /api/student/profile — 读取学情画像标签 */
export async function GET(request: NextRequest) {
  const studentId =
    request.nextUrl.searchParams.get("student_id") ?? "demo-student";
  const profile = findStudent(studentId);
  if (!profile) {
    return NextResponse.json({ error: "未找到学员" }, { status: 404 });
  }
  return NextResponse.json({ data: { ...profile, mock: true } });
}

/** GET list via ?all=1 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (body?.list) {
    return NextResponse.json({ data: getStore().students, mock: true });
  }
  return NextResponse.json({ error: "unsupported" }, { status: 400 });
}
