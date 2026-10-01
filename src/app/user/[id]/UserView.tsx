"use client";

import { Flame, Map, Trophy, Zap } from "lucide-react";
import { communityApi } from "@/lib/api";
import type { PublicUserProfile } from "@/lib/types";
import { useAsync } from "@/lib/hooks";
import { BADGE_FALLBACK, levelTitle } from "@/lib/constants";
import { displayName, formatDate } from "@/lib/utils";
import { Avatar } from "@/components/Avatar";
import { TripCard } from "@/components/TripCard";
import { Card, EmptyState, ErrorBox, SectionTitle, Spinner } from "@/components/ui";

export function UserView({ id, initial }: { id: string; initial: PublicUserProfile | null }) {
  const { data, loading, error, reload } = useAsync(() => communityApi.user(id), [id], initial);

  return (
    <>
      {loading ? (
        <Spinner />
      ) : error || !data ? (
        <ErrorBox message={error || "Voyageur introuvable"} onRetry={reload} />
      ) : (
        <div className="flex flex-col gap-8">
          <Card className="flex flex-col items-center gap-6 p-8 sm:flex-row">
            <Avatar picture={data.user.picture} emoji={data.user.avatar_emoji} size={110} ring={data.user.is_pro ? "gold" : "primary"} />
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold">
                {displayName(data.user)} {data.user.is_pro && "💎"}
              </h1>
              <p className="mt-1 text-muted">
                {levelTitle(data.profile?.xp ?? 0)} · Membre depuis {formatDate(data.user.created_at, { month: "long", year: "numeric" })}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm sm:justify-start">
                <span className="flex items-center gap-1.5 font-bold text-gold">
                  <Zap className="size-4 fill-gold" /> {data.profile?.xp ?? 0} XP
                </span>
                <span className="flex items-center gap-1.5 font-bold text-primary">
                  <Trophy className="size-4" /> Niveau {data.profile?.level ?? 1}
                </span>
                <span className="flex items-center gap-1.5 font-bold text-orange">
                  <Flame className="size-4" /> {data.profile?.streak ?? 0} j
                </span>
                <span className="flex items-center gap-1.5 font-bold text-sky">
                  <Map className="size-4" /> {data.profile?.trips_count ?? data.trips.length} voyages
                </span>
              </div>
            </div>
          </Card>

          {data.profile?.badges && data.profile.badges.length > 0 && (
            <section>
              <SectionTitle>Badges</SectionTitle>
              <div className="flex flex-wrap gap-3">
                {data.profile.badges.map((b) => (
                  <span key={b} className="flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-semibold">
                    {BADGE_FALLBACK[b]?.emoji || "🏅"} {BADGE_FALLBACK[b]?.title || b}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionTitle>Voyages publics</SectionTitle>
            {data.trips.length === 0 ? (
              <EmptyState emoji="🗺️" title="Aucun voyage public" />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.trips.map((t) => (
                  <TripCard key={t.id} trip={t} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
