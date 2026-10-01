"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Sparkles, Thermometer, UserRound, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { awardXp } from "@/lib/hooks";
import { GENDERS, THERMAL } from "@/lib/constants";
import type { Gender, ThermalSensitivity } from "@/lib/types";
import { cn, displayName } from "@/lib/utils";
import { RequireAuth } from "@/components/RequireAuth";
import { Logo } from "@/components/Logo";
import { Button, ErrorBox, Field, inputCls } from "@/components/ui";
import { XpBar } from "@/components/XpBar";

type Earned = { label: string; xp: number; icon: React.ReactNode };

// Âge minimum 13 ans (calculé une fois au chargement du module)
const MAX_DOB = new Date(Date.now() - 13 * 365.25 * 864e5).toISOString().slice(0, 10);

function Onboarding() {
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dob, setDob] = useState(user?.date_of_birth?.slice(0, 10) || "");
  const [gender, setGender] = useState<Gender>(user?.gender || "prefer_not_to_say");
  const [thermal, setThermal] = useState<ThermalSensitivity>(user?.thermal_sensitivity || "balanced");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [earned, setEarned] = useState<Earned[]>([]);
  const [totals, setTotals] = useState<{ xp: number; level: number } | null>(null);

  // Si l'onboarding est déjà fait à l'arrivée, on renvoie au tableau de bord (comme le router mobile)
  const checked = useRef(false);
  useEffect(() => {
    if (checked.current || !user) return;
    checked.current = true;
    if (user.onboarding_completed) router.replace("/dashboard");
  }, [user, router]);

  const goStep2 = () => {
    if (!dob) return setError("Indique ta date de naissance pour continuer.");
    setError(null);
    setStep(2);
  };

  const finish = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ date_of_birth: dob, gender, thermal_sensitivity: thermal, onboarding_completed: true });
      const uid = user?.user_id;
      const r1 = await awardXp(uid, "complete_profile");
      const r2 = await awardXp(uid, "thermal_setup");
      const list: Earned[] = [
        { label: "Profil complété", xp: r1?.xp_awarded ?? 0, icon: <UserRound className="size-5" /> },
        { label: "Sensibilité thermique", xp: r2?.xp_awarded ?? 0, icon: <Thermometer className="size-5" /> },
      ];
      setEarned(list);
      const last = r2 || r1;
      if (last) setTotals({ xp: last.xp, level: last.level });
      setStep(3);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const totalEarned = earned.reduce((s, e) => s + e.xp, 0);

  return (
    <div className="min-h-screen bg-[linear-gradient(120deg,#0f2a2e_0%,#0c1a18_50%,#221f15_100%)]">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo href="/onboarding" />
          {step < 3 && <span className="text-sm text-muted">Étape {step} sur 2</span>}
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
        {step < 3 && (
          <div className="mb-12">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-bold">{step === 1 ? "Ton profil voyageur" : "Profil presque terminé"}</span>
              <span className="text-primary font-bold">{step}/2</span>
            </div>
            <XpBar value={step} max={2} color="primary" height={8} />
          </div>
        )}

        {step === 1 && (
          <div className="mx-auto max-w-xl animate-pop-in">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Bienvenue, {displayName(user)} 👋</h1>
            <p className="mt-3 text-lg text-muted">Quelques infos pour que l&apos;IA te prépare des voyages vraiment adaptés.</p>
            <div className="mt-10 flex flex-col gap-6">
              <Field label="Date de naissance">
                <input type="date" max={MAX_DOB} value={dob} onChange={(e) => setDob(e.target.value)} className={inputCls} />
              </Field>
              <div>
                <span className="text-sm font-semibold">Genre</span>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {GENDERS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGender(g.id)}
                      className={cn(
                        "h-12 rounded-xl border text-sm font-semibold transition cursor-pointer",
                        gender === g.id ? "border-primary bg-primary/15 text-primary" : "border-line bg-bg-deep/50 hover:border-primary/50",
                      )}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              {error && <ErrorBox message={error} />}
              <Button size="lg" onClick={goStep2} className="mt-2">
                Continuer <ArrowRight className="size-5" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-pop-in">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Profil de sensibilité thermique</h1>
            <p className="mt-3 max-w-2xl text-lg text-muted">L&apos;IA adaptera ses conseils vestimentaires selon la façon dont tu ressens la température.</p>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {THERMAL.map((t) => {
                const active = thermal === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setThermal(t.id)}
                    className={cn(
                      "group rounded-3xl border-2 p-6 text-left transition cursor-pointer",
                      active ? "border-primary bg-primary/5 glow-primary" : "border-transparent bg-surface-solid/60 hover:border-line",
                    )}
                  >
                    <div className={cn("flex h-40 items-center justify-center rounded-2xl bg-gradient-to-br to-transparent text-7xl transition group-hover:scale-[1.02]", t.tint)}>
                      {t.emoji}
                    </div>
                    <h3 className="mt-5 text-xl font-bold">{t.label}</h3>
                    <p className="mt-1.5 text-sm text-muted">{t.desc}</p>
                  </button>
                );
              })}
            </div>
            {error && <div className="mt-6"><ErrorBox message={error} /></div>}
            <div className="mt-10 flex items-center justify-center gap-3">
              <Button variant="ghost" size="lg" onClick={() => setStep(1)}>
                <ArrowLeft className="size-5" /> Retour
              </Button>
              <Button size="lg" loading={saving} onClick={finish} className="px-10">
                Enregistrer & continuer <ArrowRight className="size-5" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mx-auto max-w-xl text-center animate-pop-in">
            <div className="relative mx-auto flex size-44 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gold/20 blur-3xl" />
              <span className="relative text-[110px] leading-none">🏆</span>
              <span className="absolute right-4 top-2 text-3xl animate-bounce">✨</span>
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-muted">Onboarding réussi</p>
            <h1 className="mt-2 text-6xl font-bold text-gold drop-shadow-[0_0_25px_rgba(255,200,0,0.45)]">+{totalEarned} XP</h1>
            <p className="text-3xl font-bold">gagnés</p>

            <div className="mt-10 rounded-[2rem] border border-line bg-surface-solid/70 p-6 text-left">
              <div className="flex flex-col gap-3">
                {earned.map((e) => (
                  <div key={e.label} className="flex items-center gap-4 rounded-full border border-line bg-bg-deep/50 px-4 py-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-gold/15 text-gold">{e.icon}</span>
                    <span className="flex-1 font-semibold">{e.label}</span>
                    <span className="font-bold text-gold">{e.xp > 0 ? `+${e.xp} XP` : "Déjà obtenu"}</span>
                  </div>
                ))}
              </div>
              {totals && (
                <div className="mt-7">
                  <div className="mb-2 flex justify-between text-sm font-bold uppercase tracking-wider">
                    <span>Niveau {totals.level}</span>
                    <span>Niveau {totals.level + 1}</span>
                  </div>
                  <XpBar value={totals.xp % 100} max={100} height={14} />
                  <p className="mt-2 text-center text-xs text-muted">{100 - (totals.xp % 100)} XP avant le prochain niveau</p>
                </div>
              )}
              <Button variant="gold" size="lg" className="mt-7 w-full rounded-full" onClick={() => router.push("/swipe")}>
                Lancer ma première aventure <ArrowRight className="size-5" />
              </Button>
              <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted">
                <Sparkles className="size-4" /> Tu es prêt·e pour la génération magique !
              </p>
            </div>
            <button onClick={() => router.push("/dashboard")} className="mt-6 text-sm text-muted hover:text-primary cursor-pointer inline-flex items-center gap-1">
              <Zap className="size-3.5" /> Aller au tableau de bord
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <RequireAuth allowIncompleteOnboarding>
      <Onboarding />
    </RequireAuth>
  );
}
