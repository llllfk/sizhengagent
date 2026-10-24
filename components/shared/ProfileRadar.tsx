"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

export type RadarAxis = { key: string; label: string; value: number };

type Props = {
  axes: RadarAxis[];
  /** 0–1 入场进度由 CSS 控制即可 */
  size?: number;
  className?: string;
  accentLabel?: string;
};

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

/** 可动雷达：轴值 0–100，答辩大屏一眼可读 */
export function ProfileRadar({
  axes,
  size = 280,
  className,
  accentLabel,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const n = Math.max(axes.length, 3);
  const step = 360 / n;

  const rings = [0.35, 0.6, 0.85, 1];

  const grid = useMemo(() => {
    return rings.map((t) => {
      const pts = Array.from({ length: n }, (_, i) => {
        const p = polar(cx, cy, maxR * t, i * step);
        return `${p.x},${p.y}`;
      });
      return pts.join(" ");
    });
  }, [cx, cy, maxR, n, step]);

  const spokes = useMemo(() => {
    return Array.from({ length: n }, (_, i) => {
      const p = polar(cx, cy, maxR, i * step);
      return { x2: p.x, y2: p.y, label: axes[i]?.label ?? "", angle: i * step };
    });
  }, [axes, cx, cy, maxR, n, step]);

  const shape = useMemo(() => {
    const pts = axes.map((ax, i) => {
      const v = Math.max(0, Math.min(100, ax.value)) / 100;
      const p = polar(cx, cy, maxR * v, i * step);
      return `${p.x},${p.y}`;
    });
    return pts.join(" ");
  }, [axes, cx, cy, maxR, step]);

  const dots = useMemo(() => {
    return axes.map((ax, i) => {
      const v = Math.max(0, Math.min(100, ax.value)) / 100;
      return { ...polar(cx, cy, maxR * v, i * step), key: ax.key };
    });
  }, [axes, cx, cy, maxR, step]);

  return (
    <div className={cn("profile-radar relative mx-auto", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="profile-radar-svg overflow-visible"
        role="img"
        aria-label={accentLabel ? `学情雷达 · ${accentLabel}` : "学情雷达"}
      >
        <defs>
          <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(232,120,47,0.45)" />
            <stop offset="100%" stopColor="rgba(232,120,47,0.12)" />
          </radialGradient>
          <filter id="radarGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {grid.map((poly, i) => (
          <polygon
            key={i}
            points={poly}
            fill="none"
            stroke="rgba(232,120,47,0.18)"
            strokeWidth={i === grid.length - 1 ? 1.4 : 1}
          />
        ))}

        {spokes.map((s, i) => (
          <g key={i}>
            <line
              x1={cx}
              y1={cy}
              x2={s.x2}
              y2={s.y2}
              stroke="rgba(232,120,47,0.22)"
              strokeWidth={1}
            />
            <text
              x={polar(cx, cy, maxR + size * 0.09, s.angle).x}
              y={polar(cx, cy, maxR + size * 0.09, s.angle).y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-[var(--muted)]"
              style={{ fontSize: size * 0.042 }}
            >
              {s.label}
            </text>
          </g>
        ))}

        <polygon
          className="profile-radar-shape"
          points={shape}
          fill="url(#radarFill)"
          stroke="var(--orange)"
          strokeWidth={2}
          filter="url(#radarGlow)"
        />

        {dots.map((d) => (
          <circle
            key={d.key}
            className="profile-radar-dot"
            cx={d.x}
            cy={d.y}
            r={4}
            fill="#fff"
            stroke="var(--orange-deep)"
            strokeWidth={2}
          />
        ))}

        <circle cx={cx} cy={cy} r={3.5} fill="var(--orange)" />
      </svg>
      {accentLabel ? (
        <p className="mt-1 text-center text-[10px] tracking-[0.28em] text-[var(--orange)]">
          {accentLabel}
        </p>
      ) : null}
    </div>
  );
}

const TYPE_META = [
  {
    id: "expression" as const,
    label: "表达型",
    hint: "采访 · 发言 · 论坛",
  },
  {
    id: "creation" as const,
    label: "创作型",
    hint: "微电影 · 短视频",
  },
  {
    id: "experience" as const,
    label: "体验型",
    hint: "行走 · 情景演练",
  },
];

/** 三型灯牌：激活型脉冲高亮，适合大屏讲「因材施教」 */
export function TypeBeaconBoard({
  active,
  counts,
  mode = "personal",
}: {
  active?: "expression" | "creation" | "experience" | string;
  counts?: { expression: number; creation: number; experience: number };
  mode?: "personal" | "class";
}) {
  const total =
    (counts?.expression ?? 0) +
    (counts?.creation ?? 0) +
    (counts?.experience ?? 0);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {TYPE_META.map((t, i) => {
        const on = active === t.id;
        const count = counts?.[t.id];
        const pct =
          total > 0 && typeof count === "number"
            ? Math.round((count / total) * 100)
            : null;
        return (
          <div
            key={t.id}
            className={cn(
              "type-beacon relative overflow-hidden rounded-sm border px-4 py-5 text-center transition",
              on
                ? "type-beacon-on border-[var(--orange)] bg-gradient-to-b from-[var(--orange-fog)] to-white shadow-[0_14px_36px_rgba(232,120,47,0.22)]"
                : "border-[var(--line)] bg-white/90 opacity-80",
            )}
            style={{ animationDelay: `${i * 90}ms` }}
          >
            {on ? <span className="type-beacon-ring" aria-hidden /> : null}
            <p className="text-[10px] tracking-[0.28em] text-[var(--orange)]">
              {mode === "class" ? "班级分型" : "思维灯牌"}
            </p>
            <p
              className={cn(
                "mt-2 font-display text-2xl md:text-3xl",
                on ? "text-[var(--orange-deep)]" : "text-[var(--ink)]",
              )}
            >
              {t.label}
            </p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">{t.hint}</p>
            {typeof count === "number" ? (
              <p className="mt-3 font-display text-3xl tabular-nums text-[var(--orange)]">
                {count}
                <span className="ml-1 text-xs font-normal text-[var(--muted)]">
                  人{pct != null ? ` · ${pct}%` : ""}
                </span>
              </p>
            ) : on ? (
              <p className="mt-3 text-xs tracking-wider text-[var(--orange-deep)]">
                当前画像
              </p>
            ) : (
              <p className="mt-3 text-xs text-[var(--muted)]">—</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * 学员雷达轴：优先用服务端按答疑/闯关/任务/作品算出的 radar_axes；
 * 无则回退到本地公式（兼容旧接口）。
 */
export function buildStudentRadarAxes(input: {
  type_tag: string;
  cognition_level: number;
  weak_points: string[];
  task_done?: number;
  radar_axes?: RadarAxis[];
  activity?: {
    qa_sessions?: number;
    qa_rounds?: number;
    open_issues?: number;
    quiz_issues?: number;
    works_count?: number;
    task_done?: number;
    task_total?: number;
    quiz_last?: { score: number; total: number } | null;
  };
}): RadarAxis[] {
  if (input.radar_axes?.length) return input.radar_axes;

  const clamp = (n: number) => Math.max(12, Math.min(98, Math.round(n)));
  const tag = input.type_tag;
  const a = input.activity;
  if (a) {
    const boost = (t: string) => (tag === t ? 14 : 0);
    return [
      {
        key: "expression",
        label: "表达",
        value: clamp(
          28 +
            (a.qa_sessions ?? 0) * 10 +
            (a.qa_rounds ?? 0) * 3 +
            boost("expression"),
        ),
      },
      {
        key: "creation",
        label: "创作",
        value: clamp(26 + (a.works_count ?? 0) * 22 + boost("creation")),
      },
      {
        key: "experience",
        label: "体验",
        value: clamp(
          26 +
            (a.quiz_issues ?? 0) * 10 +
            (a.quiz_last ? 12 : 0) +
            boost("experience"),
        ),
      },
      {
        key: "cognition",
        label: "认知",
        value: clamp((input.cognition_level || 1) * 16 + 18),
      },
      {
        key: "practice",
        label: "实践",
        value: clamp(30 + (a.task_done ?? input.task_done ?? 0) * 14),
      },
      {
        key: "focus",
        label: "短板补强",
        value: clamp(
          88 -
            (a.open_issues ?? 0) * 10 -
            (input.weak_points?.length ?? 0) * 6,
        ),
      },
    ];
  }

  const cog = Math.max(1, Math.min(5, input.cognition_level || 1));
  const weak = input.weak_points?.length ?? 0;
  const tasks = input.task_done ?? Math.max(1, 4 - weak);
  const base = (mine: boolean) => (mine ? 90 : 48);
  return [
    {
      key: "expression",
      label: "表达",
      value: base(tag === "expression") + (tag === "expression" ? 0 : 6),
    },
    {
      key: "creation",
      label: "创作",
      value: base(tag === "creation") + (tag === "creation" ? 0 : 4),
    },
    {
      key: "experience",
      label: "体验",
      value: base(tag === "experience") + (tag === "experience" ? 0 : 5),
    },
    {
      key: "cognition",
      label: "认知",
      value: Math.round(cog * 18 + 10),
    },
    {
      key: "practice",
      label: "实践",
      value: Math.min(95, 40 + tasks * 12),
    },
    {
      key: "focus",
      label: "短板补强",
      value: Math.max(28, 92 - weak * 16),
    },
  ];
}

/** 班级分布雷达 */
export function buildClassRadarAxes(input: {
  type_dist: { expression: number; creation: number; experience: number };
  task_completion_rate: number;
  works_count: number;
  student_count: number;
  weak_top?: number;
  open_learning_issues?: number;
  week_qa?: number;
}): RadarAxis[] {
  const total = Math.max(
    1,
    input.type_dist.expression +
      input.type_dist.creation +
      input.type_dist.experience,
  );
  const worksNorm = Math.min(
    100,
    Math.round((input.works_count / Math.max(1, input.student_count)) * 55 + 35),
  );
  const weakScore = Math.max(
    18,
    100 -
      (input.weak_top ?? 0) * 10 -
      (input.open_learning_issues ?? 0) * 4,
  );
  const qaNorm = Math.min(100, 28 + (input.week_qa ?? 0) * 12);
  return [
    {
      key: "expression",
      label: "表达",
      value: Math.round((input.type_dist.expression / total) * 100),
    },
    {
      key: "creation",
      label: "创作",
      value: Math.round((input.type_dist.creation / total) * 100),
    },
    {
      key: "experience",
      label: "体验",
      value: Math.max(
        Math.round((input.type_dist.experience / total) * 100),
        qaNorm > 40 ? Math.round(qaNorm * 0.55) : 0,
      ),
    },
    {
      key: "tasks",
      label: "任务完成",
      value: input.task_completion_rate,
    },
    { key: "works", label: "成果活跃", value: worksNorm },
    { key: "focus", label: "短板治理", value: weakScore },
  ];
}
