"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, Crown, Flame, Map, Plus, Sparkles, Trophy, Users, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { tripsApi } from "@/lib/api";
import { awardXp, useAsync, useGameProfile } from "@/lib/hooks";
import { levelTitle } from "@/lib/constants";
import { displayName } from "@/lib/utils";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Avatar } from "@/components/Avatar";
import { TripCard } from "@/components/TripCard";
import { XpBar } from "@/components/XpBar";
import { Card, EmptyState, ErrorBox, LinkButton, SectionTitle, Spinner } from "@/components/ui";

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: React.ReactNode; tone: string }) {
  return (
    <Card className="p-5">
      <p className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${tone}`}>
        {icon} {label}
      </p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </Card>
  );
}

function Dashboard() {
  const { user, isGuest } = useAuth();
  const { profile } = useGameProfile();
  const trips = useAsync(() => tripsApi.byUser(user!.user_id), [user?.user_id]);

  // XP de connexion quotidienne (le backend bloque les doublons le même jour)
  useEffect(() => {
    if (!user?.user_id) return;
    const key = `voyago_daily_${new Date().toISOString().slice(0, 10)}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage indisponible : le backend reste garant de l'anti-triche
    }
    awardXp(user.user_id, "daily_login");
  }, [user?.user_id]);

  const xp = profile?.xp ?? 0;
  const sortedTrips = [...(trips.data || [])].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

  return (
    <div className="flex flex-col gap-10">
      {/* Hero profil (inspiré Stitch « premium explorer profile ») */}
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
          <div className="relative w-fit">
            <Avatar picture={user?.picture} emoji={user?.avatar_emoji} size={96} ring="gold" />
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gold px-2.5 py-0.5 text-xs font-bold text-[#2a1f00]">
              NIV. {profile?.level ?? 1}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Salut {displayName(user)} !</h1>
              {user?.is_pro && (
                <span className="flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold">
                  <Crown className="size-3.5" /> Voyago Pro
                </span>
              )}
            </div>
            <p className="mt-1 text-muted">
              {levelTitle(xp)} · {user?.city ? `${user.city}, ` : ""}
              {user?.country || "Citoyen du monde"}
            </p>
            <div className="mt-5 max-w-lg">
              <div className="mb-1.5 flex justify-between text-sm">
                <span>Prochain niveau</span>
                <span className="font-bold text-gold">{xp % 100} / 100 XP</span>
              </div>
              <XpBar value={xp % 100} max={100} />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
            <LinkButton href="/swipe" size="lg">
              <Sparkles className="size-5" /> Nouveau voyage
            </LinkButton>
            <LinkButton href="/rewards" variant="ghost" size="lg">
              <Trophy className="size-5" /> Mes récompenses
            </LinkButton>
          </div>
        </div>
      </Card>

      {isGuest && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-primary/40 bg-primary/10 px-5 py-4">
          <p className="text-sm">
            <b>Tu es en mode invité.</b> Crée un compte pour sauvegarder tes voyages et ton XP pour de bon.
          </p>
          <LinkButton href="/signup" size="sm">
            Créer mon compte
          </LinkButton>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={<Zap className="size-4 fill-current" />} label="XP total" value={xp.toLocaleString("fr-FR")} tone="text-gold" />
        <Stat icon={<Flame className="size-4 fill-current" />} label="Série" value={`${profile?.streak ?? 0} j`} tone="text-orange" />
        <Stat icon={<Map className="size-4" />} label="Voyages" value={profile?.trips_count ?? trips.data?.length ?? 0} tone="text-primary" />
        <Stat icon={<Trophy className="size-4" />} label="Badges" value={profile?.badges.length ?? 0} tone="text-sky" />
      </div>

      <section>
        <SectionTitle
          icon={<Map className="size-5 text-primary" />}
          action={
            <Link href="/swipe" className="flex items-center gap-1 text-sm font-bold text-primary hover:underline">
              <Plus className="size-4" /> Créer
            </Link>
          }
        >
          Mes voyages
        </SectionTitle>
        {trips.loading ? (
          <Spinner label="Chargement de tes voyages…" />
        ) : trips.error ? (
          <ErrorBox message={trips.error} onRetry={trips.reload} />
        ) : sortedTrips.length === 0 ? (
          <EmptyState
            emoji="🗺️"
            title="Aucun voyage pour l'instant"
            text="Swipe tes envies, choisis une destination et laisse l'IA te concocter un itinéraire sur-mesure. +3 XP à la clé !"
            action={
              <LinkButton href="/swipe" size="lg">
                Créer mon premier voyage <ArrowRight className="size-5" />
              </LinkButton>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sortedTrips.map((t) => (
              <TripCard key={t.id} trip={t} />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <Link href="/community" className="group rounded-2xl border border-line bg-gradient-to-br from-sky/15 to-transparent p-6 transition hover:border-sky/50">
          <Users className="size-7 text-sky" />
          <h3 className="mt-4 text-xl font-bold">Rejoins une tribu</h3>
          <p className="mt-1 text-sm text-muted">Des cercles de voyageurs pour partager bons plans, itinéraires et moments.</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-sky">
            Explorer la communauté <ArrowRight className="size-4 transition group-hover:translate-x-1" />
          </span>
        </Link>
        {!user?.is_pro && (
          <Link href="/pricing" className="group rounded-2xl bg-gradient-to-br from-gold to-gold-dark p-6 text-[#2a1f00] transition hover:brightness-105">
            <Crown className="size-7" />
            <h3 className="mt-4 text-xl font-bold">Découverte illimitée</h3>
            <p className="mt-1 text-sm opacity-80">Voyages illimités, météo étendue 16 jours et badge Pro 💎. Dès 4,99 €/mois.</p>
            <span className="mt-4 inline-flex items-center gap-1 rounded-xl bg-[#111] px-4 py-2 text-sm font-bold text-white">
              Passer Pro <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppShell>
      <RequireAuth>
        <Dashboard />
      </RequireAuth>
    </AppShell>
  );
}
