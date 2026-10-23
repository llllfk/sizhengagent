export type TabPortal = "student" | "teacher" | "community";

export const PORTAL_STORAGE_KEY = "qihang_portal";

export function readTabPortal(): TabPortal | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.sessionStorage.getItem(PORTAL_STORAGE_KEY);
    if (v === "student" || v === "teacher" || v === "community") return v;
  } catch {
    /* private mode */
  }
  return null;
}

export function writeTabPortal(portal: TabPortal) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PORTAL_STORAGE_KEY, portal);
  } catch {
    /* ignore */
  }
}

export function clearTabPortal() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PORTAL_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
