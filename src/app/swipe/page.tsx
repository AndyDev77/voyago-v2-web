/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Heart, RotateCcw, Undo2, X, Zap } from "lucide-react";
import { interestsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { awardXp } from "@/lib/hooks";
import { INTEREST_VISUALS } from "@/lib/constants";
import type { Interest } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { RequireAuth } from "@/components/RequireAuth";
import { Button, Spinner } from "@/components/ui";
import { XpBar } from "@/components/XpBar";

// Repli si l'API n'est pas joignable (même catalogue que InterestsController)
const FALLBACK: Interest[] = [
  { id: "culture", title: "Culture & Histoire", emoji: "🏛️", description: "Musées, monuments, sites historiques" },
  { id: "gastronomie", title: "Gastronomie", emoji: "🍜", description: "Restaurants locaux, marchés, street food" },
  { id: "nature", title: "Nature & Randonnée", emoji: "🏔️", description: "Parcs naturels, randonnées, paysages" },
  { id: "plage", title: "Plage & Mer", emoji: "🏖️", description: "Plages, snorkeling, sports nautiques" },
  { id: "nightlife", title: "Vie Nocturne", emoji: "🎉", description: "Bars, clubs, concerts, festivals" },
  { id: "shopping", title: "Shopping", emoji: "🛍️", description: "Boutiques locales, souvenirs, marchés" },
  { id: "sport", title: "Sport & Aventure", emoji: "🧗", description: "Sports extrêmes, aventure, activités outdoor" },
  { id: "bien_etre", title: "Bien-être & Spa", emoji: "🧘", description: "Spas, yoga, relaxation" },
  { id: "art", title: "Art & Design", emoji: "🎨", description: "Galeries, street art, architecture moderne" },
  { id: "famille", title: "Famille", emoji: "👨‍👩‍👧‍👦", description: "Activités pour enfants, parcs d'attraction" },
];

const THRESHOLD = 110;

function SwipeCard({ interest, onDecide, top }: { interest: Interest; onDecide: (like: boolean) => void; top: boolean }) {
  const v = INTEREST_VISUALS[interest.id] || { gradient: "from-primary to-bg", tags: [] };
  const [dx, setDx] = useState(0);
  const [leaving, setLeaving] = useState<null | "left" | "right">(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [imgOk, setImgOk] = useState(true);

  const decide = useCallback(
    (like: boolean) => {
      setLeaving(like ? "right" : "left");
      setTimeout(() => onDecide(like), 220);
    },
    [onDecide],
  );

  // Exposé au parent via un événement custom pour les boutons/clavier
  useEffect(() => {
    if (!top) return;
    const h = (e: Event) => decide((e as CustomEvent<boolean>).detail);
    window.addEventListener("voyago:swipe", h);
    return () => window.removeEventListener("voyago:swipe", h);
  }, [top, decide]);

  const x = leaving === "right" ? 700 : leaving === "left" ? -700 : dx;
  const likeOpacity = Math.max(0, Math.min(1, x / THRESHOLD));
  const nopeOpacity = Math.max(0, Math.min(1, -x / THRESHOLD));

  return (
    <div
      className={cn(
        "absolute inset-0 select-none overflow-hidden rounded-[2rem] border border-line bg-surface-solid shadow-2xl touch-none",
        top ? "cursor-grab active:cursor-grabbing" : "pointer-events-none scale-95 translate-y-4 opacity-60",
        dragStart === null && "transition-transform duration-200",
      )}
      style={top ? { transform: `translateX(${x}px) rotate(${x / 18}deg)` } : undefined}
      onPointerDown={(e) => {
        if (!top || leaving) return;
        setDragStart(e.clientX);
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (dragStart !== null) setDx(e.clientX - dragStart);
      }}
      onPointerUp={() => {
        if (dragStart === null) return;
        setDragStart(null);
        if (Math.abs(dx) > THRESHOLD) decide(dx > 0);
        else setDx(0);
      }}
    >
      <div className={cn("relative h-[58%] bg-gradient-to-br", v.gradient)}>
        {v.image && imgOk ? (
          <img src={v.image} alt="" draggable={false} className="size-full object-cover" onError={() => setImgOk(false)} />
        ) : (
          <div className="flex size-full items-center justify-center text-[120px]">{interest.emoji}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-solid via-transparent to-transparent" />
        <span className="absolute left-4 top-4 rounded-full glass px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
          {interest.emoji} {interest.title}
        </span>
        <span style={{ opacity: likeOpacity }} className="absolute right-5 top-14 rotate-12 rounded-xl border-4 border-primary px-3 py-1 text-3xl font-black text-primary">
          J&apos;ADORE
        </span>
        <span style={{ opacity: nopeOpacity }} className="absolute left-5 top-14 -rotate-12 rounded-xl border-4 border-coral px-3 py-1 text-3xl font-black text-coral">
          BOF
        </span>
      </div>
      <div className="flex h-[42%] flex-col items-center justify-center px-7 text-center">
        <h2 className="text-3xl font-bold tracking-tight">{interest.title}</h2>
        <p className="mt-3 text-muted">{interest.description}</p>
        <p className="mt-4 font-mono text-xs text-muted/80">{v.tags.join("  ")}</p>
      </div>
    </div>
  );
}

function Swipe() {
  const router = useRouter();
  const { user } = useAuth();
  const [interests, setInterests] = useState<Interest[] | null>(null);
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);
  const [history, setHistory] = useState<{ id: string; like: boolean }[]>([]);
  const [xpPop, setXpPop] = useState(0);

  useEffect(() => {
    interestsApi
      .list()
      .then((l) => setInterests(l.length ? l : FALLBACK))
      .catch(() => setInterests(FALLBACK));
  }, []);

  const total = interests?.length ?? 10;
  const done = interests !== null && index >= total;

  const onDecide = useCallback(
    (like: boolean) => {
      if (!interests) return;
      const it = interests[index];
      if (!it) return;
      if (like) {
        setLiked((l) => [...l, it.id]);
        setXpPop((n) => n + 1);
      }
      setHistory((h) => [...h, { id: it.id, like }]);
      setIndex((i) => i + 1);
    },
    [interests, index],
  );

  const trigger = (like: boolean) => window.dispatchEvent(new CustomEvent("voyago:swipe", { detail: like }));

  const undo = () => {
    const last = history.at(-1);
    if (!last) return;
    setHistory((h) => h.slice(0, -1));
    if (last.like) setLiked((l) => l.filter((x) => x !== last.id));
    setIndex((i) => i - 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done) return;
      if (e.key === "ArrowRight") trigger(true);
      if (e.key === "ArrowLeft") trigger(false);
      if (e.key === "Backspace") undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const goConfigure = async () => {
    if (liked.length === 0) return;
    awardXp(user?.user_id, "first_swipe");
    awardXp(user?.user_id, "select_interests");
    router.push(`/configure?interests=${encodeURIComponent(liked.join(","))}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_center,#123a33_0%,#0c1a18_60%)]">
      <header className="flex items-center justify-between gap-4 px-4 sm:px-8 py-5">
        <Logo href="/dashboard" />
        <span className="hidden sm:flex items-center gap-2 rounded-full border border-line glass px-4 py-2 text-sm">
          <Zap className="size-4 fill-gold text-gold" /> <b className="text-primary">+XP</b> en définissant tes envies
        </span>
        <div className="flex items-center gap-2">
          {liked.length > 0 && !done && (
            <Button variant="ghost" size="sm" onClick={goConfigure}>
              Passer <ArrowRight className="size-4" />
            </Button>
          )}
          <button onClick={() => router.push("/dashboard")} className="flex size-10 items-center justify-center rounded-full border border-line glass hover:border-coral/60 cursor-pointer" aria-label="Fermer">
            <X className="size-5" />
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-xl px-4">
        <div className="mb-2 flex justify-between text-sm font-bold">
          <span>Tes envies de voyage</span>
          <span className="font-mono text-primary">
            {Math.min(index, total)}/{total}
          </span>
        </div>
        <XpBar value={index} max={total} color="primary" height={8} />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        {!interests ? (
          <Spinner label="Chargement des envies…" />
        ) : done ? (
          <div className="w-full max-w-md text-center animate-pop-in">
            <span className="text-7xl">{liked.length ? "🎯" : "🤔"}</span>
            <h1 className="mt-4 text-3xl font-bold">{liked.length ? `${liked.length} envie${liked.length > 1 ? "s" : ""} sélectionnée${liked.length > 1 ? "s" : ""} !` : "Aucune envie ?"}</h1>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {interests
                .filter((i) => liked.includes(i.id))
                .map((i) => (
                  <span key={i.id} className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                    {i.emoji} {i.title}
                  </span>
                ))}
            </div>
            <div className="mt-10 flex flex-col gap-3">
              {liked.length > 0 && (
                <Button size="lg" onClick={goConfigure}>
                  Configurer mon voyage <ArrowRight className="size-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  setIndex(0);
                  setLiked([]);
                  setHistory([]);
                }}
              >
                <RotateCcw className="size-4" /> Recommencer
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative h-[520px] w-full max-w-[400px]">
              {interests
                .slice(index, index + 2)
                .reverse()
                .map((it) => (
                  <SwipeCard key={it.id} interest={it} top={it.id === interests[index].id} onDecide={onDecide} />
                ))}
              {xpPop > 0 && (
                <span key={xpPop} className="pointer-events-none absolute -right-2 top-6 z-10 rounded-full bg-gold px-3 py-1 text-sm font-bold text-[#2a1f00] animate-float-up">
                  ❤️ Ajouté
                </span>
              )}
            </div>

            <div className="mt-8 flex items-end gap-6 rounded-[2rem] border border-line glass px-8 py-4">
              <button onClick={() => trigger(false)} className="flex flex-col items-center gap-1.5 cursor-pointer group">
                <span className="flex size-16 items-center justify-center rounded-full border border-coral/40 bg-coral/10 text-coral transition group-hover:scale-110">
                  <X className="size-8" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-muted">Passer</span>
              </button>
              <button onClick={undo} disabled={!history.length} className="flex flex-col items-center gap-1.5 cursor-pointer group disabled:opacity-30">
                <span className="flex size-11 items-center justify-center rounded-full border border-sky/40 bg-sky/10 text-sky transition group-hover:scale-110">
                  <Undo2 className="size-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-muted">Annuler</span>
              </button>
              <button onClick={() => trigger(true)} className="flex flex-col items-center gap-1.5 cursor-pointer group">
                <span className="flex size-16 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary transition group-hover:scale-110">
                  <Heart className="size-8 fill-primary" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-muted">J&apos;adore</span>
              </button>
            </div>
            <p className="mt-4 hidden sm:flex items-center gap-4 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded-md border border-line px-1.5 py-0.5"><ArrowLeft className="size-3" /></kbd> passer
              </span>
              <span className="flex items-center gap-1.5">
                j&apos;adore <kbd className="rounded-md border border-line px-1.5 py-0.5"><ArrowRight className="size-3" /></kbd>
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function SwipePage() {
  return (
    <RequireAuth>
      <Swipe />
    </RequireAuth>
  );
}
