/* eslint-disable @next/next/no-img-element */
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bot, ChevronLeft, ChevronRight, Clock, Footprints, MapPin, Navigation, PartyPopper, Share2, Sparkles, Star, X } from "lucide-react";
import { communityApi, tripsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { awardXp, useAsync } from "@/lib/hooks";
import { BUDGETS, PACES, TRANSPORTS } from "@/lib/constants";
import { clothingTip, isRainy } from "@/lib/geo";
import type { CommunityCircle, DayWeather, POI, Trip } from "@/lib/types";
import { categoryEmoji, cn, displayName, distanceKm, formatDate, formatDuration, poisForDay, scheduleDay, tripTitle } from "@/lib/utils";
import { Avatar } from "@/components/Avatar";
import { Flag } from "@/components/Flag";
import { Button, ErrorBox, Spinner } from "@/components/ui";

const TripMap = dynamic(() => import("@/components/TripMap"), {
  ssr: false,
  loading: () => <div className="flex size-full items-center justify-center bg-bg-deep text-muted">Chargement de la carte…</div>,
});

function WeatherCard({ w, thermal }: { w?: DayWeather; thermal?: string | null }) {
  if (!w) return null;
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky to-primary p-5 text-[#062420] shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-4xl font-bold">
            <span>{w.icon}</span> {Math.round(w.temp_max)}°C
          </p>
          <p className="text-sm font-semibold opacity-80">
            {w.summary} · min {Math.round(w.temp_min)}°
          </p>
        </div>
        <div className="max-w-[55%] text-right">
          <p className="flex items-center justify-end gap-1 text-xs font-bold uppercase tracking-wider opacity-80">
            <Bot className="size-3.5" /> Astuce IA
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug">« {clothingTip(w.temp_max, thermal, isRainy(w.weather_code))} »</p>
        </div>
      </div>
    </div>
  );
}

function PoiItem({ poi, time, active, onClick, index }: { poi: POI; time: string; active: boolean; onClick: () => void; index: number }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <div id={`poi-card-${index}`} className="relative scroll-mt-40 pl-10">
      <span
        className={cn(
          "absolute left-0 top-1 flex size-7 items-center justify-center rounded-full border-2 text-xs font-bold",
          active ? "border-gold bg-gold text-[#2a1f00]" : "border-primary bg-bg text-primary",
        )}
      >
        {index + 1}
      </span>
      <div className="mb-2 flex items-center gap-3">
        <span className="rounded-lg border border-line bg-surface-2 px-2.5 py-1 text-sm font-bold">{time}</span>
        <span className="text-sm text-muted">
          {categoryEmoji(poi.category)} {poi.category}
        </span>
      </div>
      <button
        onClick={onClick}
        className={cn(
          "w-full rounded-2xl border p-3 text-left transition cursor-pointer",
          active ? "border-gold/60 bg-gold/5" : "border-line bg-surface-solid/70 hover:border-primary/50",
        )}
      >
        <div className="flex gap-4">
          <div className="size-24 shrink-0 overflow-hidden rounded-xl bg-surface-2">
            {poi.image_url && imgOk ? (
              <img src={poi.image_url} alt="" className="size-full object-cover" onError={() => setImgOk(false)} />
            ) : (
              <div className="flex size-full items-center justify-center text-4xl">{categoryEmoji(poi.category)}</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold leading-tight">{poi.name}</h4>
            <p className="mt-1 flex items-center gap-3 text-sm text-muted">
              <span className="flex items-center gap-1">
                <Star className="size-3.5 fill-gold text-gold" /> {(poi.rating ?? 4.7).toFixed(1)}
                {poi.reviews_count ? ` (${poi.reviews_count > 999 ? `${(poi.reviews_count / 1000).toFixed(1)}k` : poi.reviews_count})` : ""}
              </span>
              {poi.duration_minutes ? (
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" /> {formatDuration(poi.duration_minutes)}
                </span>
              ) : null}
            </p>
            <p className="mt-1.5 line-clamp-3 text-sm text-ink/80">{poi.description}</p>
          </div>
        </div>
        {poi.insider_tip && (
          <p className="mt-3 flex gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
            <Sparkles className="mt-0.5 size-4 shrink-0" /> {poi.insider_tip}
          </p>
        )}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-sky hover:underline"
        >
          <Navigation className="size-3.5" /> Itinéraire Google Maps
        </a>
      </button>
    </div>
  );
}

function DayPicker({
  days,
  day,
  startDate,
  weather,
  counts,
  onSelect,
}: {
  days: number[];
  day: number;
  startDate?: string | null;
  weather?: DayWeather[];
  counts: number[];
  onSelect: (d: number) => void;
}) {
  // Jusqu'à 10 jours : grille sur plusieurs lignes, tout est visible d'un coup d'œil.
  // Au-delà : bande horizontale défilante (barre masquée, flèches du jour pour naviguer).
  const wrap = days.length <= 10;
  return (
    <div className="sticky top-16 z-10 shrink-0 border-b border-line bg-bg/95 px-6 py-4 backdrop-blur lg:top-0">
      <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-muted">Choisis ton jour</p>
      <div className={cn("relative gap-2", wrap ? "grid grid-cols-4 sm:grid-cols-5" : "no-scrollbar flex overflow-x-auto pb-1")}>
        {days.map((d) => {
          const w = weather?.[d - 1];
          const date = startDate ? new Date(new Date(startDate).getTime() + (d - 1) * 864e5) : null;
          const active = day === d;
          return (
            <button
              key={d}
              id={`day-tab-${d}`}
              onClick={() => onSelect(d)}
              aria-pressed={active}
              className={cn(
                "flex shrink-0 flex-col items-center rounded-xl border px-2 py-2 transition cursor-pointer",
                !wrap && "min-w-[76px]",
                active ? "border-primary bg-primary text-[#062420] glow-primary" : "border-line bg-surface-2 text-ink hover:border-primary/60",
              )}
            >
              <span className="text-sm font-bold leading-tight">Jour {d}</span>
              <span className={cn("text-[11px] leading-tight", active ? "text-[#062420]/75" : "text-muted")}>
                {date ? date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }) : `${counts[d - 1] || 0} étapes`}
              </span>
              {w && (
                <span className="mt-0.5 text-xs">
                  {w.icon} <b>{Math.round(w.temp_max)}°</b>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ShareModal({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const { user } = useAuth();
  const [circles, setCircles] = useState<CommunityCircle[] | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    communityApi
      .circles({ my_user_id: user?.user_id })
      .then((all) => setCircles(all.filter((c) => c.is_member)))
      .catch((e) => setError(e.message));
  }, [user?.user_id]);

  const share = async (c: CommunityCircle) => {
    setSending(c.id);
    setError(null);
    try {
      await communityApi.shareTrip(c.id, trip.id, comment.trim() || undefined);
      awardXp(user?.user_id, "share_trip");
      setDone(c.name);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl border border-line bg-surface-solid p-6 animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Partager dans une tribu</h3>
          <button onClick={onClose} className="cursor-pointer text-muted hover:text-ink" aria-label="Fermer">
            <X className="size-5" />
          </button>
        </div>
        {done ? (
          <div className="py-8 text-center">
            <span className="text-5xl">🎉</span>
            <p className="mt-3 font-bold">Partagé dans « {done} » !</p>
            <p className="text-sm text-gold">+1 XP</p>
            <Button className="mt-6" onClick={onClose}>
              Fermer
            </Button>
          </div>
        ) : (
          <>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Un petit mot pour la tribu ? (optionnel)"
              className="mt-4 h-20 w-full resize-none rounded-xl border border-line bg-bg-deep/60 p-3 text-sm outline-none focus:border-primary"
            />
            {error && <ErrorBox message={error} />}
            <div className="mt-4 flex max-h-72 flex-col gap-2 overflow-y-auto">
              {circles === null ? (
                <Spinner />
              ) : circles.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">
                  Tu n&apos;as rejoint aucune tribu.{" "}
                  <Link href="/community" className="font-bold text-primary">
                    Découvrir la communauté
                  </Link>
                </p>
              ) : (
                circles.map((c) => (
                  <button
                    key={c.id}
                    disabled={!!sending}
                    onClick={() => share(c)}
                    className="flex items-center gap-3 rounded-xl border border-line p-3 text-left hover:border-primary/60 cursor-pointer disabled:opacity-50"
                  >
                    <span className="text-2xl">{c.avatar_emoji || "🧭"}</span>
                    <span className="flex-1 font-semibold">{c.name}</span>
                    {sending === c.id ? <Spinner className="py-0" /> : <Share2 className="size-4 text-primary" />}
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function TripView({ id, initialTrip, isNew }: { id: string; initialTrip: Trip | null; isNew: boolean }) {
  const { user, isLoggedIn } = useAuth();
  const { data: trip, loading, error, reload } = useAsync(() => tripsApi.byId(id), [id], initialTrip);
  const [day, setDay] = useState(1);
  const [active, setActive] = useState<number | null>(null);
  const [sharing, setSharing] = useState(false);
  const [showCongrats, setShowCongrats] = useState(isNew);

  useEffect(() => {
    if (!showCongrats) return;
    const t = setTimeout(() => setShowCongrats(false), 4500);
    return () => clearTimeout(t);
  }, [showCongrats]);

  const selectDay = (d: number) => {
    if (!trip || d < 1 || d > (trip.duration_days || 1)) return;
    setDay(d);
    setActive(null);
    // Recentre l'onglet dans la bande horizontale (> 10 jours) sans faire défiler la page
    const tab = document.getElementById(`day-tab-${d}`);
    const strip = tab?.parentElement;
    if (tab && strip && strip.scrollWidth > strip.clientWidth) {
      strip.scrollTo({ left: tab.offsetLeft - strip.clientWidth / 2 + tab.offsetWidth / 2, behavior: "smooth" });
    }
  };

  const dayPois = useMemo(() => (trip ? poisForDay(trip, day) : []), [trip, day]);
  const schedule = useMemo(() => scheduleDay(dayPois), [dayPois]);


  if (loading) return <Spinner label="Chargement de l'itinéraire…" className="min-h-[70vh]" />;
  if (error || !trip)
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <ErrorBox message={error || "Voyage introuvable"} onRetry={reload} />
      </div>
    );

  const isOwner = user?.user_id === trip.user_id;
  const weather = trip.weather?.[day - 1];
  const days = Array.from({ length: trip.duration_days || 1 }, (_, i) => i + 1);
  const dayDate = trip.start_date ? new Date(new Date(trip.start_date).getTime() + (day - 1) * 864e5).toISOString() : null;
  const label = (list: readonly { id: string; label: string; emoji?: string }[], v: string) => list.find((x) => x.id === v);

  return (
    <div className="flex flex-col lg:h-[calc(100vh-4rem)] lg:flex-row">
      {showCongrats && (
        <div className="fixed inset-x-4 top-20 z-[1100] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-gold/50 bg-surface-solid p-4 shadow-2xl animate-pop-in">
          <PartyPopper className="size-8 text-gold" />
          <div className="flex-1">
            <p className="font-bold">Itinéraire généré !</p>
            <p className="text-sm text-gold">+XP ajoutés à ton profil</p>
          </div>
          <button onClick={() => setShowCongrats(false)} className="cursor-pointer text-muted" aria-label="Fermer">
            <X className="size-5" />
          </button>
        </div>
      )}
      {sharing && <ShareModal trip={trip} onClose={() => setSharing(false)} />}

      {/* Carte */}
      <div className="relative isolate h-[45vh] lg:h-full lg:flex-1">
        <TripMap
          pois={dayPois}
          times={schedule.map((x) => x.time)}
          activeIndex={active}
          onSelect={setActive}
          onShowInList={(i) => {
            setActive(i);
            document.getElementById(`poi-card-${i}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        />
        <Link
          href={isOwner ? "/dashboard" : "/community"}
          className="absolute left-4 top-4 z-[500] flex items-center gap-1.5 rounded-xl border border-line glass px-3 py-2 text-sm font-semibold hover:text-primary"
        >
          <ArrowLeft className="size-4" /> Retour
        </Link>
      </div>

      {/* Panneau itinéraire */}
      <aside className="flex w-full flex-col border-l border-line bg-bg lg:w-[480px] lg:overflow-y-auto">
        <div className="shrink-0 border-b border-line p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                <Flag code={trip.country_code} /> {tripTitle(trip)}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                <MapPin className="size-3.5" /> {trip.destination}
              </p>
            </div>
            {isOwner && isLoggedIn && (
              <Button variant="ghost" size="sm" onClick={() => setSharing(true)}>
                <Share2 className="size-4" /> Partager
              </Button>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-surface-2 px-3 py-1">🗓️ {trip.duration_days} jours</span>
            <span className="rounded-full bg-surface-2 px-3 py-1">⚡ {label(PACES, trip.pace)?.label || trip.pace}</span>
            <span className="rounded-full bg-surface-2 px-3 py-1">
              {label(BUDGETS, trip.budget)?.emoji} {label(BUDGETS, trip.budget)?.label || trip.budget}
            </span>
            {trip.transports?.map((t) => (
              <span key={t} className="rounded-full bg-surface-2 px-3 py-1">
                {label(TRANSPORTS, t)?.emoji} {label(TRANSPORTS, t)?.label || t}
              </span>
            ))}
          </div>
          {!isOwner && trip.author && (
            <Link href={`/user/${trip.author.user_id}`} className="mt-4 flex items-center gap-2 text-sm hover:text-primary">
              <Avatar picture={trip.author.picture} emoji={trip.author.avatar_emoji} size={28} />
              par <b>{displayName(trip.author)}</b>
            </Link>
          )}
        </div>

        {/* Sélecteur de jours */}
        <DayPicker
          days={days}
          day={day}
          startDate={trip.start_date}
          weather={trip.weather}
          counts={days.map((d) => poisForDay(trip, d).length)}
          onSelect={selectDay}
        />

        <div className="flex shrink-0 flex-col gap-5 p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">
                Jour {day} <span className="text-base font-semibold text-muted">/ {days.length}</span>
              </h2>
              <p className="text-sm text-muted">
                {dayPois.length} étape{dayPois.length > 1 ? "s" : ""}
                {dayDate ? ` · ${formatDate(dayDate, { weekday: "long", day: "numeric", month: "short" })}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => selectDay(day - 1)}
                disabled={day <= 1}
                aria-label="Jour précédent"
                className="flex size-10 items-center justify-center rounded-xl border border-line bg-surface-2 transition hover:border-primary hover:text-primary disabled:opacity-30 disabled:hover:border-line disabled:hover:text-ink cursor-pointer disabled:cursor-default"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                onClick={() => selectDay(day + 1)}
                disabled={day >= days.length}
                aria-label="Jour suivant"
                className="flex size-10 items-center justify-center rounded-xl border border-line bg-surface-2 transition hover:border-primary hover:text-primary disabled:opacity-30 disabled:hover:border-line disabled:hover:text-ink cursor-pointer disabled:cursor-default"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>

          <WeatherCard w={weather} thermal={user?.thermal_sensitivity} />

          {dayPois.length === 0 ? (
            <p className="py-10 text-center text-muted">Journée libre — profite pour flâner ! 🌿</p>
          ) : (
            <div className="relative flex flex-col gap-2">
              <span className="absolute bottom-6 left-[13px] top-4 w-0.5 bg-line" />
              {schedule.map(({ poi, time }, i) => {
                const next = dayPois[i + 1];
                const km = next ? distanceKm(poi, next) : 0;
                return (
                  <div key={`${poi.name}-${i}`}>
                    <PoiItem poi={poi} time={time} index={i} active={active === i} onClick={() => setActive(i)} />
                    {next && (
                      <p className="flex items-center gap-2 py-3 pl-10 text-xs font-semibold uppercase tracking-wider text-muted">
                        <Footprints className="size-3.5" />
                        {km < 1.5 ? `${Math.max(1, Math.round((km / 4.5) * 60))} min à pied` : `${km.toFixed(1)} km`}
                        <span className="h-px flex-1 border-t border-dashed border-line" />
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
