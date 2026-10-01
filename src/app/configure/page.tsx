"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Bot, CalendarDays, Lightbulb, Loader2, MapPin, Sparkles, Wand2 } from "lucide-react";
import { ApiError, tripsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { notifyXpChanged } from "@/lib/hooks";
import { BUDGETS, PACES, TRANSPORTS, INTEREST_VISUALS } from "@/lib/constants";
import { clothingTip, fetchForecast, isRainy, searchPlaces, weatherEmoji, weatherLabel, type Forecast, type Place } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { Flag } from "@/components/Flag";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button, Card, Chip, ErrorBox, inputCls } from "@/components/ui";
import { FlyingParrot } from "@/components/FlyingParrot";

const INTEREST_LABELS: Record<string, string> = {
  culture: "🏛️ Culture",
  gastronomie: "🍜 Gastronomie",
  nature: "🏔️ Nature",
  plage: "🏖️ Plage",
  nightlife: "🎉 Vie nocturne",
  shopping: "🛍️ Shopping",
  sport: "🧗 Aventure",
  bien_etre: "🧘 Bien-être",
  art: "🎨 Art",
  famille: "👨‍👩‍👧‍👦 Famille",
};

const LOADING_STEPS = [
  "Analyse de tes envies…",
  "Repérage des pépites cachées…",
  "Calcul des meilleurs trajets…",
  "Consultation de la météo…",
  "Rédaction des astuces d'initiés…",
  "Dernières retouches magiques…",
];

const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 864e5) + 1;

function GeneratingOverlay({ destination }: { destination: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % LOADING_STEPS.length), 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-bg/90 backdrop-blur-md px-6">
      <div className="w-full max-w-md text-center animate-pop-in">
        <FlyingParrot />
        <h2 className="mt-8 text-2xl font-bold">L&apos;IA prépare ton voyage à {destination}</h2>
        <p key={i} className="mt-3 text-primary animate-pop-in">{LOADING_STEPS[i]}</p>
        <p className="mt-6 text-xs text-muted">Un long itinéraire peut prendre une à deux minutes.</p>
      </div>
    </div>
  );
}

function Configure() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const interests = useMemo(() => (params.get("interests") || "").split(",").filter(Boolean), [params]);

  const [query, setQuery] = useState("");
  const [place, setPlace] = useState<Place | null>(null);
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [duration, setDuration] = useState(3);
  const [pace, setPace] = useState(1);
  const [transports, setTransports] = useState<string[]>(["marche"]);
  const [budget, setBudget] = useState<(typeof BUDGETS)[number]["id"]>("moyen");
  const [forecastFor, setForecastFor] = useState<{ id: number; f: Forecast } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Autocomplétion destination (debounce 250 ms)
  useEffect(() => {
    if (place && query === place.name) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      searchPlaces(query, ctrl.signal)
        .then(setSuggestions)
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, place]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setShowSug(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Prévisions météo de la destination pour le coach IA
  useEffect(() => {
    if (!place) return;
    const ctrl = new AbortController();
    fetchForecast(place.latitude, place.longitude, ctrl.signal)
      .then((f) => f && setForecastFor({ id: place.id, f }))
      .catch(() => {});
    return () => ctrl.abort();
  }, [place]);
  const forecast = place && forecastFor?.id === place.id ? forecastFor.f : null;

  // Durée calculée depuis les dates si elles sont renseignées
  const effectiveDuration = startDate && endDate && endDate >= startDate ? Math.min(30, daysBetween(startDate, endDate)) : duration;
  const destinationText = place ? `${place.name}, ${place.country}` : query.trim();
  const rainyDay = forecast?.days.findIndex((d) => isRainy(d.code)) ?? -1;

  const toggleTransport = (id: string) => setTransports((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));

  const generate = async () => {
    setError(null);
    if (!destinationText) return setError("Choisis une destination.");
    if (transports.length === 0) return setError("Sélectionne au moins un moyen de transport.");
    if (interests.length === 0) return setError("Aucune envie sélectionnée — repasse par l'étape swipe.");
    setGenerating(true);
    try {
      const trip = await tripsApi.generate({
        destination: destinationText,
        duration_days: effectiveDuration,
        pace: PACES[pace].id,
        transports,
        budget,
        interests,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        city: place?.name,
        country: place?.country,
        country_code: place?.country_code,
        thermal_sensitivity: user?.thermal_sensitivity || undefined,
      });
      notifyXpChanged();
      router.push(`/trips/${trip.id}?new=1`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        router.push("/pricing?limit=1");
        return;
      }
      setError((e as Error).message);
      setGenerating(false);
    }
  };

  return (
    <>
      {generating && <GeneratingOverlay destination={place?.name || destinationText} />}
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <Link href="/swipe" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary">
            <ArrowLeft className="size-4" /> Modifier mes envies
          </Link>
          <div className="mt-5 mb-2 flex items-center justify-between text-sm">
            <span className="font-bold uppercase tracking-wider text-primary">Étape 2 sur 2</span>
            <span className="text-muted">Ensuite : génération IA ✨</span>
          </div>
          <div className="h-2 rounded-full bg-line">
            <div className="h-full w-3/4 rounded-full bg-primary" />
          </div>

          <h1 className="mt-8 text-4xl sm:text-5xl font-bold tracking-tight">Planifie ta prochaine aventure</h1>
          <p className="mt-3 text-lg text-muted">Destination, dates et style de voyage : l&apos;IA s&apos;occupe du reste.</p>

          <Card className="mt-8 p-6 sm:p-8">
            <div className="grid gap-8 md:grid-cols-2">
              {/* Destination */}
              <div ref={boxRef} className="relative">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">Où vas-tu ?</p>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-primary" />
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPlace(null);
                      setShowSug(true);
                    }}
                    onFocus={() => setShowSug(true)}
                    placeholder="Tokyo, Lisbonne, Marrakech…"
                    className={`${inputCls} h-14 pl-12 text-lg`}
                  />
                </div>
                {showSug && suggestions.length > 0 && (
                  <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-line bg-surface-solid shadow-2xl">
                    {suggestions.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setPlace(s);
                            setQuery(s.name);
                            setShowSug(false);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2 cursor-pointer"
                        >
                          <Flag code={s.country_code} className="h-4" />
                          <span>
                            <span className="font-semibold">{s.name}</span>
                            <span className="block text-xs text-muted">{[s.admin1, s.country].filter(Boolean).join(", ")}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <p className="mb-2 mt-8 text-xs font-bold uppercase tracking-widest text-muted">Rythme</p>
                <input type="range" min={0} max={2} step={1} value={pace} onChange={(e) => setPace(Number(e.target.value))} className="w-full accent-[#0df2cc] cursor-pointer" />
                <div className="mt-2 flex justify-between text-xs font-bold uppercase tracking-wider">
                  {PACES.map((p, i) => (
                    <button key={p.id} onClick={() => setPace(i)} className={cn("cursor-pointer", pace === i ? "text-primary" : "text-muted")}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-sm italic text-muted">« {PACES[pace].quote} »</p>
              </div>

              {/* Dates */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">Dates du voyage (optionnel)</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs text-muted">
                    Départ
                    <input
                      type="date"
                      min={today()}
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (endDate && e.target.value > endDate) setEndDate("");
                      }}
                      className={`${inputCls} mt-1`}
                    />
                  </label>
                  <label className="text-xs text-muted">
                    Retour
                    <input type="date" min={startDate || today()} value={endDate} onChange={(e) => setEndDate(e.target.value)} className={`${inputCls} mt-1`} />
                  </label>
                </div>
                {!(startDate && endDate) && (
                  <div className="mt-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Durée</span>
                      <b className="text-primary">{duration} jour{duration > 1 ? "s" : ""}</b>
                    </div>
                    <input type="range" min={1} max={14} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="mt-2 w-full accent-[#0df2cc] cursor-pointer" />
                  </div>
                )}
                {startDate && endDate && (
                  <p className="mt-3 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted">
                      <CalendarDays className="size-4" /> Sélection : <b className="text-ink">{effectiveDuration} jours</b>
                    </span>
                    <button
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                      }}
                      className="font-semibold text-primary cursor-pointer"
                    >
                      Effacer
                    </button>
                  </p>
                )}

                <p className="mb-2 mt-8 text-xs font-bold uppercase tracking-widest text-muted">Transports</p>
                <div className="flex flex-wrap gap-2">
                  {TRANSPORTS.map((t) => (
                    <Chip key={t.id} active={transports.includes(t.id)} onClick={() => toggleTransport(t.id)}>
                      {t.emoji} {t.label}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>

            <p className="mb-3 mt-8 text-xs font-bold uppercase tracking-widest text-muted">Budget</p>
            <div className="grid grid-cols-3 gap-3">
              {BUDGETS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBudget(b.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl border p-4 transition cursor-pointer",
                    budget === b.id ? "border-primary bg-primary/10" : "border-line bg-bg-deep/40 hover:border-primary/50",
                  )}
                >
                  <span className="text-2xl">{b.emoji}</span>
                  <span className={cn("text-sm font-bold", budget === b.id && "text-primary")}>{b.label}</span>
                </button>
              ))}
            </div>

            {error && <div className="mt-6"><ErrorBox message={error} /></div>}

            <div className="mt-10 flex flex-col items-center">
              <Button size="lg" onClick={generate} disabled={generating} className="h-16 rounded-full px-12 text-lg">
                {generating ? <Loader2 className="size-6 animate-spin" /> : <Wand2 className="size-6" />}
                Génération magique par l&apos;IA
              </Button>
              <p className="mt-3 text-xs text-muted">Gratuit : 3 itinéraires par mois · Illimité avec Voyago Pro</p>
            </div>
          </Card>
        </div>

        {/* Coach IA (maquette Stitch « Magic Trip ») */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center gap-3 border-b border-line pb-4">
            <span className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-sky text-[#062420]">
              <Bot className="size-6" />
            </span>
            <div>
              <p className="font-bold">Coach de voyage IA</p>
              <p className="flex items-center gap-1.5 text-xs text-primary">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" /> En ligne & en analyse
              </p>
            </div>
          </div>

          {forecast && place && (
            <Card className="bg-gradient-to-br from-sky/20 to-transparent p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted">Météo à {place.name}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-4xl font-bold">{forecast.current}°C</span>
                <span className="text-4xl">{weatherEmoji(forecast.code)}</span>
              </div>
              <p className="text-sm text-muted">{weatherLabel(forecast.code)}</p>
              <div className="mt-4 flex justify-between">
                {forecast.days.slice(0, 5).map((d) => (
                  <div key={d.date} className="flex flex-col items-center text-xs">
                    <span className="text-muted">{new Date(d.date).toLocaleDateString("fr-FR", { weekday: "short" })}</span>
                    <span className="text-lg">{weatherEmoji(d.code)}</span>
                    <span className="font-bold">{d.max}°</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="border-l-4 border-l-primary p-5">
            <p className="font-bold text-primary">Observation</p>
            <p className="mt-2 text-sm text-ink/90">
              {interests.length ? (
                <>
                  Tu as choisi{" "}
                  {interests.map((i, k) => (
                    <span key={i}>
                      <b>{INTEREST_LABELS[i] || i}</b>
                      {k < interests.length - 1 ? ", " : ""}
                    </span>
                  ))}
                  . Je vais prioriser les lieux les mieux notés dans ces univers.
                </>
              ) : (
                "Aucune envie sélectionnée pour l'instant."
              )}
            </p>
          </Card>

          {forecast && rainyDay >= 0 && (
            <Card className="border-l-4 border-l-orange p-5">
              <p className="flex items-center gap-1.5 font-bold text-orange">
                <AlertTriangle className="size-4" /> Optimisation
              </p>
              <p className="mt-2 text-sm text-ink/90">
                <b>Alerte pluie</b> prévue{" "}
                {new Date(forecast.days[rainyDay].date).toLocaleDateString("fr-FR", { weekday: "long" })} : je privilégierai les activités en intérieur ce jour-là.
              </p>
            </Card>
          )}

          {forecast && (
            <Card className="border-l-4 border-l-sky p-5">
              <p className="font-bold text-sky">Conseil tenue</p>
              <p className="mt-2 text-sm text-ink/90">{clothingTip(forecast.current, user?.thermal_sensitivity, isRainy(forecast.code))}</p>
            </Card>
          )}

          <div className="flex gap-3 rounded-2xl bg-primary/10 p-4 text-sm text-primary">
            <Lightbulb className="size-5 shrink-0" />
            <span>Plus tu choisis d&apos;envies variées, plus l&apos;itinéraire sera riche. Chaque voyage généré te rapporte de l&apos;XP !</span>
          </div>
          {interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {interests.map((i) => (
                <span key={i} className={cn("rounded-full bg-gradient-to-r px-2.5 py-1 text-xs font-semibold", INTEREST_VISUALS[i]?.gradient || "from-primary to-bg")}>
                  {INTEREST_LABELS[i] || i}
                </span>
              ))}
            </div>
          )}
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Sparkles className="size-3.5" /> Propulsé par Claude & Gemini
          </p>
        </aside>
      </div>
    </>
  );
}

export default function ConfigurePage() {
  return (
    <AppShell>
      <RequireAuth>
        <Suspense>
          <Configure />
        </Suspense>
      </RequireAuth>
    </AppShell>
  );
}
