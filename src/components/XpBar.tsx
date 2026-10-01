import { cn } from "@/lib/utils";

export function XpBar({
  value,
  max,
  color = "gold",
  className,
  height = 10,
}: {
  value: number;
  max: number;
  color?: "gold" | "primary";
  className?: string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  return (
    <div className={cn("w-full overflow-hidden rounded-full bg-line/70", className)} style={{ height }}>
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-700 ease-out",
          color === "gold" ? "bg-gradient-to-r from-gold-dark to-gold" : "bg-gradient-to-r from-primary-dark to-primary",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
