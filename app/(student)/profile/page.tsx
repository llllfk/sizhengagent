"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/Card";

type Profile = {
  student_id: string;
  name: string;
  type_tag: string;
  cognition_level: number;
  weak_points: string[];
};

const typeLabel: Record<string, string> = {
  expression: "表达型",
  creation: "创作型",
  experience: "体验型",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    void fetch("/api/student/profile?student_id=demo-student")
      .then((r) => r.json())
      .then((j) => setProfile(j.data));
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-[11px] tracking-[0.3em] text-[var(--orange)]">
          讲透 · 学情画像
        </p>
        <h1 className="font-brand text-4xl text-[var(--ink)]">我的画像</h1>
      </header>
      <Panel title="摘要" hint="Mock 回流数据">
        {!profile ? (
          <p className="text-sm text-[var(--muted)]">加载中…</p>
        ) : (
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-[var(--muted)]">姓名</dt>
              <dd className="mt-1 font-display text-lg text-[var(--ink)]">
                {profile.name}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">学号</dt>
              <dd className="mt-1 text-[var(--ink)]/80">{profile.student_id}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">类型标签</dt>
              <dd className="mt-1 text-[var(--orange)]">
                {typeLabel[profile.type_tag] ?? profile.type_tag}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">认知起点</dt>
              <dd className="mt-1 text-[var(--ink)]/80">
                L{profile.cognition_level}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[var(--muted)]">薄弱点</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {profile.weak_points.map((w) => (
                  <span
                    key={w}
                    className="border border-[var(--orange)]/30 bg-[var(--orange-fog)] px-2 py-0.5 text-xs text-[var(--orange-deep)]"
                  >
                    {w}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        )}
      </Panel>
    </div>
  );
}
