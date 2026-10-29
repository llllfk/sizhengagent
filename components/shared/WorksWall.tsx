"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { flushSync } from "react-dom";
import {
  WORKS_GALLERY,
  type WorkClip,
} from "@/lib/content/worksGallery";

/**
 * 三层同心：中心最大 · 中圈稍小 · 外圈剩余小品包围
 * cx/cy 为卡片中心百分比（相对舞台）
 */
type SatSlot = {
  cx: number;
  cy: number;
  /** 1 中圈 · 2 外圈 */
  tier: 1 | 2;
};

/** 从正上方起均分；保证左右镜像对称（奇/偶数圈均可） */
function ringSlots(
  count: number,
  radiusX: number,
  radiusY: number,
  tier: 1 | 2,
  startDeg = -90,
): SatSlot[] {
  return Array.from({ length: count }, (_, i) => {
    const deg = startDeg + (360 / count) * i;
    const rad = (deg * Math.PI) / 180;
    return {
      cx: +(50 + radiusX * Math.cos(rad)).toFixed(2),
      cy: +(50 + radiusY * Math.sin(rad)).toFixed(2),
      tier,
    };
  });
}

/**
 * 中圈 7（含正上）+ 外圈 8（错开半步，避开中圈射线）
 * 外圈底部额外下推，避免被中圈挡住
 */
const INNER_SLOTS = ringSlots(7, 34, 35, 1).map((s) => {
  // 中圈左右（贴近中心成片高度）外推，避免被中心挡住
  const nearMid = 1 - Math.min(1, Math.abs(s.cy - 50) / 30);
  const sideOut =
    Math.abs(s.cx - 50) > 10 ? nearMid * 0.14 : 0;
  let cx = 50 + (s.cx - 50) * (1 + sideOut);
  let cy = s.cy;
  if (s.cy >= 68) {
    cy = s.cy - 3.5;
    cx = 50 + (cx - 50) * 1.04;
  }
  return {
    ...s,
    cy: +cy.toFixed(2),
    cx: +cx.toFixed(2),
  };
});

const OUTER_SLOTS = ringSlots(8, 49, 52, 2, -67.5).map((s) => {
  const dx = Math.abs(s.cx - 50);
  // 左右外圈略外推，减少被中圈挡住，又不至于太散
  const side = Math.max(0, (dx - 30) / 28);
  let cx = 50 + (s.cx - 50) * (1.04 + side * 0.06);
  let cy = s.cy;
  if (s.cy >= 62) {
    const t = Math.min(1, (s.cy - 62) / 28);
    cy = Math.min(96.5, s.cy + 5.5 + t * 4);
    cx = 50 + (cx - 50) * (1.02 + t * 0.04);
  }
  return {
    ...s,
    cy: +cy.toFixed(2),
    cx: +cx.toFixed(2),
  };
});

const TIER_WIDTH: Record<1 | 2, string> = {
  1: "18.7%",
  2: "14.9%",
};

/** 国家级最大，省级/校级次之；整体较上一档放大约 10% */
function satWidth(award: string, tier: 1 | 2): string {
  if (/国家级/.test(award)) return tier === 1 ? "21.5%" : "17%";
  if (/省级|校级/.test(award)) return tier === 1 ? "19.3%" : "15.4%";
  return TIER_WIDTH[tier];
}

function isNational(award: string) {
  return /国家级/.test(award);
}

function awardRank(award: string): number {
  if (/国家级/.test(award) && !/优秀/.test(award)) return 100;
  if (/国家级优秀|我心中的思政课/.test(award)) return 96;
  if (/魅力非遗/.test(award)) return 98;
  if (/省级/.test(award) && /一等/.test(award)) return 84;
  if (/校级/.test(award) && /特等|一等/.test(award)) return 78;
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

function posterSrc(clipId: string) {
  return `/works/poster/${clipId}.jpg`;
}

/** 底层海报立刻出画；动图/视频加载完成后再叠上，避免打开时黑屏 */
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
  const poster = posterSrc(clip.id);
  const [src, setSrc] = useState(preferred);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSrc(mediaSrc(clip.id, hiRes));
    setReady(false);
  }, [clip.id, hiRes]);

  const layerClass = cnMedia(className);

  return (
    <span className="absolute inset-0 block overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt=""
        aria-hidden
        className={layerClass}
        draggable={false}
        decoding="async"
        fetchPriority={hiRes ? "high" : "auto"}
      />
      {src.endsWith(".webp") ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={clip.title}
          className={layerClass}
          style={{ opacity: ready ? 1 : 0, transition: "opacity 0.25s ease" }}
          draggable={false}
          decoding="async"
          onLoad={() => setReady(true)}
          onError={() => setSrc(`/works/preview/${clip.id}.mp4`)}
        />
      ) : (
        <video
          key={src}
          className={layerClass}
          style={{ opacity: ready ? 1 : 0, transition: "opacity 0.25s ease" }}
          src={src}
          poster={poster}
          muted
          autoPlay
          playsInline
          loop
          preload="auto"
          onLoadedData={(e) => {
            const v = e.currentTarget;
            if (v.currentTime < 0.05) v.currentTime = 0.08;
            void v.play().catch(() => {});
            setReady(true);
          }}
        />
      )}
    </span>
  );
}

function cnMedia(className?: string) {
  return [
    "pointer-events-none absolute inset-0 h-full w-full object-cover",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

function Satellite({
  clip,
  index,
  slot,
  onOpen,
}: {
  clip: WorkClip;
  index: number;
  slot: SatSlot;
  onOpen: () => void;
}) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    // 立刻显示画面，仅做轻微入场，避免打开时黑屏等待
    setEntered(true);
  }, []);

  // 左右外圈抬高一层，避免被中圈大卡压死
  const sideBoost =
    slot.tier === 2
      ? Math.round(Math.max(0, Math.abs(slot.cx - 50) - 32) / 6)
      : 0;

  const style = {
    left: `${slot.cx}%`,
    top: `${slot.cy}%`,
    width: satWidth(clip.award, slot.tier),
    zIndex: (slot.tier === 1 ? 3 : 2) + sideBoost,
    "--pane-delay": `${index * 45}ms`,
    "--float-delay": `${(index % 7) * -0.7}s`,
  } as CSSProperties;

  const nation = isNational(clip.award);

  return (
    <button
      type="button"
      className={`works-sat absolute works-sat-t${slot.tier} works-sat-clear${
        nation ? " works-sat-nation" : ""
      }`}
      style={style}
      onClick={onOpen}
      title={`观看完整 · ${clip.award} · ${clip.title}`}
    >
      <div
        className={`works-sat-pivot works-pane aspect-[4/3] w-full ${
          entered ? "works-pane-in" : "works-pane-prep"
        }`}
      >
        <div className="works-pane-bob absolute inset-0">
          <div
            className={`works-pane-frame absolute inset-0 overflow-hidden rounded-[3px]${
              nation ? " works-pane-frame-nation" : ""
            }`}
          >
            <div className="works-pane-shine" aria-hidden />
            <Media
              clip={clip}
              className="works-pane-video pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
            <div className="works-pane-veil pointer-events-none absolute inset-0" />
            {nation ? (
              <span className="works-stamp works-stamp-nation works-stamp-sat" aria-hidden>
                国家级
              </span>
            ) : null}
            {/* 文案叠在画面内，避免伸出后与邻卡重叠 */}
            <div className="works-sat-caption pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[rgba(61,42,26,0.88)] via-[rgba(61,42,26,0.45)] to-transparent px-1.5 pb-1.5 pt-5 text-center">
              <p
                className={`line-clamp-1 text-[7px] leading-snug tracking-wide md:text-[8px] ${
                  nation
                    ? "font-medium text-[#FFE6A8]"
                    : "text-[var(--orange-soft)]"
                }`}
              >
                {clip.award}
              </p>
              <h3 className="mt-0.5 line-clamp-1 font-display text-[9px] leading-snug text-white md:text-[10px]">
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
  if (/国家级/.test(award)) out.push("国家级");
  if (/省级/.test(award)) out.push("省级");
  if (/校级/.test(award)) out.push("校级");
  return out.slice(0, 2);
}

/** 中心成片：点击后弹层播完整有声成片（墙面预览 mp4 是 -an 无音轨） */
function HeroPreview({
  clip,
  videoRef,
  onClose,
}: {
  clip: WorkClip;
  videoRef: RefObject<HTMLVideoElement | null>;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      const v = videoRef.current;
      if (v) {
        v.pause();
        v.removeAttribute("src");
        v.load();
      }
    };
  }, [onClose, videoRef]);

  return (
    <div
      className="works-preview"
      role="dialog"
      aria-modal="true"
      aria-label={`预览 · ${clip.title}`}
      onClick={onClose}
    >
      <div
        className="works-preview-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="works-preview-head">
          <div>
            <p className="text-[10px] tracking-[0.2em] text-[var(--orange)]">
              {clip.award}
            </p>
            <h3 className="mt-1 font-display text-lg text-[var(--ink)] md:text-xl">
              {clip.title}
            </h3>
          </div>
          <button
            type="button"
            className="works-preview-close"
            onClick={onClose}
            aria-label="关闭预览"
          >
            关闭
          </button>
        </header>
        <div className="works-preview-stage">
          <video
            ref={videoRef}
            key={clip.id}
            className="works-preview-video"
            src={`/works/play/${encodeURIComponent(clip.id)}.mp4`}
            controls
            playsInline
            preload="metadata"
            controlsList="nodownload"
            // 微信 / 部分安卓 WebView
            {...({
              "webkit-playsinline": "true",
              "x5-playsinline": "true",
              "x5-video-player-type": "h5",
            } as Record<string, string>)}
          />
        </div>
        <p className="works-preview-hint">
          手机若未自动播放，请点画面上的播放按钮 · 点外侧关闭
        </p>
      </div>
    </div>
  );
}

function Hero({
  clip,
  onPreview,
}: {
  clip: WorkClip;
  onPreview: () => void;
}) {
  const stamps = stampLabels(clip.award);
  const nation = isNational(clip.award);
  return (
    <button
      type="button"
      key={clip.id}
      className="works-hero works-hero-depth works-pane relative pointer-events-auto w-full cursor-pointer overflow-visible border-0 bg-transparent p-0 pt-5 text-left"
      style={{ "--pane-delay": "0ms" } as CSSProperties}
      onClick={onPreview}
      title={`观看完整成片 · ${clip.title}`}
    >
      <div
        className={`works-pane-frame works-hero-frame relative aspect-[16/10] w-full overflow-visible rounded-[4px]${
          nation ? " works-pane-frame-nation" : ""
        }`}
      >
        {/* 画面单独裁切；印章叠在框外，避免只露一半 */}
        <div className="absolute inset-0 overflow-hidden rounded-[4px]">
          <div className="works-pane-shine" aria-hidden />
          <Media
            clip={clip}
            hiRes
            className="works-pane-video pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
          <div className="works-pane-veil pointer-events-none absolute inset-0" />
          <div className="works-hero-caption pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[rgba(61,42,26,0.9)] via-[rgba(61,42,26,0.4)] to-transparent px-3 pb-2.5 pt-8 text-center">
            <p
              className={`text-[10px] leading-snug tracking-[0.06em] md:text-[11px] ${
                nation
                  ? "font-semibold text-[#FFE6A8]"
                  : "text-[var(--orange-soft)]"
              }`}
            >
              {clip.award}
            </p>
            <h3 className="mt-1 font-display text-sm text-white md:text-base">
              {clip.title}
            </h3>
            <p className="mt-1 text-[10px] tracking-[0.18em] text-[var(--orange-soft)]">
              点击观看完整
            </p>
          </div>
        </div>
        {stamps.length > 0 ? (
          <div className="works-stamp-stack pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2 -translate-y-[62%]">
            {stamps.map((s, i) => (
              <span
                key={`${clip.id}-${s}`}
                className={
                  s === "国家级"
                    ? "works-stamp works-stamp-nation"
                    : "works-stamp"
                }
                style={{ animationDelay: `${0.35 + i * 0.22}s` }}
              >
                {s}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </button>
  );
}

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

  /** 成果库总盘点（不全等于墙面展示片数） */
  const stats = { nation: 3, prov: 17, school: 68 };

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
        <span className="works-honor-stats-tip">点击任意成片可看完整</span>
      </div>
      <div className="works-honor-rail" aria-label="荣誉滚动轨">
        <div className="works-honor-track">
          {loop.map((c, i) => {
            const nation = isNational(c.award);
            return (
              <button
                key={`${c.id}-${i}`}
                type="button"
                className={
                  nation
                    ? "works-honor-chip works-honor-chip-nation"
                    : "works-honor-chip"
                }
                onClick={() => onPick(c.id)}
                title={`观看完整 · ${c.title}`}
              >
                <span
                  className={
                    nation
                      ? "works-honor-chip-award works-honor-chip-award-nation"
                      : "works-honor-chip-award"
                  }
                >
                  {nation ? "国家级" : c.award}
                </span>
                <span className="works-honor-chip-title">{c.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** 中圈优先放 ring=inner / 高奖项；外圈放剩余 */
function placeSatellites(
  rest: WorkClip[],
): Array<{ clip: WorkClip; slot: SatSlot }> {
  const preferredInner = rest
    .filter((c) => c.ring === "inner")
    .sort(
      (a, b) =>
        awardRank(b.award) - awardRank(a.award) ||
        a.title.localeCompare(b.title, "zh"),
    );
  const preferredOuter = rest
    .filter((c) => c.ring !== "inner")
    .sort(
      (a, b) =>
        awardRank(b.award) - awardRank(a.award) ||
        a.title.localeCompare(b.title, "zh"),
    );

  // 若 inner 不足，从 outer 高奖补入中圈
  const innerPool = [...preferredInner];
  const outerPool = [...preferredOuter];
  while (innerPool.length < INNER_SLOTS.length && outerPool.length) {
    innerPool.push(outerPool.shift()!);
  }

  const out: Array<{ clip: WorkClip; slot: SatSlot }> = [];
  innerPool.slice(0, INNER_SLOTS.length).forEach((clip, i) => {
    out.push({ clip, slot: INNER_SLOTS[i]! });
  });
  outerPool.slice(0, OUTER_SLOTS.length).forEach((clip, i) => {
    out.push({ clip, slot: OUTER_SLOTS[i]! });
  });

  // 槽位已满则不再硬挤（避免叠片）；多余成片由下方网格承接
  return out;
}

/** 成果元数据跨次进入复用，避免切回成果库再等 API */
let galleryCache: WorkClip[] | null = null;

export function WorksWall() {
  const [clips, setClips] = useState<WorkClip[]>(
    () => galleryCache ?? WORKS_GALLERY,
  );
  const [heroId, setHeroId] = useState("lion-nation");
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  /** 点任意成片：切到中心并打开完整有声预览 */
  function openFull(id?: string) {
    flushSync(() => {
      if (id) setHeroId(id);
      setPreviewOpen(true);
    });
    const v = previewVideoRef.current;
    if (!v) return;
    v.muted = false;
    v.defaultMuted = false;
    v.volume = 1;
    const kick = () => {
      v.muted = false;
      void v.play().catch(() => {
        /* 手机常拦自动播，留给控件手动点 */
      });
    };
    kick();
    v.addEventListener("loadeddata", kick, { once: true });
    v.addEventListener("canplay", kick, { once: true });
  }

  useEffect(() => {
    if (galleryCache?.length) {
      setClips(galleryCache);
      return;
    }
    void (async () => {
      try {
        const res = await fetch("/api/works/gallery");
        const json = await res.json();
        if (!res.ok || !json?.data?.clips?.length) return;
        const next = json.data.clips.map(
          (c: {
            clip_id: string;
            title: string;
            award: string;
            tag: string;
            size: WorkClip["size"];
            source_file: string;
          }) => {
            const local = WORKS_GALLERY.find((w) => w.id === c.clip_id);
            return {
              id: c.clip_id,
              file: c.source_file,
              // API 旧种子可能过期：优先本地已改文案
              title: local?.title ?? c.title,
              award: local?.award ?? c.award,
              tag: local?.tag ?? c.tag,
              size: local?.size ?? c.size,
              ring: local?.ring,
            };
          },
        ) as WorkClip[];
        galleryCache = next;
        setClips(next);
      } catch {
        /* 本地清单 */
      }
    })();
  }, []);

  const { hero, orbit, overflow } = useMemo(() => {
    const centerPref =
      clips.find((c) => c.ring === "center") ??
      clips.find((c) => c.id === "lion-nation");
    const h =
      clips.find((c) => c.id === heroId) ??
      centerPref ??
      clips.find((c) => isNational(c.award)) ??
      clips[0]!;
    const rest = clips.filter((c) => c.id !== h.id);
    const placed = placeSatellites(rest);
    const placedIds = new Set(placed.map((p) => p.clip.id));
    return {
      hero: h,
      orbit: placed,
      overflow: rest.filter((c) => !placedIds.has(c.id)),
    };
  }, [clips, heroId]);

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

      <HonorRail clips={clips} onPick={openFull} />

      <div className="works-orbit">
        <div className="works-orbit-glow" aria-hidden />
        <div className="works-orbit-mark font-brand" aria-hidden>
          启航
        </div>

        <div className="works-orbit-stage works-orbit-stage-rings">
          {orbit.map(({ clip, slot }, i) => (
            <Satellite
              key={clip.id}
              clip={clip}
              index={i}
              slot={slot}
              onOpen={() => openFull(clip.id)}
            />
          ))}

          <div className="works-orbit-core works-orbit-core-hero pointer-events-none">
            <Hero clip={hero} onPreview={() => openFull(hero.id)} />
          </div>
        </div>

        {/* 窄屏：网格排布，保证不叠片 */}
        <div className="works-orbit-grid">
          <button
            type="button"
            className="works-orbit-grid-hero"
            onClick={() => openFull(hero.id)}
            title={`观看完整成片 · ${hero.title}`}
          >
            <div className="works-pane-frame relative aspect-[16/10] overflow-hidden rounded-[4px]">
              <Media
                clip={hero}
                hiRes
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              />
              <div className="works-pane-veil pointer-events-none absolute inset-0" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(61,42,26,0.9)] to-transparent px-3 pb-2.5 pt-8 text-left">
                <p className="line-clamp-1 text-[10px] text-[var(--orange-soft)]">
                  {hero.award}
                </p>
                <h3 className="mt-0.5 font-display text-sm text-white">
                  {hero.title}
                </h3>
                <p className="mt-1 text-[10px] tracking-wider text-[var(--orange-soft)]">
                  点击观看完整
                </p>
              </div>
            </div>
          </button>
          <div className="works-orbit-grid-list">
            {orbit.map(({ clip }, i) => (
              <button
                key={`grid-${clip.id}`}
                type="button"
                className="works-orbit-grid-item"
                style={{ "--pane-delay": `${i * 40}ms` } as CSSProperties}
                onClick={() => openFull(clip.id)}
                title={`观看完整 · ${clip.title}`}
              >
                <div className="works-pane-frame relative aspect-[4/3] overflow-hidden rounded-[3px]">
                  <Media
                    clip={clip}
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="works-pane-veil pointer-events-none absolute inset-0" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(61,42,26,0.88)] to-transparent px-1.5 pb-1.5 pt-4 text-center">
                    <p className="line-clamp-1 text-[8px] text-[var(--orange-soft)]">
                      {clip.award}
                    </p>
                    <h3 className="mt-0.5 line-clamp-1 font-display text-[10px] text-white">
                      {clip.title}
                    </h3>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {overflow.length > 0 ? (
          <div className="works-orbit-overflow">
            {overflow.map((clip) => (
              <button
                key={`ov-${clip.id}`}
                type="button"
                className="works-orbit-grid-item"
                onClick={() => openFull(clip.id)}
                title={`观看完整 · ${clip.title}`}
              >
                <div className="works-pane-frame relative aspect-[4/3] overflow-hidden rounded-[3px]">
                  <Media
                    clip={clip}
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(61,42,26,0.88)] to-transparent px-1.5 pb-1.5 pt-4 text-center">
                    <h3 className="line-clamp-1 font-display text-[10px] text-white">
                      {clip.title}
                    </h3>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {previewOpen ? (
        <HeroPreview
          clip={hero}
          videoRef={previewVideoRef}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
    </section>
  );
}
