import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/** 旧版单会话（兼容） */
export const SESSION_COOKIE = "qihang_session";

/** 分端会话：同浏览器可同时开学生窗 + 教师窗 */
export type PortalKind = "student" | "teacher" | "community";

export const PORTAL_SESSION_COOKIES: Record<PortalKind, string> = {
  student: "qihang_session_student",
  teacher: "qihang_session_teacher",
  community: "qihang_session_community",
};

export type SessionUser = {
  user_id: string;
  username: string;
  role: "teacher" | "student";
  display_name: string;
  student_id: string | null;
};

type Payload = SessionUser & { exp: number };

function secret() {
  return process.env.AUTH_SECRET || "qihang-demo-secret-change-me";
}

function sign(body: string) {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function encodeSession(user: SessionUser, ttlSec = 60 * 60 * 24 * 7) {
  const payload: Payload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + ttlSec,
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  return `${body}.${sign(body)}`;
}

export function decodeSession(
  token: string | undefined | null,
): SessionUser | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expect = sign(body);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expect);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as Payload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return {
      user_id: payload.user_id,
      username: payload.username,
      role: payload.role,
      display_name: payload.display_name,
      student_id: payload.student_id ?? null,
    };
  } catch {
    return null;
  }
}

export function parsePortal(raw: string | null | undefined): PortalKind | null {
  if (raw === "student" || raw === "teacher" || raw === "community") return raw;
  return null;
}

export function sessionCookieName(portal: PortalKind) {
  return PORTAL_SESSION_COOKIES[portal];
}

/** 按端读取会话；未指定时优先旧 cookie，再依次试各端 */
export async function getSessionUser(
  portal?: PortalKind | null,
): Promise<SessionUser | null> {
  const jar = await cookies();
  if (portal) {
    const scoped = decodeSession(jar.get(PORTAL_SESSION_COOKIES[portal])?.value);
    if (scoped) return scoped;
    // 社区端可用学生或教师身份
    if (portal === "community") {
      return (
        decodeSession(jar.get(PORTAL_SESSION_COOKIES.student)?.value) ??
        decodeSession(jar.get(PORTAL_SESSION_COOKIES.teacher)?.value) ??
        decodeSession(jar.get(SESSION_COOKIE)?.value)
      );
    }
    return decodeSession(jar.get(SESSION_COOKIE)?.value);
  }

  return (
    decodeSession(jar.get(SESSION_COOKIE)?.value) ??
    decodeSession(jar.get(PORTAL_SESSION_COOKIES.student)?.value) ??
    decodeSession(jar.get(PORTAL_SESSION_COOKIES.teacher)?.value) ??
    decodeSession(jar.get(PORTAL_SESSION_COOKIES.community)?.value)
  );
}

export async function requireTeacher(): Promise<SessionUser> {
  const user =
    (await getSessionUser("teacher")) ?? (await getSessionUser());
  if (!user || user.role !== "teacher") {
    throw new AuthError("需要教师登录");
  }
  return user;
}

export async function requireStudent(): Promise<SessionUser> {
  const user =
    (await getSessionUser("student")) ?? (await getSessionUser());
  if (!user || user.role !== "student") {
    throw new AuthError("需要学生登录");
  }
  return user;
}

/** 当前登录学生的学号（优先 student_id，否则 username） */
export async function requireStudentId(): Promise<string> {
  const user = await requireStudent();
  const sid = user.student_id || user.username;
  if (!sid) throw new AuthError("学员未绑定学号");
  return sid;
}

/** 同 requireStudentId，供已有路由引用 */
export async function studentIdFromSession(): Promise<string> {
  return requireStudentId();
}

export async function requireUser(
  portal?: PortalKind | null,
): Promise<SessionUser> {
  const user = await getSessionUser(portal);
  if (!user) throw new AuthError("请先登录");
  return user;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/** 会话 Cookie 基础项。Coze/CDN 常把多条 Set-Cookie 拼成一行，勿在同响应里混「写入」与「Max-Age=0 清空」。 */
export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  // 预览域强制 HTTPS（HSTS）；缺 Secure 时部分代理/浏览器会丢掉会话
  secure: true,
  maxAge: 60 * 60 * 24 * 7,
};
