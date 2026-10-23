"use client";

import { useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/ui/Card";
import {
  ProfileRadar,
  TypeBeaconBoard,
  buildStudentRadarAxes,
} from "@/components/shared/ProfileRadar";

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
    void fetch("/api/student/profile")
      .then((r) => r.json())
      .then((j) => setProfile(j.data ?? null));
  }, []);

  const axes = useMemo(
    () => (profile ? buildStudentRadarAxes(profile) : []),
    [profile],
  );

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-[11px] tracking-[0.3em] text-[var(--orange)]">
          讲透 · 学情画像
        </p>
        <h1 className="font-brand text-4xl text-[var(--ink)] md:text-5xl">
          我的画像
        </h1>
        <p className="max-w-xl text-sm text-[var(--muted)]">
          雷达一眼看长板，灯牌锁定分型——分层任务据此推送。
        </p>
      </header>

      {!profile ? (
        <Panel>
          <p className="text-sm text-[var(--muted)]">加载画像…</p>
        </Panel>
      ) : (
        <>
          <div className="profile-hero relative overflow-hidden rounded-sm border border-[var(--glass-border)] bg-white/85 p-5 md:p-7">
            <div className="profile-hero-glow" aria-hidden />
            <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] tracking-[0.28em] text-[var(--orange)]">
                    {profile.student_id}
                  </p>
                  <h2 className="mt-1 font-display text-3xl text-[var(--ink)] md:text-4xl">
                    {profile.name}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    认知起点 L{profile.cognition_level} ·{" "}
                    <span className="text-[var(--orange-deep)]">
                      {typeLabel[profile.type_tag] ?? profile.type_tag}
                    </span>
                  </p>
                </div>
                <TypeBeaconBoard active={profile.type_tag} mode="personal" />
                <div>
                  <p className="text-[10px] tracking-[0.22em] text-[var(--muted)]">
                    薄弱点 · 待补强
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.weak_points.length === 0 ? (
                      <span className="text-xs text-[var(--muted)]">暂无标注</span>
                    ) : (
                      profile.weak_points.map((w) => (
                        <span
                          key={w}
                          className="border border-[var(--orange)]/30 bg-[var(--orange-fog)] px-2.5 py-1 text-xs text-[var(--orange-deep)]"
                        >
                          {w}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <ProfileRadar
                axes={axes}
                size={300}
                accentLabel="个人能力雷达"
                className="justify-self-center"
              />
            </div>
          </div>

          <Panel title="分层提示" hint="与⑥分层任务、⑤课中五式联动">
            <p className="text-sm leading-7 text-[var(--muted)]">
              你更偏
              <strong className="mx-1 text-[var(--orange-deep)]">
                {typeLabel[profile.type_tag] ?? profile.type_tag}
              </strong>
              ：系统会优先推送匹配任务；雷达短板轴会随答疑与互动自动回写。
            </p>
          </Panel>
        </>
      )}
    </div>
  );
}
