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
};

function portalFromPath(path: string): TabPortal | null {
  if (
    path.startsWith("/workbench") ||
    path.startsWith("/escalations") ||
    path.startsWith("/interactive-control") ||
    path.startsWith("/analytics") ||
    path.startsWith("/weekly-report") ||
    path.startsWith("/accounts")
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
    path.startsWith("/profile")
  ) {
    return "student";
  }
  return null;
}

export function useSession() {
  const pathname = usePathname();
  const [user, setUser] = useState<ClientSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const fromPath = portalFromPath(pathname || "");
      const stored = readTabPortal();
      // 路径能判定端时以路径为准，避免同标签残留 teacher 导致学生页读错会话
      const portal = fromPath ?? stored;
      if (fromPath && stored !== fromPath) writeTabPortal(fromPath);
      else if (portal && !stored) writeTabPortal(portal);

      const qs = portal ? `?portal=${encodeURIComponent(portal)}` : "";
      let res = await fetch(`/api/auth/me${qs}`, { credentials: "include" });
      let json = await res.json();

      // 路径端读不到时，再试一次无 portal / 另一端 cookie（双开残留）
      if (!res.ok && fromPath) {
        const fallback = await fetch("/api/auth/me", {
          credentials: "include",
        });
        const fallbackJson = await fallback.json();
        if (
          fallback.ok &&
          fallbackJson.data &&
          ((fromPath === "student" && fallbackJson.data.role === "student") ||
            (fromPath === "teacher" && fallbackJson.data.role === "teacher") ||
            fromPath === "community")
        ) {
          res = fallback;
          json = fallbackJson;
          writeTabPortal(fromPath);
        }
      }

      if (!res.ok) {
        setUser(null);
        setError(json.error || "未登录");
        return null;
      }
      setUser(json.data);
      setError("");
      return json.data as ClientSession;
    } catch {
      setUser(null);
      setError("会话读取失败");
      return null;
    } finally {
      setLoading(false);
    }
  }, [pathname]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    user,
    loading,
    error,
    refresh,
    studentId: user?.role === "student" ? user.student_id || user.username : null,
    isTeacher: user?.role === "teacher",
    isStudent: user?.role === "student",
  };
}
