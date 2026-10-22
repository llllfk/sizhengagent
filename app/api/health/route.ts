import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  return NextResponse.json({
    data: {
      status: "ok",
      service: "qihang-agent",
      db: pool ? "configured" : "unconfigured",
      ts: new Date().toISOString(),
    },
  });
}
