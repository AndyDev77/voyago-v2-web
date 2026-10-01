"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { authApi } from "@/lib/api";
import { AVATAR_EMOJIS } from "@/lib/constants";
import { AuthCard } from "@/components/AuthCard";
import { Button, ErrorBox, Field, inputCls } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const { signup, isLoggedIn, isGuest, ready } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", pseudo: "", email: "", password: "", country: "France", city: "", avatar_emoji: "🦜" });
  const [countries, setCountries] = useState<string[]>(["France"]);
  const [emojis, setEmojis] = useState<string[]>(AVATAR_EMOJIS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Un invité peut créer un compte (ses voyages sont rattachés via guest_user_id)
    if (ready && isLoggedIn && !isGuest) router.replace("/dashboard");
  }, [ready, isLoggedIn, isGuest, router]);

  useEffect(() => {
    authApi
      .options()
      .then((o) => {
        if (o.countries?.length) setCountries(o.countries);
        if (o.avatar_emojis?.length) setEmojis(o.avatar_emojis);
      })
      .catch(() => {});
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 6) return setError("Le mot de passe doit contenir au moins 6 caractères.");
    setLoading(true);
    try {
      await signup({
        name: form.name.trim(),
        pseudo: form.pseudo.trim() || undefined,
        email: form.email.trim(),
        password: form.password,
        country: form.country,
        city: form.city.trim() || undefined,
        avatar_emoji: form.avatar_emoji,
      });
      router.replace("/onboarding");
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg === "Email already registered" ? "Cet email est déjà utilisé." : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Rejoins l'aventure"
      subtitle="Crée ton compte voyageur en 30 secondes."
      footer={
        <>
          Déjà un compte ?{" "}
          <Link href="/login" className="font-bold text-primary hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <span className="text-sm font-semibold">Ton avatar</span>
          <div className="mt-2 grid grid-cols-6 gap-2">
            {emojis.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setForm((f) => ({ ...f, avatar_emoji: em }))}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-xl border text-2xl transition cursor-pointer",
                  form.avatar_emoji === em ? "border-primary bg-primary/15 scale-105" : "border-line bg-bg-deep/50 hover:border-primary/50",
                )}
              >
                {em}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom / Nom">
            <input required maxLength={100} value={form.name} onChange={set("name")} placeholder="Alex" className={inputCls} />
          </Field>
          <Field label="Pseudo (optionnel)">
            <input value={form.pseudo} onChange={set("pseudo")} placeholder="alex_explore" className={inputCls} />
          </Field>
        </div>
        <Field label="Adresse email">
          <input type="email" required autoComplete="email" value={form.email} onChange={set("email")} placeholder="toi@exemple.com" className={inputCls} />
        </Field>
        <Field label="Mot de passe">
          <input type="password" required minLength={6} autoComplete="new-password" value={form.password} onChange={set("password")} placeholder="6 caractères minimum" className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pays">
            <select value={form.country} onChange={set("country")} className={inputCls}>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ville">
            <input value={form.city} onChange={set("city")} placeholder="Paris" className={inputCls} />
          </Field>
        </div>
        {error && <ErrorBox message={error} />}
        <Button type="submit" size="lg" loading={loading} className="mt-1">
          Créer mon compte
        </Button>
      </form>
    </AuthCard>
  );
}
