"use client";

import { useCallback, useEffect, useState } from "react";
import { readTabPortal } from "@/lib/auth/portalClient";

export type ClientSession = {
  user_id: string;
  username: string;
  role: "teacher" | "student";
  display_name: string;
  student_id: string | null;
};

export function useSessionUser() {
  const [user, setUser] = useState<ClientSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const portal = readTabPortal();
      const qs = portal ? `?portal=${encodeURIComponent(portal)}` : "";
      const res = await fetch(`/api/auth/me${qs}`);
      const json = await res.json();
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
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { user, loading, error, reload };
}
