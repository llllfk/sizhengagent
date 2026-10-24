import { NextRequest, NextResponse } from "next/server";
import { hasDb, query } from "@/lib/db";
import { ensurePg, seedPgIfNeeded } from "@/lib/repo/ensure";

/**
 * GET /api/health
 * - 默认：探活 + 确保表结构
 * - ?seed=1：空库时补一次种子数据（运维/首次部署用，勿当登录依赖）
 */
export async function GET(request: NextRequest) {
  let db: "unconfigured" | "ok" | "error" = "unconfigured";
  let detail: string | undefined;
  let seeded: boolean | undefined;
  if (hasDb()) {
    try {
      await ensurePg();
      const wantSeed = request.nextUrl.searchParams.get("seed") === "1";
      if (wantSeed) {
        seeded = await seedPgIfNeeded();
      }
      const r = await query<{ n: string }>("select 1::text as n");
      db = r.rows[0]?.n === "1" ? "ok" : "error";
    } catch (e) {
      db = "error";
      detail = e instanceof Error ? e.message : "unknown";
    }
  }
  return NextResponse.json({
    data: {
      status: "ok",
      service: "qihang-agent",
      db,
      detail,
      seeded,
      ts: new Date().toISOString(),
    },
  });
}
