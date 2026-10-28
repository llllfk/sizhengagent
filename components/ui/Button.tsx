import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
  /** 请求中：禁用并显示转圈，防止连点 */
  loading?: boolean;
};

function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent",
        className,
      )}
      aria-hidden
    />
  );
}

export function Button({
  className,
  variant = "primary",
  loading = false,
  disabled,
  children,
  ...props
}: Props) {
  const isDisabled = Boolean(disabled || loading);
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2 text-sm font-medium tracking-wide transition disabled:cursor-not-allowed disabled:opacity-55",
        variant === "primary" &&
          "bg-gradient-to-r from-[var(--orange-soft)] via-[var(--orange)] to-[var(--orange-deep)] text-white shadow-[0_8px_20px_rgba(232,120,47,0.28)] hover:brightness-105",
        variant === "ghost" &&
          "border border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--orange)] hover:text-[var(--orange)]",
        className,
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}
