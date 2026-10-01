"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const btn = {
  base: "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none",
  primary: "bg-primary text-[#062420] hover:bg-primary-dark glow-primary",
  gold: "bg-gold text-[#2a1f00] hover:bg-gold-dark glow-gold",
  ghost: "border border-line bg-surface-2/60 text-ink hover:border-primary/60 hover:text-primary",
  outline: "border border-primary text-primary hover:bg-primary hover:text-[#062420]",
  danger: "border border-coral/50 text-coral hover:bg-coral/10",
  dark: "bg-[#111] text-white hover:bg-black",
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base py-3.5",
};

type Variant = "primary" | "gold" | "ghost" | "outline" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button className={cn(btn.base, btn[variant], btn[size], className)} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={cn(btn.base, btn[variant], btn[size], className)}>
      {children}
    </Link>
  );
}

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl border border-line bg-surface-solid/80", className)} {...props}>
      {children}
    </div>
  );
}

export function Spinner({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-muted", className)}>
      <Loader2 className="size-8 animate-spin text-primary" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral flex items-center justify-between gap-4">
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="font-bold underline underline-offset-4 shrink-0 cursor-pointer">
          Réessayer
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  emoji = "🦜",
  title,
  text,
  action,
}: {
  emoji?: string;
  title: string;
  text?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3 rounded-2xl border border-dashed border-line px-6 py-14">
      <span className="text-5xl">{emoji}</span>
      <h3 className="text-lg font-bold">{title}</h3>
      {text && <p className="max-w-md text-sm text-muted">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function SectionTitle({ icon, children, action }: { icon?: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
        {icon}
        {children}
      </h2>
      {action}
    </div>
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold">{label}</span>
      {children}
      {error && <span className="text-xs text-coral">{error}</span>}
    </label>
  );
}

export const inputCls =
  "h-12 w-full rounded-xl border border-line bg-bg-deep/60 px-4 text-ink placeholder:text-muted/70 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25";

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-10 rounded-full border px-4 text-sm font-semibold transition cursor-pointer",
        active ? "border-primary bg-primary/15 text-primary" : "border-line bg-surface-2/50 text-ink hover:border-primary/50",
      )}
    >
      {children}
    </button>
  );
}
