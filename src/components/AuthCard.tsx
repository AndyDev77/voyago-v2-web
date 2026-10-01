/* eslint-disable @next/next/no-img-element */
import { Logo } from "./Logo";

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top_left,#134a40_0%,#0c1a18_45%,#0b1517_100%)]">
      <div className="absolute inset-0 bg-dots opacity-40" />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-3xl border border-line bg-gradient-to-b from-[#121a19] to-surface-solid p-7 sm:p-9 shadow-2xl">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full border-2 border-primary bg-primary/5 glow-primary">
              <img src="/brand/parrot.png" alt="" className="size-10" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
          </div>
          {children}
        </div>
        {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
      </div>
    </div>
  );
}
