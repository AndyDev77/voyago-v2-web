/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { ArrowRight, BrainCircuit, CloudSun, Gamepad2, Heart, Map, Sparkles, Users, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { IMAGES } from "@/lib/constants";
import { Logo } from "@/components/Logo";
import { btn } from "@/components/ui";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "Itinéraires générés par l'IA",
    text: "Un plan jour par jour en quelques secondes, calé sur ton rythme, ton budget et tes envies — avec GPS et photos.",
  },
  {
    icon: CloudSun,
    title: "Adapté à la météo",
    text: "Prévisions intégrées à chaque journée et conseils vestimentaires selon ta sensibilité thermique.",
  },
  {
    icon: Gamepad2,
    title: "Exploration gamifiée",
    text: "Gagne de l'XP, garde ta série active, monte de niveau et débloque des badges à chaque aventure.",
  },
];

const STEPS = [
  { icon: Heart, title: "Swipe tes envies", text: "Culture, gastronomie, plage… like ou passe, comme sur une appli de rencontre." },
  { icon: Map, title: "Choisis ta destination", text: "Ville, dates, rythme, transports et budget : 30 secondes chrono." },
  { icon: Sparkles, title: "L'IA génère tout", text: "Carte interactive, timeline par jour, astuces d'initiés et météo." },
  { icon: Users, title: "Partage avec ta tribu", text: "Rejoins des cercles de voyageurs et publie tes itinéraires." },
];

export default function LandingPage() {
  const { isLoggedIn } = useAuth();
  const startHref = isLoggedIn ? "/swipe" : "/signup";

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-line glass">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="hover:text-primary transition">Fonctionnalités</a>
            <a href="#how" className="hover:text-primary transition">Comment ça marche</a>
            <Link href="/pricing" className="hover:text-primary transition">Tarifs</Link>
            <Link href="/community" className="hover:text-primary transition">Communauté</Link>
          </nav>
          {isLoggedIn ? (
            <Link href="/dashboard" className={cn(btn.base, btn.primary, btn.sm)}>
              Mon espace <ArrowRight className="size-4" />
            </Link>
          ) : (
            <Link href="/login" className={cn(btn.base, btn.outline, btn.sm)}>
              Connexion
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate flex min-h-[640px] items-center justify-center overflow-hidden px-4 py-24 text-center">
        <img src={IMAGES.hero} alt="" className="absolute inset-0 -z-20 size-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-bg/70 via-bg/60 to-bg" />
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            <Sparkles className="size-3.5" /> Planificateur de voyage IA & gamifié
          </span>
          <h1 className="mt-6 text-5xl sm:text-7xl font-bold leading-[1.02] tracking-tight">
            Voyage plus malin,
            <br />
            <span className="text-gradient">joue plus fort.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-ink/80">
            Ton guide IA pour dénicher les pépites cachées et explorer le monde comme un jeu. Swipe, génère, voyage — et gagne de l&apos;XP.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href={startHref} className={cn(btn.base, btn.primary, btn.lg)}>
              Commencer l&apos;aventure <ArrowRight className="size-5" />
            </Link>
            <a href="#how" className={cn(btn.base, btn.ghost, btn.lg, "backdrop-blur")}>
              Comment ça marche
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 sm:px-6 py-24">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Des outils malins pour les explorateurs modernes</h2>
        <p className="mt-3 max-w-xl text-muted">Le futur du voyage : des outils pensés pour s&apos;adapter à ton style, pas l&apos;inverse.</p>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-line bg-surface-solid/70 p-7 transition hover:border-primary/50 hover:-translate-y-1">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:glow-primary transition">
                <f.icon className="size-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — aperçu swipe */}
      <section id="how" className="border-y border-line bg-bg-deep/60">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 py-24 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">De l&apos;envie à l&apos;itinéraire en 4 étapes</h2>
            <ol className="mt-10 space-y-7">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-primary font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="flex items-center gap-2 font-bold">
                      <s.icon className="size-4 text-primary" /> {s.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute inset-0 translate-x-6 rotate-6 rounded-3xl border border-line bg-surface-2/70" />
            <div className="relative overflow-hidden rounded-3xl border border-line bg-surface-solid shadow-2xl">
              <div className="relative h-64">
                <img src={IMAGES.food} alt="" className="size-full object-cover" />
                <span className="absolute left-4 top-4 rounded-full glass px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">🍜 Gastronomie</span>
              </div>
              <div className="p-6 text-center">
                <h3 className="text-2xl font-bold">Street Food</h3>
                <p className="mt-2 text-sm text-muted">Restaurants locaux, marchés de nuit et saveurs cachées.</p>
                <div className="mt-6 flex justify-center gap-6">
                  <span className="flex size-14 items-center justify-center rounded-full border border-coral/40 bg-coral/10 text-coral">
                    <X className="size-6" />
                  </span>
                  <span className="flex size-14 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
                    <Heart className="size-6 fill-primary" />
                  </span>
                </div>
              </div>
            </div>
            <span className="absolute -right-4 -top-4 rounded-full bg-gold px-3 py-1.5 text-sm font-bold text-[#2a1f00] glow-gold">+1 XP</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-dots">
        <div className="mx-auto max-w-3xl px-4 py-28 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">Prêt à voyager plus malin ?</h2>
          <p className="mx-auto mt-4 max-w-md text-muted">Rejoins les voyageurs qui découvrent le monde d&apos;une toute nouvelle façon. 3 itinéraires IA offerts chaque mois.</p>
          <Link href={startHref} className={cn(btn.base, btn.primary, btn.lg, "mt-9")}>
            Commencer gratuitement
          </Link>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col md:flex-row items-center justify-between gap-4 px-6 py-8 text-sm text-muted">
          <Logo />
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-primary">Tarifs</Link>
            <Link href="/community" className="hover:text-primary">Communauté</Link>
            <Link href="/login" className="hover:text-primary">Connexion</Link>
          </div>
          <span className="text-xs">© {new Date().getFullYear()} Voyago. Tous droits réservés.</span>
        </div>
      </footer>
    </div>
  );
}
