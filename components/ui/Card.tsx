import { cn } from "@/lib/utils";

export function Panel({
  className,
  children,
  title,
  hint,
}: {
  className?: string;
  children: React.ReactNode;
  title?: string;
  hint?: string;
}) {
  return (
    <section
      className={cn(
        "portal-panel relative overflow-hidden rounded-sm border border-[var(--glass-border)] p-5 md:p-6",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[var(--orange)] via-[var(--orange-soft)] to-transparent"
        aria-hidden
      />
      {title ? (
        <header className="mb-4 pl-2">
          <h2 className="font-display text-xl font-bold text-[var(--ink)] md:text-2xl">
            {title}
          </h2>
          {hint ? (
            <p className="mt-1 text-sm font-medium text-[var(--muted)] md:text-base">{hint}</p>
          ) : null}
        </header>
      ) : null}
      <div className={title ? "pl-2" : undefined}>{children}</div>
    </section>
  );
}
