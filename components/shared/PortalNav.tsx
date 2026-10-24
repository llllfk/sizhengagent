"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DbGate } from "@/components/shared/DbGate";
import { StoryStrip } from "@/components/shared/StoryStrip";
import { useSession } from "@/components/shared/useSession";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; tag?: string };

export type PortalTone = "student" | "teacher" | "community";

const toneMeta: Record<
  PortalTone,
  { eyebrow: string; homeHref: string }
> = {
  student: { eyebrow: "智能学伴 · 24H", homeHref: "/companion" },
  teacher: { eyebrow: "人机协同中枢", homeHref: "/workbench" },
  community: { eyebrow: "观点碰撞 · 精华沉淀", homeHref: "/forum" },
};

export function PortalShell({
  title,
  items,
  tone = "student",
  children,
}: {
  title: string;
  items: NavItem[];
  tone?: PortalTone;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const meta = toneMeta[tone];
  const { user } = useSession();

  return (
    <div className="portal-root relative min-h-dvh overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[var(--paper)]" />
        <div
          className="absolute -left-20 top-0 h-[380px] w-[380px] rounded-full blur-3xl"
          style={{ background: "rgba(246,199,154,0.55)" }}
        />
        <div
          className="absolute -right-16 bottom-10 h-[320px] w-[320px] rounded-full blur-3xl"
          style={{ background: "rgba(232,120,47,0.16)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.9) 0%, transparent 40%), radial-gradient(circle at 80% 0%, rgba(255,241,230,0.9) 0%, transparent 35%)",
          }}
        />
      </div>

      <header className="relative z-20 border-b border-[var(--line)] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={meta.homeHref}
              className="font-brand gold-shimmer-text text-2xl"
            >
              启航
            </Link>
            <span className="hidden h-4 w-px bg-[var(--line)] sm:block" />
            <div className="min-w-0">
              <p className="truncate text-[10px] tracking-[0.28em] text-[var(--orange)]">
                {meta.eyebrow}
              </p>
              <h1 className="font-display truncate text-sm text-[var(--ink)] md:text-base">
                {title}
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {user ? (
              <>
                <span className="hidden text-[11px] text-[var(--muted)] sm:inline">
                  {user.display_name}
                  <span className="mx-1 text-[var(--line)]">·</span>
                  {user.role === "teacher"
                    ? "教师"
                    : user.student_id || user.username}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const portal =
                      typeof window !== "undefined"
                        ? window.sessionStorage.getItem("qihang_portal")
                        : null;
                    void fetch("/api/auth/logout", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ portal }),
                    }).finally(() => {
                      try {
                        window.sessionStorage.removeItem("qihang_portal");
                      } catch {
                        /* ignore */
                      }
                      window.location.href = "/";
                    });
                  }}
                  className="rounded-sm border border-[var(--line)] bg-white px-3 py-1.5 text-[11px] text-[var(--muted)] transition hover:border-[var(--orange)] hover:text-[var(--orange)]"
                >
                  退出登录
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="hidden text-[11px] text-[var(--muted)] sm:inline">
                  未登录启航
                </span>
                <Link
                  href="/"
                  className="rounded-sm border border-[var(--orange)]/40 bg-[var(--orange-fog)] px-3 py-1.5 text-[11px] text-[var(--orange-deep)] transition hover:border-[var(--orange)]"
                >
                  去登录
                </Link>
              </div>
            )}
          </div>
        </div>

        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3 md:px-8">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 rounded-sm px-3 py-2 text-xs tracking-wide transition md:text-sm",
                  active
                    ? "bg-gradient-to-r from-[var(--orange)] to-[var(--orange-deep)] font-medium text-white shadow-[0_8px_24px_rgba(232,120,47,0.28)]"
                    : "text-[var(--muted)] hover:bg-[var(--orange-fog)] hover:text-[var(--orange-deep)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main
        className={cn(
          "relative z-10 mx-auto w-full animate-rise px-5 py-6 md:px-8 md:py-8",
          pathname.startsWith("/works")
            ? "max-w-[1040px]"
            : pathname.startsWith("/workbench") || pathname.startsWith("/modules")
              ? "max-w-7xl"
              : "max-w-6xl",
        )}
      >
        {!pathname.startsWith("/works") &&
        !pathname.startsWith("/workbench") &&
        !pathname.startsWith("/modules") ? (
          <StoryStrip tone={tone} />
        ) : null}
        <DbGate>{children}</DbGate>
      </main>
    </div>
  );
}
