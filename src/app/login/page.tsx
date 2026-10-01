"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AuthCard } from "@/components/AuthCard";
import { Button, ErrorBox, Field, inputCls } from "@/components/ui";

function LoginForm() {
  const { login, continueAsGuest, isLoggedIn, ready } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && isLoggedIn) router.replace(next);
  }, [ready, isLoggedIn, next, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const u = await login(email.trim(), password);
      router.replace(u.onboarding_completed ? next : "/onboarding");
    } catch (err) {
      setError(/Invalid email or password|Invalid credentials/.test((err as Error).message) ? "Email ou mot de passe incorrect." : (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const guest = async () => {
    setError(null);
    setGuestLoading(true);
    try {
      const u = await continueAsGuest();
      router.replace(u.onboarding_completed ? next : "/onboarding");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <AuthCard
      title="Bon retour, voyageur !"
      subtitle="Connecte-toi pour reprendre ton aventure."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-bold text-primary hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Adresse email">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@exemple.com" className={`${inputCls} pl-11`} />
          </div>
        </Field>
        <Field label="Mot de passe">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={`${inputCls} pl-11`} />
          </div>
        </Field>
        <Link href="/forgot-password" className="self-end text-sm text-primary underline-offset-4 hover:underline">
          Mot de passe oublié ?
        </Link>
        {error && <ErrorBox message={error} />}
        <Button type="submit" size="lg" loading={loading}>
          Connexion
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-muted">
        <span className="h-px flex-1 bg-line" /> ou <span className="h-px flex-1 bg-line" />
      </div>
      <Button variant="ghost" size="lg" className="w-full" onClick={guest} loading={guestLoading}>
        <UserRound className="size-4" /> Continuer en invité
      </Button>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
