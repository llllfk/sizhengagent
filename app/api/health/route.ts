import { NextRequest, NextResponse } from "next/server";
import { hasDb, query } from "@/lib/db";
import { ensurePg, seedPgIfNeeded } from "@/lib/repo/ensure";

/**
 * GET /api/health
 * - 默认：只 select 1 探活
 * - ?seed=1：空库灌种子（需同时设 QI_HANG_ENSURE_PG=1 才会建表同步）
 */
export async function GET(request: NextRequest) {
  let db: "unconfigured" | "ok" | "error" = "unconfigured";
  let detail: string | undefined;
  let seeded: boolean | undefined;
  if (hasDb()) {
    try {
      const wantSeed = request.nextUrl.searchParams.get("seed") === "1";
      if (wantSeed) {
        await ensurePg();
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
