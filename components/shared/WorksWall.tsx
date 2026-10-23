"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  WORKS_GALLERY,
  type WorkClip,
} from "@/lib/content/worksGallery";

const floatClass = [
  "works-float-a",
  "works-float-b",
  "works-float-c",
  "works-float-d",
] as const;

/**
 * 环绕槽位：以舞台中心为锚点（left/top = 卡片中心），左右严格对称。
 * tier1 近主视觉大奖位 · tier2 腰线 · tier3 外圈小品
 */
type SatSlot = {
  cx: number;
  cy: number;
  /** 1 大奖近位 · 2 中位 · 3 外圈小品 */
  tier: 1 | 2 | 3;
};

const SAT_SLOTS: SatSlot[] = [
  /* 更靠外缘，避开中心四强错落区 */
  { cx: 11, cy: 9, tier: 1 },
  { cx: 89, cy: 9, tier: 1 },
  { cx: 26, cy: 5, tier: 2 },
  { cx: 74, cy: 5, tier: 2 },
  { cx: 6, cy: 36, tier: 1 },
  { cx: 94, cy: 36, tier: 1 },
  { cx: 5, cy: 58, tier: 2 },
  { cx: 95, cy: 58, tier: 2 },
  { cx: 14, cy: 86, tier: 2 },
  { cx: 86, cy: 86, tier: 2 },
  { cx: 36, cy: 93, tier: 3 },
  { cx: 64, cy: 93, tier: 3 },
  { cx: 18, cy: 22, tier: 3 },
  { cx: 82, cy: 22, tier: 3 },
  { cx: 18, cy: 74, tier: 3 },
  { cx: 82, cy: 74, tier: 3 },
];

const TIER_WIDTH: Record<1 | 2 | 3, string> = {
  1: "17.5%",
  2: "15%",
  3: "13%",
};

/** 国家级成片在环绕时再放大一档 */
const NATION_SAT_WIDTH = "19%";

function isNational(award: string) {
  return /国家级/.test(award);
}

/** 奖项权重：越高越靠近中心、越易进主视觉 */
function awardRank(award: string): number {
  if (/国家级/.test(award) && !/优秀/.test(award)) return 100;
  if (/国家级优秀/.test(award)) return 96;
  if (/省级/.test(award) && /一等/.test(award)) return 84;
  if (/校级/.test(award) && /一等/.test(award)) return 78;
  if (/省级/.test(award) && /二等|三等/.test(award)) return 64;
  if (/省级/.test(award)) return 70;
  if (/校级/.test(award)) return 58;
  if (/品牌/.test(award)) return 52;
  return 32;
}

function mediaSrc(clipId: string, hiRes: boolean) {
  return hiRes
    ? `/works/preview/${clipId}.mp4`
    : `/works/anim/${clipId}.webp`;
}

function Media({
  clip,
  className,
  hiRes = false,
}: {
  clip: WorkClip;
  className?: string;
  hiRes?: boolean;
}) {
  const preferred = mediaSrc(clip.id, hiRes);
  const [src, setSrc] = useState(preferred);

  useEffect(() => {
    setSrc(mediaSrc(clip.id, hiRes));
  }, [clip.id, hiRes]);

  if (src.endsWith(".webp")) {
    return (
      <img
        key={src}
        src={src}
        alt={clip.title}
        className={className}
        draggable={false}
        onError={() => setSrc(`/works/preview/${clip.id}.mp4`)}
      />
    );
  }
  return (
    <video
      key={src}
      className={className}
      src={src}
      muted
      autoPlay
      playsInline
      loop
      preload="auto"
    />
  );
}

function Satellite({
  clip,
  index,
  slot,
  onPromote,
}: {
  clip: WorkClip;
  index: number;
  slot: SatSlot;
  onPromote: () => void;
}) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(
      () => setEntered(true),
      reduce ? 0 : 280 + index * 90,
    );
    return () => window.clearTimeout(t);
  }, [index]);

  const nation = isNational(clip.award);
  const style = {
    left: `${slot.cx}%`,
    top: `${slot.cy}%`,
    width: nation ? NATION_SAT_WIDTH : TIER_WIDTH[slot.tier],
    "--pane-delay": `${index * 55}ms`,
    "--float-delay": `${(index % 7) * -0.7}s`,
  } as CSSProperties;

  return (
    <button
      type="button"
      className={`works-sat absolute works-sat-t${slot.tier}${nation ? " works-sat-nation" : ""}`}
      style={style}
      onClick={onPromote}
      title={`${clip.award} · ${clip.title}`}
    >
      <div
        className={`works-sat-pivot works-pane aspect-[4/3] w-full ${
          entered ? "works-pane-in" : "works-pane-prep"
        }`}
      >
        <div
          className={`works-pane-bob absolute inset-0 ${floatClass[index % 4]}`}
        >
          <div className="works-pane-frame absolute inset-0 overflow-hidden rounded-[3px]">
            <div className="works-pane-shine" aria-hidden />
            <Media
              clip={clip}
              className="works-pane-video pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
            <div className="works-pane-veil pointer-events-none absolute inset-0" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-1.5 md:p-2">
              <p className="truncate text-[8px] tracking-[0.16em] text-[var(--orange-soft)] md:text-[9px]">
                {clip.award}
              </p>
              <h3 className="font-display truncate text-[11px] text-white md:text-xs">
                {clip.title}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function stampLabels(award: string): string[] {
  const out: string[] = [];
  if (/国家级优秀/.test(award)) out.push("国家级优秀");
  else if (/国家级/.test(award)) out.push("国家级");
  if (/省级/.test(award) && /一等/.test(award)) out.push("省级一等");
  else if (/省级/.test(award)) out.push("省级");
  if (/校级/.test(award) && /一等/.test(award)) out.push("校级一等");
  else if (/校级/.test(award)) out.push("校级");
  if (!out.length && /品牌|市级/.test(award)) out.push(award.slice(0, 6));
  return out.slice(0, 2);
}

function Hero({
  clip,
  onBack,
}: {
  clip: WorkClip;
  onBack?: () => void;
}) {
  const stamps = stampLabels(clip.award);
  return (
    <article
      key={clip.id}
      className={`works-hero works-hero-depth works-pane relative${onBack ? " pointer-events-auto" : ""}`}
      style={{ "--pane-delay": "0ms" } as CSSProperties}
    >
      <div className="works-pane-bob absolute inset-0">
        <div className="works-pane-frame works-hero-frame absolute inset-0 overflow-hidden rounded-[4px]">
          <div className="works-pane-shine" aria-hidden />
          <Media
            clip={clip}
            hiRes
            className="works-pane-video pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
          <div className="works-pane-veil pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3 md:p-4">
            <p className="text-[10px] tracking-[0.28em] text-[var(--orange-soft)]">
              {clip.award} · 主视觉
            </p>
            <h3 className="font-display text-lg text-white md:text-xl">
              {clip.title}
            </h3>
            <p className="mt-0.5 text-[11px] text-white/70">{clip.tag}</p>
          </div>
        </div>
        {stamps.length > 0 ? (
          <div className="works-stamp-stack pointer-events-none absolute -right-2 -top-3 z-20 md:-right-3 md:-top-4">
            {stamps.map((s, i) => (
              <span
                key={`${clip.id}-${s}`}
                className="works-stamp"
                style={{ animationDelay: `${0.35 + i * 0.22}s` }}
              >
                {s}
              </span>
            ))}
          </div>
        ) : null}
        {onBack ? (
          <button
            type="button"
            className="pointer-events-auto absolute left-2 top-2 z-20 rounded-sm border border-white/40 bg-black/45 px-2 py-1 text-[10px] text-white backdrop-blur-sm transition hover:bg-black/60"
            onClick={onBack}
          >
            ← 返回四强
          </button>
        ) : null}
      </div>
      <div className="aspect-[16/10] w-full" aria-hidden />
    </article>
  );
}

/** 四强错落叠放 */
const NATION_SCATTER: Array<{
  left: string;
  top: string;
  w: string;
  rot: string;
  z: number;
}> = [
  { left: "6%", top: "8%", w: "48%", rot: "-4.5deg", z: 4 },
  { left: "48%", top: "2%", w: "46%", rot: "3.2deg", z: 3 },
  { left: "2%", top: "48%", w: "44%", rot: "2.5deg", z: 2 },
  { left: "46%", top: "44%", w: "50%", rot: "-3deg", z: 5 },
];

function NationQuad({
  clips,
  onFocus,
}: {
  clips: WorkClip[];
  onFocus: (id: string) => void;
}) {
  const four = clips.slice(0, 4);
  return (
    <div className="works-nation-quad pointer-events-auto">
      <p className="works-nation-quad-label">国家级 · 四强错落</p>
      <div className="works-nation-scatter">
        {four.map((clip, i) => {
          const pos = NATION_SCATTER[i] ?? NATION_SCATTER[0]!;
          return (
            <button
              key={clip.id}
              type="button"
              className="works-nation-cell works-hero-depth"
              style={
                {
                  left: pos.left,
                  top: pos.top,
                  width: pos.w,
                  zIndex: pos.z,
                  "--nation-rot": pos.rot,
                  animationDelay: `${i * 0.2}s`,
                } as CSSProperties
              }
              onClick={() => onFocus(clip.id)}
              title={`放大 · ${clip.title}`}
            >
              <div className="works-pane-frame works-hero-frame absolute inset-0 overflow-hidden rounded-[3px]">
                <div className="works-pane-shine" aria-hidden />
                <Media
                  clip={clip}
                  hiRes
                  className="works-pane-video pointer-events-none absolute inset-0 h-full w-full object-cover"
                />
                <div className="works-pane-veil pointer-events-none absolute inset-0" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-2">
                  <p className="truncate text-[8px] tracking-[0.16em] text-[var(--orange-soft)]">
                    {clip.award}
                  </p>
                  <h3 className="font-display truncate text-xs text-white md:text-sm">
                    {clip.title}
                  </h3>
                </div>
                <span className="works-stamp works-stamp-mini" aria-hidden>
                  国家级
                </span>
              </div>
              <span className="block aspect-[16/10] w-full" aria-hidden />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 荣誉轨：成片奖项滚动，讲圆⑧孵化转化 */
function HonorRail({
  clips,
  onPick,
}: {
  clips: WorkClip[];
  onPick: (id: string) => void;
}) {
  const honors = useMemo(() => {
    const list = [...clips]
      .filter((c) => awardRank(c.award) >= 52)
      .sort(
        (a, b) =>
          awardRank(b.award) - awardRank(a.award) ||
          a.title.localeCompare(b.title, "zh"),
      );
    return list.length ? list : clips.slice(0, 8);
  }, [clips]);

  const stats = useMemo(() => {
    let nation = 0;
    let prov = 0;
    let school = 0;
    for (const c of clips) {
      if (/国家级/.test(c.award)) nation += 1;
      else if (/省级/.test(c.award)) prov += 1;
      else if (/校级/.test(c.award)) school += 1;
    }
    return { nation, prov, school };
  }, [clips]);

  const loop = [...honors, ...honors];

  return (
    <div className="works-honor">
      <div className="works-honor-stats">
        <span>
          国家级 <strong>{stats.nation}</strong>
        </span>
        <span>
          省级 <strong>{stats.prov}</strong>
        </span>
        <span>
          校级 <strong>{stats.school}</strong>
        </span>
        <span className="works-honor-stats-tip">荣誉追踪 · 孵化转化</span>
      </div>
      <div className="works-honor-rail" aria-label="荣誉滚动轨">
        <div className="works-honor-track">
          {loop.map((c, i) => (
            <button
              key={`${c.id}-${i}`}
              type="button"
              className="works-honor-chip"
              onClick={() => onPick(c.id)}
              title={`切换主视觉 · ${c.title}`}
            >
              <span className="works-honor-chip-award">{c.award}</span>
              <span className="works-honor-chip-title">{c.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** 按奖项填对称槽：大奖→近位；成对左右填，避免一边沉 */
function placeSatellites(rest: WorkClip[]): Array<{ clip: WorkClip; slot: SatSlot }> {
  const sorted = [...rest].sort(
    (a, b) =>
      awardRank(b.award) - awardRank(a.award) ||
      a.title.localeCompare(b.title, "zh"),
  );
  const buckets: Record<1 | 2 | 3, SatSlot[]> = {
    1: [...SAT_SLOTS.filter((s) => s.tier === 1)].sort((a, b) => a.cx - b.cx),
    2: [...SAT_SLOTS.filter((s) => s.tier === 2)].sort((a, b) => a.cx - b.cx),
    3: [...SAT_SLOTS.filter((s) => s.tier === 3)].sort((a, b) => a.cx - b.cx),
  };
  const used = new Set<string>();
  const out: Array<{ clip: WorkClip; slot: SatSlot }> = [];

  function slotKey(s: SatSlot) {
    return `${s.cx}-${s.cy}`;
  }

  /** 优先取「更靠左且未用」再取对称右，保持画面平衡 */
  function takeSlot(prefer: 1 | 2 | 3): SatSlot | null {
    for (const t of [prefer, 1, 2, 3] as const) {
      const free = buckets[t].filter((s) => !used.has(slotKey(s)));
      if (!free.length) continue;
      const lefts = free.filter((s) => s.cx < 50);
      const rights = free.filter((s) => s.cx >= 50);
      const leftCount = out.filter((o) => o.slot.cx < 50).length;
      const rightCount = out.filter((o) => o.slot.cx >= 50).length;
      const pickFrom =
        leftCount <= rightCount
          ? lefts.length
            ? lefts
            : rights
          : rights.length
            ? rights
            : lefts;
      const hit = pickFrom[0]!;
      used.add(slotKey(hit));
      return hit;
    }
    return null;
  }

  for (const clip of sorted) {
    const rank = awardRank(clip.award);
    const prefer: 1 | 2 | 3 = isNational(clip.award)
      ? 1
      : rank >= 58
        ? 2
        : 3;
    const slot = takeSlot(prefer);
    if (!slot) break;
    out.push({ clip, slot });
  }
  return out;
}

export function WorksWall() {
  const [clips, setClips] = useState<WorkClip[]>(WORKS_GALLERY);
  /** 中间只放大一个；点击切换，不自动轮换 */
  const [heroId, setHeroId] = useState("lion-nation");

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/works/gallery");
        const json = await res.json();
        if (!res.ok || !json?.data?.clips?.length) return;
        setClips(
          json.data.clips.map(
            (c: {
              clip_id: string;
              title: string;
              award: string;
              tag: string;
              size: WorkClip["size"];
              source_file: string;
            }) => ({
              id: c.clip_id,
              file: c.source_file,
              title: c.title,
              award: c.award,
              tag: c.tag,
              size: c.size,
            }),
          ),
        );
      } catch {
        /* 本地清单 */
      }
    })();
  }, []);

  const { hero, orbit } = useMemo(() => {
    const national = clips.find((c) => isNational(c.award));
    const h =
      clips.find((c) => c.id === heroId) ??
      clips.find((c) => c.id === "lion-nation") ??
      national ??
      clips[0]!;
    const rest = clips.filter((c) => c.id !== h.id);
    return { hero: h, orbit: placeSatellites(rest) };
  }, [clips, heroId]);

  const heroNation = isNational(hero.award);

  return (
    <section className="works-hall">
      <header className="works-hall-head">
        <div>
          <p className="text-[11px] tracking-[0.36em] text-[var(--orange)]">
            ⑧ 作品成果库 · 荣誉孵化
          </p>
          <h2 className="font-brand gold-shimmer-text mt-1 text-4xl md:text-5xl">
            成果如林
          </h2>
        </div>
      </header>

      <HonorRail clips={clips} onPick={setHeroId} />

      <div className="works-orbit">
        <div className="works-orbit-glow" aria-hidden />
        <div className="works-orbit-mark font-brand" aria-hidden>
          启航
        </div>

        <div className="works-orbit-stage">
          {orbit.map(({ clip, slot }, i) => (
            <Satellite
              key={clip.id}
              clip={clip}
              index={i}
              slot={slot}
              onPromote={() => setHeroId(clip.id)}
            />
          ))}

          <div
            className={`works-orbit-core pointer-events-none${heroNation ? " works-orbit-core-nation" : ""}`}
          >
            <Hero clip={hero} />
          </div>
        </div>
      </div>
    </section>
  );
}
