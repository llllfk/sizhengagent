"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { WorksArchiveList } from "@/components/shared/WorksArchiveList";
import { cn } from "@/lib/utils";

type Project = {
  project_id: string;
  theme: string;
  value_point: string;
  script?: string;
  storyboard?: string;
  subtitle_note?: string;
  file_uri?: string;
  step: number;
};

const steps = [
  { n: 1, label: "脚本" },
  { n: 2, label: "分镜" },
  { n: 3, label: "字幕" },
  { n: 4, label: "归档" },
];

export function VideoWorkshop() {
  const [project, setProject] = useState<Project | null>(null);
  const [theme, setTheme] = useState("");
  const [valuePoint, setValuePoint] = useState("");
  const [fileUri, setFileUri] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [msg, setMsg] = useState("");
  const [worksKey, setWorksKey] = useState(0);
  const [safetyMsg, setSafetyMsg] = useState<{
    gate: string;
    reason: string;
  } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/video/storyboard");
    const json = await res.json();
    const p = json.data as Project;
    if (!p) return;
    setProject(p);
    setTheme(p.theme || "");
    setValuePoint(p.value_point || "");
    if (p.file_uri) setFileUri(p.file_uri);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: string, extra?: Record<string, string>) {
    setBusy(true);
    setBusyAction(action);
    setMsg("");
    setSafetyMsg(null);
    try {
      const res = await fetch("/api/video/storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          theme,
          value_point: valuePoint,
          ...extra,
        }),
      });
      const json = await res.json();
      if (res.status === 422 && json.safety) {
        setSafetyMsg({
          gate: json.safety.gate,
          reason: json.safety.reason,
        });
        return;
      }
      if (!res.ok) throw new Error(json.error || "生成失败");
      setProject(json.data);
      const src = json.data?.gen_source as string | undefined;
      setMsg(
        src === "llm" || src === "coze"
          ? "已生成"
          : "已生成课堂稿（智能体繁忙时使用工坊编导稿）",
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "失败");
    } finally {
      setBusy(false);
      setBusyAction("");
    }
  }

  async function archive() {
    if (!fileUri.trim()) {
      setMsg("请先填写成片地址");
      return;
    }
    setBusy(true);
    setBusyAction("archive");
    setMsg("");
    try {
      const res = await fetch("/api/works/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "short_video",
          title: theme || "客舱思政短视频",
          file_uri: fileUri,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "归档失败");
      setMsg(`已归档：${json.data.work_id}`);
      setWorksKey((k) => k + 1);
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "失败");
    } finally {
      setBusy(false);
      setBusyAction("");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {steps.map((s) => (
          <div
            key={s.n}
            className={cn(
              "rounded-sm border px-3 py-1.5 text-xs",
              (project?.step ?? 1) >= s.n
                ? "border-[var(--orange)] bg-[var(--orange-fog)] text-[var(--orange-deep)]"
                : "border-[var(--line)] text-[var(--muted)]",
            )}
          >
            {s.n}. {s.label}
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="text-xs text-[var(--muted)]">主题</span>
          <input
            className="w-full rounded-sm border border-[var(--line)] px-3 py-2 outline-none focus:border-[var(--orange)]"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="例如：颠簸中的回座指令"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-xs text-[var(--muted)]">思政价值点</span>
          <input
            className="w-full rounded-sm border border-[var(--line)] px-3 py-2 outline-none focus:border-[var(--orange)]"
            value={valuePoint}
            onChange={(e) => setValuePoint(e.target.value)}
            placeholder="例如：人民至上 · 安全优先"
          />
        </label>
      </div>

      {safetyMsg ? (
        <div
          className={cn(
            "animate-rise rounded-sm border px-4 py-3 text-sm",
            safetyMsg.gate === "sensitive"
              ? "border-rose-300/70 bg-rose-50 text-[var(--ink)]"
              : "border-amber-300/70 bg-amber-50 text-[var(--ink)]",
          )}
        >
          <p className="text-[10px] tracking-[0.2em] text-[var(--orange-deep)]">
            内容安全 ·{" "}
            {safetyMsg.gate === "sensitive" ? "敏感词闸门" : "价值导向闸门"}
          </p>
          <p className="mt-1">{safetyMsg.reason}</p>
        </div>
      ) : null}

      <p className="text-[11px] text-[var(--muted)]">
        内容安全提示：主题含违规表述或「别管安全偷偷放行」时将被拦截。
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          loading={busyAction === "gen_script"}
          disabled={busy && busyAction !== "gen_script"}
          onClick={() => void run("gen_script")}
        >
          {busyAction === "gen_script" ? "正在生成脚本…" : "① 生成脚本"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          loading={busyAction === "gen_storyboard"}
          disabled={busy && busyAction !== "gen_storyboard"}
          onClick={() => void run("gen_storyboard")}
        >
          {busyAction === "gen_storyboard" ? "正在生成分镜…" : "② 生成分镜"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          loading={busyAction === "subtitle"}
          disabled={busy && busyAction !== "subtitle"}
          onClick={() => void run("subtitle")}
        >
          {busyAction === "subtitle" ? "正在生成字幕…" : "③ 生成字幕"}
        </Button>
      </div>

      {project?.script ? (
        <pre className="whitespace-pre-wrap rounded-sm border border-[var(--orange)]/25 bg-[var(--orange-fog)] p-4 text-xs leading-6">
          {project.script}
        </pre>
      ) : null}
      {project?.storyboard ? (
        <pre className="whitespace-pre-wrap rounded-sm border border-[var(--line)] bg-white p-4 text-xs leading-6">
          {project.storyboard}
        </pre>
      ) : null}
      {project?.subtitle_note ? (
        <pre className="whitespace-pre-wrap rounded-sm border border-[var(--line)] bg-white p-4 text-xs leading-6 text-[var(--ink)]">
          {project.subtitle_note}
        </pre>
      ) : null}

      <div className="rounded-sm border border-[var(--line)] bg-white p-4 space-y-3">
        <p className="text-xs text-[var(--muted)]">④ 成片归档（填写成片地址）</p>
        <input
          className="w-full rounded-sm border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--orange)]"
          value={fileUri}
          onChange={(e) => setFileUri(e.target.value)}
          placeholder="上传后的成片路径或对象存储地址"
        />
        <Button
          type="button"
          loading={busyAction === "archive"}
          disabled={busy && busyAction !== "archive"}
          onClick={() => void archive()}
        >
          {busyAction === "archive" ? "归档中…" : "提交成片入库"}
        </Button>
      </div>

      {msg ? <p className="text-sm text-[var(--orange-deep)]">{msg}</p> : null}

      <WorksArchiveList title="我的成片" refreshKey={worksKey} />
    </div>
  );
}
