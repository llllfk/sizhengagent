import { Suspense } from "react";
import Image from "next/image";
import { FlightTrail } from "@/components/shared/FlightTrail";
import { LoginForm } from "@/components/shared/LoginForm";
import { LoginReveal } from "@/components/shared/LoginReveal";

const particles = [
  { left: "8%", delay: "0s", dur: "14s", size: 3 },
  { left: "18%", delay: "2s", dur: "16s", size: 2 },
  { left: "32%", delay: "4.5s", dur: "13s", size: 4 },
  { left: "48%", delay: "1.2s", dur: "17s", size: 2 },
  { left: "63%", delay: "3.4s", dur: "15s", size: 3 },
  { left: "74%", delay: "5.8s", dur: "14s", size: 2 },
  { left: "86%", delay: "0.8s", dur: "18s", size: 3 },
  { left: "92%", delay: "6.2s", dur: "12s", size: 2 },
];

export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh w-full flex-col overflow-x-hidden text-[var(--ink)]">
      <LoginReveal />

      <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#1a2a44]">
        <div className="animate-cloud absolute inset-[-3%]">
          <Image
            src="/images/login-hero.png"
            alt="启航场景：殿脊之上，C919 掠过金瓦"
            fill
            priority
            className="object-cover object-[center_42%] scale-[1.04]"
            sizes="100vw"
          />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(255,248,242,0.96) 0%, rgba(255,248,242,0.9) 28%, rgba(255,241,230,0.55) 48%, rgba(255,241,230,0.18) 68%, rgba(20,30,50,0.22) 100%)",
          }}
          aria-hidden
        />
        {/* 左侧文案区加厚暖白雾，保证浅色机身背景上可读 */}
        <div
          className="absolute inset-y-0 left-0 w-[min(58%,42rem)]"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,248,242,0.97) 0%, rgba(255,248,242,0.88) 55%, rgba(255,248,242,0) 100%)",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-x-0 bottom-0 h-1/3"
          style={{
            background:
              "linear-gradient(to top, rgba(61,42,26,0.32) 0%, transparent 100%)",
          }}
          aria-hidden
        />
        {particles.map((p) => (
          <span
            key={p.left}
            className="particle"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              animationDelay: p.delay,
              animationDuration: p.dur,
            }}
          />
        ))}
        <FlightTrail />
      </div>

      <header className="relative z-10 flex shrink-0 items-center justify-between px-5 py-3 md:px-8 md:py-4">
        <div className="flex items-baseline gap-3">
          <span className="font-brand text-xl text-[var(--orange-deep)] drop-shadow-[0_1px_0_rgba(255,248,242,0.9)] md:text-2xl">
            启航
          </span>
          <span className="hidden text-[11px] tracking-[0.22em] text-[var(--ink)]/70 sm:inline">
            思政智能体 · 空乘课堂
          </span>
        </div>
        <p className="font-display text-xs text-[var(--orange-deep)] md:text-sm">
          讲深 · 讲透 · 讲活
        </p>
      </header>

      <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-6 px-5 py-4 md:grid-cols-[1fr_0.92fr] md:gap-8 md:px-8 md:py-6">
        <section className="space-y-4 md:space-y-5 [text-shadow:0_1px_0_rgba(255,248,242,0.85)]">
          <p className="animate-rise-delay-1 text-[10px] font-medium tracking-[0.28em] text-[var(--orange-deep)] md:text-xs">
            QI HANG · ARTIFICIAL INTELLIGENCE +
          </p>
          <h1 className="animate-rise-delay-1 font-brand animate-brand-glow text-[2.75rem] leading-none text-[var(--ink)] md:text-5xl lg:text-6xl">
            启航
          </h1>
          <p className="animate-rise-delay-2 font-display text-base font-semibold text-[var(--orange-deep)] md:text-xl">
            智教慧学，思政领航
          </p>
          <div className="animate-rise-delay-2 max-w-md space-y-1.5 text-xs leading-6 text-[var(--ink)]/78 md:text-sm md:leading-7">
            <p>在大班额的思政课堂，如何让每一个声音「被听见」？</p>
            <p>「启航」智能体，以 AI 赋能思政课堂，</p>
            <p>用启发式答疑启迪，用沉浸式情景推演，</p>
            <p>陪伴每一位云端之上的你们，上好这堂「大思政课」。</p>
          </div>

          <ul className="animate-rise-delay-3 grid max-w-md grid-cols-3 gap-2 border-t border-[var(--ink)]/15 pt-4">
            {[
              { k: "24h", v: "启发式答疑" },
              { k: "五式", v: "课中互动剧场" },
              { k: "五库", v: "学情越用越准" },
            ].map((item) => (
              <li key={item.k} className="space-y-0.5">
                <div className="font-display text-lg font-semibold text-[var(--orange-deep)] md:text-xl">
                  {item.k}
                </div>
                <div className="stat-underline mt-1 h-px w-8 bg-gradient-to-r from-[var(--orange-deep)] to-transparent" />
                <div className="text-[10px] text-[var(--ink)]/70 md:text-xs">
                  {item.v}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="animate-rise-delay-4 w-full max-w-md justify-self-center md:max-w-none md:justify-self-stretch">
          <div
            className="animate-panel-breathe relative rounded-sm border border-[var(--glass-border)] bg-white/90 p-5 shadow-[0_20px_60px_rgba(196,92,26,0.12)] backdrop-blur-md md:p-6"
          >
            <div
              className="animate-corner pointer-events-none absolute left-2.5 top-2.5 h-5 w-5 border-l-2 border-t-2 border-[var(--orange)]"
              aria-hidden
            />
            <div
              className="animate-corner pointer-events-none absolute bottom-2.5 right-2.5 h-5 w-5 border-b-2 border-r-2 border-[var(--orange)]"
              style={{ animationDelay: "1.4s" }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden"
              aria-hidden
            >
              <div
                className="h-full w-1/3 bg-gradient-to-r from-transparent via-[var(--orange)] to-transparent"
                style={{ animation: "btn-shine 3.2s ease-in-out infinite" }}
              />
            </div>

            <div className="mb-4 space-y-1.5">
              <p className="text-[10px] tracking-[0.28em] text-[var(--orange)]">
                登录课堂
              </p>
              <h2 className="font-display text-xl text-[var(--ink)]">
                选择身份，开始本课
              </h2>
              <p className="text-[11px] text-[var(--muted)]">
                登录后仅进入所选身份对应的功能
              </p>
            </div>

            <Suspense
              fallback={
                <p className="animate-pulse text-sm text-[var(--muted)]">
                  加载登录…
                </p>
              }
            >
              <LoginForm />
            </Suspense>
          </div>
        </section>
      </div>
    </main>
  );
}
