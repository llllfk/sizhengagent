import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export function Button({
  className,
  variant = "primary",
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "rounded-sm px-4 py-2 text-sm font-medium tracking-wide transition disabled:opacity-50",
        variant === "primary" &&
          "bg-gradient-to-r from-[var(--orange-soft)] via-[var(--orange)] to-[var(--orange-deep)] text-white shadow-[0_8px_20px_rgba(232,120,47,0.28)] hover:brightness-105",
        variant === "ghost" &&
          "border border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--orange)] hover:text-[var(--orange)]",
        className,
      )}
      {...props}
    />
  );
}
