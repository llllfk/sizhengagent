"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { HighlightItem } from "@/types";

export function HighlightsGallery() {
  const [items, setItems] = useState<HighlightItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [pulseId, setPulseId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/highlights");
    const json = await res.json();
    setItems(json.data ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function reflux(id: string) {
    setBusy(true);
    setToast("");
    try {
      const res = await fetch("/api/highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reflux", highlight_id: id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "操作失败");
      setPulseId(id);
      setToast(json.data?.kb_note ?? "已回灌答疑知识库");
      window.setTimeout(() => setPulseId(null), 1600);
      await load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
        精华来自论坛共识与转接答疑；可「一键回灌」答疑知识库，闭环课中碰撞 → 社区沉淀 → 智能学伴。
      </p>

      {toast ? (
        <div
          className={cn(
            "animate-rise rounded-sm border border-[var(--orange)]/40 bg-gradient-to-r from-[var(--orange-fog)] to-white px-4 py-2 text-sm text-[var(--orange-deep)]",
            pulseId && "animate-panel-breathe",
          )}
        >
          {toast}
        </div>
      ) : null}

      <ul className="grid gap-4 md:grid-cols-2">
        {items.map((h, i) => (
          <li
            key={h.highlight_id}
            className={cn(
              "animate-rise group relative overflow-hidden rounded-sm border border-[var(--line)] bg-white p-5 transition hover:border-[var(--orange)]/45",
              pulseId === h.highlight_id && "ring-2 ring-[var(--orange)]",
            )}
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-100 bg-gradient-to-r from-[var(--orange)] via-[var(--orange-soft)] to-transparent opacity-80 transition group-hover:opacity-100"
              aria-hidden
            />
            <div className="flex flex-wrap items-center gap-2">
              {h.refluxed ? (
                <span className="rounded-sm border border-emerald-300/60 bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700">
                  已回灌知识库
                </span>
              ) : (
                <span className="rounded-sm bg-[var(--orange-fog)] px-1.5 py-0.5 text-[10px] text-[var(--orange-deep)]">
                  待回灌
                </span>
              )}
            </div>
            <h3 className="mt-3 font-display text-xl text-[var(--ink)]">
              {h.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              {h.excerpt}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {h.tags.map((t) => (
                <span
                  key={t}
                  className="border border-[var(--line)] px-2 py-0.5 text-[11px] text-[var(--muted)]"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                loading={busy}
                disabled={h.refluxed}
                onClick={() => void reflux(h.highlight_id)}
              >
                {h.refluxed ? "已回灌" : busy ? "回灌中…" : "回灌答疑库"}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          暂无精华。可在研讨论坛点击「沉淀精华」。
        </p>
      ) : null}
    </div>
  );
}
