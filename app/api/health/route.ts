import { NextResponse } from "next/server";
import { hasDb, query } from "@/lib/db";
import { ensurePg } from "@/lib/repo/ensure";

export async function GET() {
  let db: "unconfigured" | "ok" | "error" = "unconfigured";
  let detail: string | undefined;
  if (hasDb()) {
    try {
      await ensurePg();
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
      ts: new Date().toISOString(),
    },
  });
}
