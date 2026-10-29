"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type WorkRow = {
  work_id: string;
  student_id: string;
  type: string;
  title: string;
  file_uri: string;
  award_level: string | null;
  created_at: string;
};

function timeLabel(iso: string) {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** 学员自己的成片 / 教师按学号查询成片 */
export function WorksArchiveList({
  studentId,
  title = "成片清单",
  className,
  refreshKey = 0,
}: {
  /** 不传则读当前登录学员；教师查看他人时传入学号 */
  studentId?: string;
  title?: string;
  className?: string;
  /** 归档成功后递增以强制刷新 */
  refreshKey?: number;
}) {
  const [items, setItems] = useState<WorkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = studentId
        ? `?student_id=${encodeURIComponent(studentId)}`
        : "";
      const res = await fetch(`/api/works/upload${qs}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "读取作品失败");
      setItems((json.data ?? []) as WorkRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "读取作品失败");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <div
      className={cn(
        "space-y-2 rounded-sm border border-[var(--line)] bg-white/95 p-3",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] tracking-[0.2em] text-[var(--orange)]">
          {title}
          {!loading ? ` · ${items.length}` : ""}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="text-[10px] text-[var(--muted)] underline-offset-2 hover:text-[var(--orange)] hover:underline"
        >
          刷新
        </button>
      </div>

      {loading ? (
        <p className="py-4 text-center text-xs text-[var(--muted)]">加载中…</p>
      ) : error ? (
        <p className="py-3 text-xs text-[var(--vermilion)]">{error}</p>
      ) : items.length === 0 ? (
        <p className="py-4 text-center text-xs text-[var(--muted)]">
          暂无归档成片
        </p>
      ) : (
        <ul className="max-h-56 space-y-2 overflow-y-auto overscroll-contain">
          {items.map((w) => (
            <li
              key={w.work_id}
              className="rounded-sm border border-[var(--line)] bg-[var(--paper)]/80 px-2.5 py-2"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium text-sm text-[var(--ink)]">
                  {w.title || w.type}
                </p>
                <span className="text-[10px] tabular-nums text-[var(--muted)]">
                  {timeLabel(w.created_at)}
                </span>
              </div>
              <p className="mt-1 break-all text-[11px] leading-5 text-[var(--muted)]">
                {w.file_uri}
              </p>
              <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                {w.work_id}
                {w.award_level ? ` · ${w.award_level}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
