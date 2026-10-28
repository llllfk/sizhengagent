"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  readTabPortal,
  writeTabPortal,
  type TabPortal,
} from "@/lib/auth/portalClient";

export type ClientSession = {
  user_id: string;
  username: string;
  role: "teacher" | "student";
  display_name: string;
  student_id: string | null;
  class_id?: string | null;
  class_name?: string | null;
  class_code?: string | null;
};

type SessionCache = {
  user: ClientSession | null;
  error: string;
  portal: TabPortal | null;
  at: number;
};

/** 跨 layout 复用，避免切页每次 loading + 重拉 /api/auth/me */
let sessionCache: SessionCache | null = null;
const SESSION_TTL_MS = 90_000;
const inflightByPortal = new Map<string, Promise<ClientSession | null>>();

function portalFromPath(path: string): TabPortal | null {
  if (
    path.startsWith("/workbench") ||
    path.startsWith("/escalations") ||
    path.startsWith("/interactive-control") ||
    path.startsWith("/analytics") ||
    path.startsWith("/weekly-report") ||
    path.startsWith("/accounts") ||
    path.startsWith("/classes")
  ) {
    return "teacher";
  }
  if (path.startsWith("/forum") || path.startsWith("/highlights")) {
    return "community";
  }
  if (
    path.startsWith("/companion") ||
    path.startsWith("/interactive") ||
    path.startsWith("/tasks") ||
    path.startsWith("/industry") ||
    path.startsWith("/video-workshop") ||
    path.startsWith("/profile") ||
    path.startsWith("/works") ||
    path.startsWith("/modules")
  ) {
    return "student";
  }
  return null;
}

function cacheKey(portal: TabPortal | null) {
  return portal ?? "_";
}

function cacheFresh(portal: TabPortal | null) {
  if (!sessionCache) return false;
  if (Date.now() - sessionCache.at > SESSION_TTL_MS) return false;
  // 无路径 portal 时用任意缓存；有 portal 时须同端
  if (!portal) return true;
  return sessionCache.portal === portal || sessionCache.portal === null;
}

async function fetchSession(
  portal: TabPortal | null,
): Promise<ClientSession | null> {
  const key = cacheKey(portal);
  const hit = inflightByPortal.get(key);
  if (hit) return hit;

  const job = (async () => {
    const prevUser =
      sessionCache &&
      (sessionCache.portal === portal || sessionCache.portal === null)
        ? sessionCache.user
        : null;
    try {
      const qs = portal ? `?portal=${encodeURIComponent(portal)}` : "";
      let res = await fetch(`/api/auth/me${qs}`, { credentials: "include" });
      let json = await res.json().catch(() => ({} as { data?: ClientSession; error?: string }));

      if (!res.ok && portal) {
        const fallback = await fetch("/api/auth/me", {
          credentials: "include",
        });
        const fallbackJson = await fallback.json().catch(
          () => ({} as { data?: ClientSession; error?: string }),
        );
        if (
          fallback.ok &&
          fallbackJson.data &&
          ((portal === "student" && fallbackJson.data.role === "student") ||
            (portal === "teacher" && fallbackJson.data.role === "teacher") ||
            portal === "community")
        ) {
          res = fallback;
          json = fallbackJson;
          writeTabPortal(portal);
        }
      }

      if (!res.ok) {
        // 瞬时失败时保留旧会话，避免对话页被误判未登录而「闪退」回登录
        if (prevUser) {
          sessionCache = {
            user: prevUser,
            error: "",
            portal: sessionCache?.portal ?? portal,
            at: Date.now(),
          };
          return prevUser;
        }
        sessionCache = {
          user: null,
          error: json.error || "未登录",
          portal,
          at: Date.now(),
        };
        return null;
      }
      const user = json.data as ClientSession;
      sessionCache = { user, error: "", portal, at: Date.now() };
      return user;
    } catch {
      if (prevUser) {
        sessionCache = {
          user: prevUser,
          error: "",
          portal: sessionCache?.portal ?? portal,
          at: Date.now(),
        };
        return prevUser;
      }
      sessionCache = {
        user: null,
        error: "会话读取失败",
        portal,
        at: Date.now(),
      };
      return null;
    } finally {
      inflightByPortal.delete(key);
    }
  })();

  inflightByPortal.set(key, job);
  return job;
}

/** 登录/退出后清缓存，避免脏会话 */
export function clearSessionCache() {
  sessionCache = null;
  inflightByPortal.clear();
}

export function useSession() {
  const pathname = usePathname();
  const fromPath = portalFromPath(pathname || "");
  const portalHint =
    fromPath ??
    (typeof window !== "undefined" ? readTabPortal() : null);

  const [user, setUser] = useState<ClientSession | null>(() =>
    cacheFresh(portalHint) ? sessionCache!.user : null,
  );
  const [loading, setLoading] = useState(() => !cacheFresh(portalHint));
  const [error, setError] = useState(() =>
    cacheFresh(portalHint) ? sessionCache!.error : "",
  );

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    const pathPortal = portalFromPath(
      typeof window !== "undefined" ? window.location.pathname : "",
    );
    const storedNow = readTabPortal();
    const nextPortal = pathPortal ?? storedNow;
    if (pathPortal && storedNow !== pathPortal) writeTabPortal(pathPortal);
    else if (nextPortal && !storedNow) writeTabPortal(nextPortal);

    const silent = opts?.silent || cacheFresh(nextPortal);
    if (!silent) setLoading(true);

    const next = await fetchSession(nextPortal);
    setUser(next);
    setError(sessionCache?.error ?? "");
    setLoading(false);
    return next;
  }, []);

  useEffect(() => {
    const storedNow = readTabPortal();
    if (fromPath && storedNow !== fromPath) writeTabPortal(fromPath);
    else if (fromPath && !storedNow) writeTabPortal(fromPath);

    const portal = fromPath ?? readTabPortal();
    if (cacheFresh(portal)) {
      setUser(sessionCache!.user);
      setError(sessionCache!.error);
      setLoading(false);
      if (Date.now() - sessionCache!.at > SESSION_TTL_MS / 2) {
        void refresh({ silent: true });
      }
      return;
    }
    void refresh({ silent: false });
  }, [fromPath, refresh]);

  return {
    user,
    loading,
    error,
    refresh: () => refresh({ silent: false }),
    studentId: user?.role === "student" ? user.student_id || user.username : null,
    isTeacher: user?.role === "teacher",
    isStudent: user?.role === "student",
  };
}
