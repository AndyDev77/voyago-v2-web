/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

export function Avatar({
  picture,
  emoji,
  size = 40,
  ring,
  className,
}: {
  picture?: string | null;
  emoji?: string | null;
  size?: number;
  ring?: "primary" | "gold";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-surface-2 flex items-center justify-center",
        ring === "primary" && "ring-2 ring-primary ring-offset-2 ring-offset-bg",
        ring === "gold" && "ring-[3px] ring-gold ring-offset-2 ring-offset-bg",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {picture ? (
        <img src={picture} alt="" className="size-full object-cover" />
      ) : (
        <span style={{ fontSize: size * 0.55 }}>{emoji || "🦜"}</span>
      )}
    </div>
  );
}
