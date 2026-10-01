"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { AuthCard } from "@/components/AuthCard";
import { Button, ErrorBox, Field, inputCls } from "@/components/ui";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setStep("code");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.resetPassword(email.trim(), code.trim(), password);
      setStep("done");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title={step === "done" ? "Mot de passe modifié" : "Mot de passe oublié"}
      subtitle={
        step === "email"
          ? "Saisis ton email, on t'envoie un code à 6 chiffres."
          : step === "code"
            ? `Code envoyé à ${email} (si le compte existe).`
            : "Tu peux te reconnecter avec ton nouveau mot de passe."
      }
      footer={
        <Link href="/login" className="font-bold text-primary hover:underline">
          ← Retour à la connexion
        </Link>
      }
    >
      {step === "email" && (
        <form onSubmit={sendCode} className="flex flex-col gap-4">
          <Field label="Adresse email">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@exemple.com" className={inputCls} />
          </Field>
          {error && <ErrorBox message={error} />}
          <Button type="submit" size="lg" loading={loading}>
            Envoyer le code
          </Button>
        </form>
      )}
      {step === "code" && (
        <form onSubmit={reset} className="flex flex-col gap-4">
          <Field label="Code reçu par email">
            <input
              required
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className={`${inputCls} text-center text-2xl tracking-[0.5em] font-bold`}
            />
          </Field>
          <Field label="Nouveau mot de passe">
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6 caractères minimum" className={inputCls} />
          </Field>
          {error && <ErrorBox message={error} />}
          <Button type="submit" size="lg" loading={loading}>
            Réinitialiser
          </Button>
        </form>
      )}
      {step === "done" && (
        <div className="flex flex-col items-center gap-5">
          <CheckCircle2 className="size-14 text-primary" />
          <Button size="lg" className="w-full" onClick={() => router.push("/login")}>
            Se connecter
          </Button>
        </div>
      )}
    </AuthCard>
  );
}
