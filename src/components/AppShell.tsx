"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Compass, Crown, Flame, Home, LogOut, Plus, Trophy, User, Users, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useGameProfile } from "@/lib/hooks";
import { cn, displayName } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { Logo } from "./Logo";
import { btn } from "./ui";

const NAV = [
  { href: "/dashboard", label: "Tableau de bord", short: "Accueil", icon: Home },
  { href: "/community", label: "Communauté", short: "Tribus", icon: Users },
  { href: "/swipe", label: "Nouveau voyage", short: "Créer", icon: Plus, accent: true },
  { href: "/rewards", label: "Récompenses", short: "XP", icon: Trophy },
  { href: "/profile", label: "Profil", short: "Profil", icon: User },
];

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!user) return null;
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="cursor-pointer rounded-full" aria-label="Menu du compte">
        <Avatar picture={user.picture} emoji={user.avatar_emoji} size={40} ring={user.is_pro ? "gold" : "primary"} />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-60 rounded-2xl border border-line bg-surface-solid p-2 shadow-2xl animate-pop-in">
          <div className="px-3 py-2">
            <p className="font-bold truncate">{displayName(user)}</p>
            <p className="text-xs text-muted truncate">{user.email || "Compte invité"}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-surface-2">
            <User className="size-4" /> Mon profil
          </Link>
          <Link href="/pricing" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-surface-2">
            <Crown className="size-4 text-gold" /> {user.is_pro ? "Mon abonnement Pro" : "Passer Pro"}
          </Link>
          <button
            onClick={() => logout()}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-coral hover:bg-coral/10"
          >
            <LogOut className="size-4" /> Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const { profile } = useGameProfile();

  const isActive = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-line glass">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Logo href={isLoggedIn ? "/dashboard" : "/"} />
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.filter((n) => n.href !== "/profile").map((n) =>
              n.accent ? null : (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition",
                    isActive(n.href) ? "text-primary bg-primary/10" : "text-ink/80 hover:text-primary",
                  )}
                >
                  {n.label}
                </Link>
              ),
            )}
            <Link
              href="/pricing"
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition flex items-center gap-1.5",
                isActive("/pricing") ? "text-gold bg-gold/10" : "text-ink/80 hover:text-gold",
              )}
            >
              <Crown className="size-4" /> Pro
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {isLoggedIn ? (
              <>
                {profile && (
                  <Link href="/rewards" className="hidden sm:flex items-center gap-3 rounded-full border border-line bg-surface-2/60 px-3.5 py-1.5 text-sm font-bold hover:border-gold/60 transition">
                    <span className="flex items-center gap-1 text-gold">
                      <Zap className="size-4 fill-gold" /> {profile.xp} XP
                    </span>
                    <span className="h-4 w-px bg-line" />
                    <span className="flex items-center gap-1 text-orange">
                      <Flame className="size-4 fill-orange" /> {profile.streak}
                    </span>
                    <span className="h-4 w-px bg-line" />
                    <span className="text-primary">Niv. {profile.level}</span>
                  </Link>
                )}
                <Link href="/swipe" className={cn(btn.base, btn.primary, btn.sm, "max-md:hidden")}>
                  <Plus className="size-4" /> Nouveau voyage
                </Link>
                <UserMenu />
              </>
            ) : (
              <>
                <Link href="/login" className={cn(btn.base, btn.outline, btn.sm)}>
                  Connexion
                </Link>
                <Link href="/signup" className={cn(btn.base, btn.primary, btn.sm, "max-sm:hidden")}>
                  Créer un compte
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={cn("flex-1 w-full mx-auto px-4 sm:px-6 pb-28 lg:pb-12", wide ? "max-w-none px-0 sm:px-0 pb-0" : "max-w-7xl pt-8")}>
        {children}
      </main>

      {/* Barre de navigation mobile (équivalent CrystalNavBar) */}
      {isLoggedIn && !wide && (
        <nav className="lg:hidden fixed bottom-4 inset-x-4 z-40 mx-auto max-w-md rounded-2xl border border-line glass px-2 py-2 flex justify-between shadow-2xl">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = isActive(n.href);
            return (
              <Link key={n.href} href={n.href} className="flex flex-1 flex-col items-center gap-0.5 py-1">
                <span
                  className={cn(
                    "flex items-center justify-center rounded-xl transition",
                    n.accent ? "size-11 bg-primary text-[#062420] -mt-6 glow-primary" : "size-8",
                    !n.accent && active && "text-primary",
                    !n.accent && !active && "text-muted",
                  )}
                >
                  <Icon className={n.accent ? "size-6" : "size-5"} />
                </span>
                <span className={cn("text-[10px] font-semibold", active ? "text-primary" : "text-muted")}>{n.short}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {!wide && (
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 px-6 py-6 text-xs text-muted">
            <span className="flex items-center gap-2">
              <Compass className="size-4 text-primary" /> © {new Date().getFullYear()} Voyago — Voyage plus malin, joue plus fort.
            </span>
            <span className="flex gap-5">
              <Link href="/pricing" className="hover:text-primary">Tarifs</Link>
              <Link href="/community" className="hover:text-primary">Communauté</Link>
            </span>
          </div>
        </footer>
      )}
    </div>
  );
}
