import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { requireUser } from "@/lib/auth/session";
import { listCabinCases } from "@/lib/repo";

/** GET /api/cabin/cases — 客舱案例库（汇编入库） */
export async function GET() {
  try {
    await requireUser();
    const cases = await listCabinCases();
    return NextResponse.json({
      data: {
        total: cases.length,
        cases,
      },
    });
  } catch (e) {
    return jsonError(e, "读取客舱案例失败");
  }
}
