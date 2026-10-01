"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Spinner } from "./ui";

/**
 * Garde de route — même logique que RouterNotifier.redirect (mobile) :
 * non connecté → /login ; onboarding non terminé → /onboarding.
 */
export function RequireAuth({ children, allowIncompleteOnboarding }: { children: React.ReactNode; allowIncompleteOnboarding?: boolean }) {
  const { ready, isLoggedIn, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const needsOnboarding = isLoggedIn && !user?.onboarding_completed && !allowIncompleteOnboarding;

  useEffect(() => {
    if (!ready) return;
    if (!isLoggedIn) {
      // Le proxy a laissé passer un cookie de session que le backend refuse : on le purge via le BFF
      fetch("/bff/auth/logout", { method: "POST" }).catch(() => {});
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
    else if (needsOnboarding) router.replace("/onboarding");
  }, [ready, isLoggedIn, needsOnboarding, router, pathname]);

  if (!ready || !isLoggedIn || needsOnboarding) return <Spinner label="Chargement de ton aventure…" className="min-h-[60vh]" />;
  return <>{children}</>;
}
