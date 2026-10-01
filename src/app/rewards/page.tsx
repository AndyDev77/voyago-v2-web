"use client";

import { CheckCircle2, Circle, Lock, Medal, Trophy, Zap } from "lucide-react";
import { gamificationApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAsync, useGameProfile } from "@/lib/hooks";
import { BADGE_FALLBACK } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { XpBar } from "@/components/XpBar";
import { Card, ErrorBox, SectionTitle, Spinner } from "@/components/ui";

function Rewards() {
  const { user } = useAuth();
  const { profile } = useGameProfile();
  const rewards = useAsync(() => gamificationApi.rewards(user!.user_id), [user?.user_id, profile?.xp]);
  const badges = useAsync(() => gamificationApi.badges(), []);

  if (rewards.loading && !rewards.data) return <Spinner label="Chargement de tes récompenses…" />;
  if (rewards.error || !rewards.data) return <ErrorBox message={rewards.error || "Erreur"} onRetry={rewards.reload} />;
  const r = rewards.data;
  const owned = new Set(profile?.badges || []);
  // Badges catalogue + badges d'actions uniques gagnés hors catalogue
  const catalog = [...(badges.data || [])];
  owned.forEach((b) => {
    if (!catalog.find((c) => c.id === b) && BADGE_FALLBACK[b]) catalog.push({ id: b, title: BADGE_FALLBACK[b].title, emoji: BADGE_FALLBACK[b].emoji, description: "Action accomplie", xp_reward: 0 });
  });

  return (
    <div className="flex flex-col gap-10">
      {/* Bandeau niveau */}
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute -right-20 -top-20 size-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex size-28 shrink-0 flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-gold to-gold-dark text-[#2a1f00] glow-gold">
            <span className="text-xs font-bold uppercase tracking-widest">Niveau</span>
            <span className="text-5xl font-bold leading-none">{r.level}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold uppercase tracking-widest text-gold">{r.current_level_title}</p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight">{r.total_xp.toLocaleString("fr-FR")} XP</h1>
            <div className="mt-4 max-w-xl">
              <div className="mb-1.5 flex justify-between text-sm">
                <span>Prochain palier : {r.next_level_title}</span>
                <span className="font-bold text-gold">
                  {r.current_level_xp} / {r.next_level_xp} XP
                </span>
              </div>
              <XpBar value={r.current_level_xp} max={r.next_level_xp} height={12} />
              <p className="mt-2 text-xs text-muted">Encore {r.xp_to_next_level} XP pour atteindre « {r.next_level_title} »</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Hall of Fame */}
        <section>
          <SectionTitle icon={<Medal className="size-5 text-gold" />}>Hall of Fame</SectionTitle>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {catalog.map((b) => {
              const has = owned.has(b.id) || (b.id === "voyago_pro" && user?.is_pro);
              return (
                <div
                  key={b.id}
                  className={cn("flex flex-col items-center rounded-2xl border p-5 text-center transition", has ? "border-gold/40 bg-surface-solid/80" : "border-line bg-bg-deep/40")}
                >
                  <span
                    className={cn(
                      "flex size-20 items-center justify-center rounded-2xl text-4xl",
                      has ? "bg-gradient-to-br from-gold to-gold-dark glow-gold" : "bg-surface-2 grayscale opacity-40",
                    )}
                  >
                    {has ? b.emoji : <Lock className="size-7 text-muted" />}
                  </span>
                  <p className={cn("mt-4 font-bold", !has && "text-muted")}>{b.title}</p>
                  <p className="mt-1 text-xs text-muted">{b.description}</p>
                  <p className={cn("mt-2 text-[10px] font-bold uppercase tracking-widest", has ? "text-gold" : "text-muted/60")}>{has ? "Débloqué" : "Verrouillé"}</p>
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex flex-col gap-8">
          {/* Actions XP */}
          <section>
            <SectionTitle icon={<Zap className="size-5 text-gold" />}>Gagner de l&apos;XP</SectionTitle>
            <Card className="divide-y divide-line">
              {r.actions.map((a) => (
                <div key={a.action} className="flex items-center gap-3 p-4">
                  <span className="text-2xl">{a.emoji}</span>
                  <div className="flex-1">
                    <p className={cn("text-sm font-semibold", a.completed && "text-muted line-through decoration-primary/60")}>{a.label}</p>
                    {a.progress_label && <p className="text-xs text-primary">{a.progress_label}</p>}
                  </div>
                  <span className="text-sm font-bold text-gold">+{a.xp}</span>
                  {a.completed ? <CheckCircle2 className="size-5 text-primary" /> : <Circle className="size-5 text-line" />}
                </div>
              ))}
            </Card>
          </section>

          {/* Paliers */}
          <section>
            <SectionTitle icon={<Trophy className="size-5 text-primary" />}>Paliers</SectionTitle>
            <ol className="relative flex flex-col gap-4 pl-8">
              <span className="absolute bottom-3 left-[11px] top-3 w-0.5 bg-line" />
              {r.levels.map((l) => (
                <li key={l.level} className="relative">
                  <span
                    className={cn(
                      "absolute -left-8 top-1 flex size-6 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                      l.status === "current" ? "border-gold bg-gold text-[#2a1f00]" : l.status === "reached" ? "border-primary bg-primary text-[#062420]" : "border-line bg-bg text-muted",
                    )}
                  >
                    {l.level}
                  </span>
                  <p className={cn("font-bold", l.status === "locked" && "text-muted")}>
                    {l.title} {l.status === "current" && <span className="ml-1 text-xs text-gold">← toi</span>}
                  </p>
                  <p className="text-xs text-muted">
                    {l.min_xp} XP · {l.reward}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function RewardsPage() {
  return (
    <AppShell>
      <RequireAuth>
        <Rewards />
      </RequireAuth>
    </AppShell>
  );
}
