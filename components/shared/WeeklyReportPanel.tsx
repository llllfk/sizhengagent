"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type Report = {
  week_label: string;
  generated_at: string;
  summary: string;
  suggestions: string[];
  status: string;
};

export function WeeklyReportPanel() {
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [published, setPublished] = useState(false);

  const generate = useCallback(async () => {
    setBusy(true);
    setPublished(false);
    try {
      const res = await fetch("/api/teacher/analytics", { method: "POST" });
      const json = await res.json();
      setReport(json.data);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void generate();
  }, [generate]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={busy} onClick={() => void generate()}>
          {busy ? "生成中…" : report ? "刷新周报草稿" : "生成周报草稿"}
        </Button>
        {report ? (
          <Button
            type="button"
            variant="ghost"
            disabled={published}
            onClick={() => setPublished(true)}
          >
            {published ? "已确认发布（演示）" : "确认发布"}
          </Button>
        ) : null}
      </div>

      {!report ? (
        <p className="animate-pulse text-sm text-[var(--muted)]">
          正在汇总转接、任务与薄弱点…
        </p>
      ) : (
        <div className="animate-rise space-y-4 rounded-sm border border-[var(--line)] bg-white p-5 shadow-[0_12px_36px_rgba(196,92,26,0.08)]">
          <div>
            <p className="text-[10px] tracking-[0.25em] text-[var(--orange)]">
              {report.status === "draft" && !published ? "DRAFT" : "PUBLISHED"}
            </p>
            <h3 className="mt-1 font-display text-xl text-[var(--ink)]">
              {report.week_label}
            </h3>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {new Date(report.generated_at).toLocaleString("zh-CN")}
            </p>
          </div>
          <pre className="whitespace-pre-wrap text-sm leading-7 text-[var(--ink)]">
            {report.summary}
          </pre>
          <div>
            <p className="text-xs text-[var(--muted)]">教学建议</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--ink)]">
              {report.suggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
