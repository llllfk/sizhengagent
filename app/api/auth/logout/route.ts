import { NextRequest, NextResponse } from "next/server";
import {
  parsePortal,
  PORTAL_SESSION_COOKIES,
  SESSION_COOKIE,
  sessionCookieName,
} from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  let portal = parsePortal(null);
  try {
    const body = await request.json().catch(() => ({}));
    portal = parsePortal(String((body as { portal?: string }).portal ?? ""));
  } catch {
    /* empty body */
  }

  const res = NextResponse.json({ data: { ok: true } });
  const clear = {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  };

  if (portal) {
    res.cookies.set(sessionCookieName(portal), "", clear);
  } else {
    res.cookies.set(SESSION_COOKIE, "", clear);
    for (const name of Object.values(PORTAL_SESSION_COOKIES)) {
      res.cookies.set(name, "", clear);
    }
  }
  // 清掉旧通用 cookie，避免另一端被带偏
  res.cookies.set(SESSION_COOKIE, "", clear);
  return res;
}
