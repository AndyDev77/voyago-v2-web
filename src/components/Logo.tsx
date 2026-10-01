/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

export function Logo({ href = "/", compact }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 shrink-0">
      <img src="/brand/parrot.png" alt="" className="size-9 object-contain drop-shadow-[0_0_10px_rgba(13,242,204,0.35)]" />
      {!compact && <span className="text-xl font-bold tracking-tight">Voyago</span>}
    </Link>
  );
}
