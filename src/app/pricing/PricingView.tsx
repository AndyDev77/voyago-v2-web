"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, ChevronDown, Crown, Lock, ShieldCheck, Star, X } from "lucide-react";
import { proApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/lib/hooks";
import type { ProTier } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button, ErrorBox, Spinner } from "@/components/ui";

// Repli identique au catalogue ProService si l'API est injoignable
const FALLBACK_TIERS: ProTier[] = [
  { id: "monthly", name: "Mensuel", price: 4.99, currency: "eur", duration: "month", benefits: ["Voyages illimités", "Météo étendue 16 jours", "Badge Pro 💎", "Accès anticipé aux nouvelles fonctionnalités"] },
  { id: "annual", name: "Annuel", price: 39.99, currency: "eur", duration: "year", benefits: ["Voyages illimités", "Météo étendue 16 jours", "Badge Pro 💎", "Accès anticipé", "2 mois offerts"], best_offer: true },
  { id: "lifetime", name: "À vie", price: 79.99, currency: "eur", duration: "lifetime", benefits: ["Voyages illimités", "Météo étendue 16 jours", "Badge Pro 💎", "Accès anticipé", "Toutes les futures fonctionnalités"] },
];

const FAQ = [
  { q: "Puis-je résilier à tout moment ?", a: "Oui. Ton accès Pro reste actif jusqu'à la fin de la période payée, sans engagement." },
  { q: "Que se passe-t-il quand j'atteins la limite gratuite ?", a: "Le plan gratuit inclut 3 itinéraires IA par mois. Tes voyages existants restent accessibles ; il suffit d'attendre le mois suivant ou de passer Pro." },
  { q: "Le paiement est-il sécurisé ?", a: "Les paiements sont traités par Stripe. Voyago ne stocke jamais tes informations bancaires." },
  { q: "L'offre « À vie » inclut-elle les futures fonctionnalités ?", a: "Oui, un paiement unique et tu profites de toutes les nouveautés Pro à venir." },
];

const durationLabel = (d: ProTier["duration"]) => (d === "month" ? "/mois" : d === "year" ? "/an" : "une fois");

function Pricing({ initialTiers }: { initialTiers: ProTier[] | null }) {
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const limitReached = params.get("limit") === "1";
  const cancelled = params.get("cancelled") === "true";
  const stripeSessionId = params.get("session_id");

  // Le backend renvoie Stripe vers APP_BASE_URL/pricing?session_id=… : on bascule sur la page de confirmation
  useEffect(() => {
    if (stripeSessionId) router.replace(`/pricing/success?session_id=${encodeURIComponent(stripeSessionId)}`);
  }, [stripeSessionId, router]);
  const tiers = useAsync(() => proApi.tiers().catch(() => FALLBACK_TIERS), [], initialTiers);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const checkout = async (tier: string) => {
    if (!isLoggedIn) return router.push("/login?next=/pricing");
    setError(null);
    setLoadingTier(tier);
    try {
      const { checkout_url } = await proApi.checkout(tier);
      window.location.assign(checkout_url);
    } catch (e) {
      setError((e as Error).message);
      setLoadingTier(null);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {limitReached && (
        <div className="mb-8 w-full max-w-3xl rounded-2xl border border-gold/50 bg-gold/10 px-5 py-4 text-center text-sm">
          <b className="text-gold">Limite gratuite atteinte</b> — tu as généré tes 3 voyages du mois. Passe Pro pour continuer l&apos;aventure sans limite !
        </div>
      )}
      {cancelled && (
        <div className="mb-8 w-full max-w-3xl rounded-2xl border border-line bg-surface-solid px-5 py-4 text-center text-sm text-muted">
          Paiement annulé — aucun montant n&apos;a été débité.
        </div>
      )}
      <h1 className="max-w-3xl text-center text-4xl sm:text-6xl font-bold leading-tight tracking-tight">
        Débloque le monde entier avec <span className="text-gold">Voyago Pro</span>
      </h1>
      <p className="mt-5 max-w-2xl text-center text-lg text-muted">Choisis l&apos;offre qui colle à ton rythme de voyage. Sans engagement, résiliable à tout moment.</p>

      {user?.is_pro && (
        <div className="mt-8 flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-5 py-2 text-sm font-bold text-gold">
          <Crown className="size-4" /> Tu es déjà membre Pro ({user.pro_tier}) — merci !
        </div>
      )}

      {error && <div className="mt-8 w-full max-w-xl"><ErrorBox message={error} /></div>}

      {tiers.loading ? (
        <Spinner />
      ) : (
        <div className="mt-14 grid w-full max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Gratuit */}
          <div className="flex flex-col rounded-3xl border border-line bg-surface-solid/70 p-7">
            <h3 className="text-lg font-bold">Explorateur</h3>
            <p className="mt-3 text-4xl font-bold">
              0 € <span className="text-base font-normal text-muted">/toujours</span>
            </p>
            <p className="mt-2 text-sm text-muted">Parfait pour les escapades du week-end.</p>
            <div className="mt-6 rounded-xl border border-line py-3 text-center text-sm font-bold">{user?.is_pro ? "Inclus" : "Offre actuelle"}</div>
            <ul className="mt-6 flex flex-col gap-3 text-sm">
              {["3 itinéraires IA / mois", "Carte & météo", "Communauté & tribus"].map((b) => (
                <li key={b} className="flex gap-2">
                  <Check className="size-4 shrink-0 text-primary" /> {b}
                </li>
              ))}
              {["Voyages illimités", "Météo 16 jours", "Badge Pro"].map((b) => (
                <li key={b} className="flex gap-2 text-muted/70">
                  <X className="size-4 shrink-0" /> {b}
                </li>
              ))}
            </ul>
          </div>

          {(tiers.data || FALLBACK_TIERS).map((t) => (
            <div
              key={t.id}
              className={cn(
                "relative flex flex-col rounded-3xl border p-7",
                t.best_offer ? "border-2 border-gold bg-surface-solid glow-gold lg:-translate-y-3" : "border-line bg-surface-solid/70",
              )}
            >
              {t.best_offer && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1 text-xs font-bold uppercase tracking-wider text-[#2a1f00]">
                  Meilleure offre
                </span>
              )}
              <h3 className="flex items-center gap-2 text-lg font-bold">
                {t.name} {t.best_offer && <Star className="size-4 fill-gold text-gold" />}
              </h3>
              <p className="mt-3 text-4xl font-bold">
                {t.price.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €{" "}
                <span className="text-base font-normal text-muted">{durationLabel(t.duration)}</span>
              </p>
              <p className="mt-2 h-5 text-sm text-gold">
                {t.duration === "year" ? `Soit ${(t.price / 12).toFixed(2).replace(".", ",")} €/mois` : t.duration === "lifetime" ? "Paiement unique" : ""}
              </p>
              <Button variant={t.best_offer ? "gold" : "outline"} className="mt-6" loading={loadingTier === t.id} disabled={!!loadingTier} onClick={() => checkout(t.id)}>
                {t.best_offer ? "Commencer l'aventure" : "Choisir"} <ArrowRight className="size-4" />
              </Button>
              <p className="mt-6 text-xs font-bold uppercase tracking-widest text-muted">Tout le gratuit, plus :</p>
              <ul className="mt-3 flex flex-col gap-3 text-sm">
                {t.benefits.map((b) => (
                  <li key={b} className="flex gap-2">
                    <Check className="size-4 shrink-0 text-primary" /> {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted">
        <span className="flex items-center gap-2">
          <Lock className="size-4" /> Chiffrement SSL
        </span>
        <span className="flex items-center gap-2">
          <ShieldCheck className="size-4" /> Résiliable à tout moment
        </span>
        <span className="font-bold">Paiement par Stripe</span>
      </div>

      <section className="mt-20 w-full max-w-2xl">
        <h2 className="mb-6 text-center text-2xl font-bold">Questions fréquentes</h2>
        <div className="flex flex-col gap-3">
          {FAQ.map((f, i) => (
            <div key={f.q} className="rounded-2xl border border-line bg-surface-solid/70">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between px-5 py-4 text-left font-semibold cursor-pointer">
                {f.q}
                <ChevronDown className={cn("size-5 transition", openFaq === i && "rotate-180")} />
              </button>
              {openFaq === i && <p className="px-5 pb-4 text-sm text-muted">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function PricingView({ initialTiers }: { initialTiers: ProTier[] | null }) {
  // useSearchParams (limite atteinte, retour Stripe) → frontière Suspense
  return (
    <Suspense>
      <Pricing initialTiers={initialTiers} />
    </Suspense>
  );
}
