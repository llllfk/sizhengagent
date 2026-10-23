import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/session";
import { DbUnavailableError } from "@/lib/repo";

/** 将业务错误转为对应 HTTP 状态 */
export function jsonError(e: unknown, fallback = "请求失败") {
  if (e instanceof DbUnavailableError) {
    return NextResponse.json(
      { error: e.message, code: "DB_UNAVAILABLE" },
      { status: 503 },
    );
  }
  if (e instanceof AuthError) {
    return NextResponse.json(
      { error: e.message, code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }
  console.error(e);
  return NextResponse.json(
    { error: e instanceof Error ? e.message : fallback },
    { status: 500 },
  );
}
