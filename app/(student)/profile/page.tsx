"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChangePasswordForm } from "@/components/shared/ChangePasswordForm";
import { Panel } from "@/components/ui/Card";
import {
  ProfileRadar,
  TypeBeaconBoard,
  buildStudentRadarAxes,
  type RadarAxis,
} from "@/components/shared/ProfileRadar";
import { TypeGuide } from "@/components/shared/TypeGuide";
import { TYPE_LABEL, isFormedType } from "@/lib/content/typeTags";

type LearningIssue = {
  issue_id: string;
  title: string;
  detail: string;
  weak_tag: string | null;
  source: string;
  created_at: string;
};

type Activity = {
  qa_sessions: number;
  qa_rounds: number;
  qa_escalated: number;
  open_issues: number;
  quiz_issues: number;
  escalation_issues: number;
  task_done: number;
  task_total: number;
  works_count: number;
  quiz_last: {
    room_id: string;
    score: number;
    total: number;
    wrong_count: number;
    at: string;
  } | null;
};

type Profile = {
  student_id: string;
  name: string;
  type_tag: string;
  cognition_level: number;
  weak_points: string[];
  class_id?: string | null;
  class_name?: string | null;
  class_code?: string | null;
  open_issues?: LearningIssue[];
  open_issue_count?: number;
  activity?: Activity;
  radar_axes?: RadarAxis[];
};

const typeLabel = TYPE_LABEL as Record<string, string>;

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

  const act = profile?.activity;

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
          画像不预置。完成答疑、闯关、工坊或任务后，系统才生成五型标签与雷达。
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
                    {profile.class_name ? (
                      <>
                        {profile.class_name}
                        {profile.class_code ? ` · ${profile.class_code}` : ""}
                        {" · "}
                      </>
                    ) : null}
                    认知起点 L{profile.cognition_level} ·{" "}
                    <span className="text-[var(--orange-deep)]">
                      {typeLabel[profile.type_tag] ?? profile.type_tag}
                    </span>
                  </p>
                </div>
                {!isFormedType(profile.type_tag) ? (
                  <div className="portrait-pending relative overflow-hidden rounded-sm border border-[var(--orange)]/40 bg-gradient-to-r from-[var(--orange-fog)] to-white px-4 py-4">
                    <span className="type-beacon-ring" aria-hidden />
                    <p className="text-[10px] tracking-[0.28em] text-[var(--orange)]">
                      画像待生成
                    </p>
                    <p className="mt-1 font-display text-2xl text-[var(--orange-deep)]">
                      先上课，再分型
                    </p>
                    <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
                      任选一次真实操作后，五型灯牌与雷达才会亮起。
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        { href: "/companion", label: "学伴答疑" },
                        { href: "/interactive", label: "课中五式" },
                        { href: "/video-workshop", label: "短视频工坊" },
                      ].map((x) => (
                        <Link
                          key={x.href}
                          href={x.href}
                          className="rounded-sm border border-[var(--orange)]/35 bg-white px-3 py-1.5 text-xs text-[var(--orange-deep)] transition hover:border-[var(--orange)] hover:shadow-[0_8px_20px_rgba(232,120,47,0.18)]"
                        >
                          {x.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
                <TypeBeaconBoard active={profile.type_tag} mode="personal" />

                {act ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { k: "答疑场次", v: act.qa_sessions },
                      { k: "追问轮次", v: act.qa_rounds },
                      { k: "待办问题", v: act.open_issues },
                      {
                        k: "最近闯关",
                        v: act.quiz_last
                          ? `${act.quiz_last.score}/${act.quiz_last.total}`
                          : "—",
                      },
                    ].map((c) => (
                      <div
                        key={c.k}
                        className="rounded-sm border border-[var(--line)] bg-white/90 px-2.5 py-2 text-center"
                      >
                        <p className="text-[10px] text-[var(--muted)]">{c.k}</p>
                        <p className="font-display text-lg text-[var(--orange)]">
                          {c.v}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div>
                  <p className="text-[10px] tracking-[0.22em] text-[var(--muted)]">
                    薄弱点 · 待补强
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.weak_points.length === 0 ? (
                      <span className="text-xs text-[var(--muted)]">
                        暂无标注（闯关错题 / 答疑转接后自动写入）
                      </span>
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
                accentLabel="个人能力雷达 · 实时"
                className="justify-self-center"
              />
            </div>
          </div>

          <Panel title="账号安全" hint="修改登录密码 · 需验证当前密码">
            <ChangePasswordForm />
          </Panel>

          <Panel title="问题清单" hint="课中闯关错题 / 答疑转接 · 实时库">
            {(profile.open_issues?.length ?? 0) === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                暂无待办。完成「课中五式·闯关」错题或答疑多轮转接后，会自动出现在这里。
              </p>
            ) : (
              <ul className="space-y-3">
                {profile.open_issues!.map((issue) => (
                  <li
                    key={issue.issue_id}
                    className="rounded-sm border border-[var(--orange)]/25 bg-[var(--orange-fog)]/50 px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-[var(--orange-deep)]">
                        {issue.title}
                      </p>
                      <span className="text-[10px] tracking-wider text-[var(--muted)]">
                        {issue.source === "quiz"
                          ? "课中闯关"
                          : issue.source === "escalation"
                            ? "答疑转接"
                            : issue.source}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--ink)]">
                      {issue.detail}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <TypeGuide highlight={profile.type_tag} />

          <Panel title="分层提示" hint="与⑥分层任务、⑤课中五式联动">
            <p className="text-sm leading-7 text-[var(--muted)]">
              {isFormedType(profile.type_tag) ? (
                <>
                  你更偏
                  <strong className="mx-1 text-[var(--orange-deep)]">
                    {typeLabel[profile.type_tag] ?? profile.type_tag}
                  </strong>
                  ：雷达短板轴会随
                  <strong className="mx-1 text-[var(--orange-deep)]">答疑转接</strong>
                  与
                  <strong className="mx-1 text-[var(--orange-deep)]">课中闯关</strong>
                  真实回写变化；教师「学情看板 / 周报」同步读取同一库。
                </>
              ) : (
                <>
                  画像尚未形成。完成
                  <strong className="mx-1 text-[var(--orange-deep)]">学伴答疑</strong>
                  、
                  <strong className="mx-1 text-[var(--orange-deep)]">课中闯关</strong>
                  或
                  <strong className="mx-1 text-[var(--orange-deep)]">短视频工坊</strong>
                  后，系统会按真实行为生成五型之一，并推送对应分层任务。
                </>
              )}
            </p>
          </Panel>
        </>
      )}
    </div>
  );
}
