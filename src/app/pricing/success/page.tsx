"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Crown, Loader2, XCircle } from "lucide-react";
import { proApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { LinkButton } from "@/components/ui";

/** Retour Stripe : on interroge /api/pro/status/:session_id jusqu'à application du statut Pro. */
function Success() {
  const sessionId = useSearchParams().get("session_id");
  const { refresh } = useAuth();
  const [state, setState] = useState<"pending" | "paid" | "failed">(sessionId ? "pending" : "failed");

  useEffect(() => {
    if (!sessionId) return;
    let tries = 0;
    let stop = false;
    const poll = async () => {
      if (stop) return;
      tries++;
      try {
        const s = await proApi.status(sessionId);
        if (s.payment_status === "paid") {
          setState("paid");
          refresh();
          return;
        }
        if (s.status === "expired") return setState("failed");
      } catch {
        // on réessaie
      }
      if (tries < 15) setTimeout(poll, 2000);
      else setState("failed");
    };
    poll();
    return () => {
      stop = true;
    };
  }, [sessionId, refresh]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
      {state === "pending" && (
        <>
          <Loader2 className="size-14 animate-spin text-gold" />
          <h1 className="mt-6 text-2xl font-bold">Confirmation du paiement…</h1>
          <p className="mt-2 text-muted">Quelques secondes, on active ton statut Pro.</p>
        </>
      )}
      {state === "paid" && (
        <>
          <div className="relative">
            <Crown className="size-20 text-gold drop-shadow-[0_0_25px_rgba(255,200,0,0.6)]" />
            <CheckCircle2 className="absolute -bottom-1 -right-1 size-8 rounded-full bg-bg text-primary" />
          </div>
          <h1 className="mt-6 text-3xl font-bold">Bienvenue chez les Pro 💎</h1>
          <p className="mt-2 text-muted">Voyages illimités débloqués. Le monde est à toi !</p>
          <LinkButton href="/swipe" variant="gold" size="lg" className="mt-8">
            Créer un voyage
          </LinkButton>
        </>
      )}
      {state === "failed" && (
        <>
          <XCircle className="size-14 text-coral" />
          <h1 className="mt-6 text-2xl font-bold">Paiement non confirmé</h1>
          <p className="mt-2 text-muted">Si tu as été débité, ton statut sera mis à jour automatiquement sous peu.</p>
          <LinkButton href="/pricing" variant="ghost" size="lg" className="mt-8">
            Retour aux offres
          </LinkButton>
        </>
      )}
    </div>
  );
}

export default function SuccessPage() {
  return (
    <AppShell>
      <Suspense>
        <Success />
      </Suspense>
    </AppShell>
  );
}
