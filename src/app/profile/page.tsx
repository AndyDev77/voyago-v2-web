"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, Crown, Fingerprint, Pencil, Thermometer, Trash2, X } from "lucide-react";
import { authApi, tripsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAsync, useGameProfile } from "@/lib/hooks";
import { AVATAR_EMOJIS, GENDERS, THERMAL, levelTitle } from "@/lib/constants";
import type { AuthUser, Gender, ThermalSensitivity } from "@/lib/types";
import { cn, displayName, formatDate } from "@/lib/utils";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { RequireAuth } from "@/components/RequireAuth";
import { XpBar } from "@/components/XpBar";
import { Button, Card, ErrorBox, Field, inputCls, LinkButton, SectionTitle } from "@/components/ui";

const INTEREST_META: Record<string, { label: string; emoji: string }> = {
  culture: { label: "Culture & Histoire", emoji: "🏛️" },
  gastronomie: { label: "Gastronomie", emoji: "🍜" },
  nature: { label: "Nature & Randonnée", emoji: "🏔️" },
  plage: { label: "Plage & Mer", emoji: "🏖️" },
  nightlife: { label: "Vie nocturne", emoji: "🎉" },
  shopping: { label: "Shopping", emoji: "🛍️" },
  sport: { label: "Sport & Aventure", emoji: "🧗" },
  bien_etre: { label: "Bien-être", emoji: "🧘" },
  art: { label: "Art & Design", emoji: "🎨" },
  famille: { label: "Famille", emoji: "👨‍👩‍👧‍👦" },
};

function EditForm({ user, onDone }: { user: AuthUser; onDone: () => void }) {
  const { updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user.name || "",
    pseudo: user.pseudo || "",
    avatar_emoji: user.avatar_emoji || "🦜",
    country: user.country || "",
    city: user.city || "",
    gender: (user.gender || "prefer_not_to_say") as Gender,
    thermal_sensitivity: (user.thermal_sensitivity || "balanced") as ThermalSensitivity,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ ...form, pseudo: form.pseudo || undefined });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      <div>
        <span className="text-sm font-semibold">Avatar emoji</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {AVATAR_EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => setForm({ ...form, avatar_emoji: em })}
              className={cn("size-11 rounded-xl border text-2xl cursor-pointer", form.avatar_emoji === em ? "border-primary bg-primary/15" : "border-line")}
            >
              {em}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Pseudo">
          <input value={form.pseudo} onChange={(e) => setForm({ ...form, pseudo: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Pays">
          <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Ville">
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Genre">
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })} className={inputCls}>
            {GENDERS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sensibilité thermique">
          <select value={form.thermal_sensitivity} onChange={(e) => setForm({ ...form, thermal_sensitivity: e.target.value as ThermalSensitivity })} className={inputCls}>
            {THERMAL.map((t) => (
              <option key={t.id} value={t.id}>
                {t.emoji} {t.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {error && <ErrorBox message={error} />}
      <div className="flex gap-3">
        <Button type="submit" loading={saving}>
          <Check className="size-4" /> Enregistrer
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          <X className="size-4" /> Annuler
        </Button>
      </div>
    </form>
  );
}

function Profile() {
  const { user, setUser, isGuest } = useAuth();
  const { profile } = useGameProfile();
  const trips = useAsync(() => tripsApi.byUser(user!.user_id), [user?.user_id]);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setError(null), [editing]);

  // « ADN du voyageur » : fréquence des envies dans les voyages générés
  const dna = useMemo(() => {
    const counts: Record<string, number> = {};
    (trips.data || []).forEach((t) => t.interests?.forEach((i) => (counts[i] = (counts[i] || 0) + 1)));
    const total = trips.data?.length || 0;
    return Object.entries(counts)
      .map(([id, n]) => ({ id, pct: total ? Math.round((n / total) * 100) : 0 }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5);
  }, [trips.data]);

  const countries = useMemo(() => new Set((trips.data || []).map((t) => t.country).filter(Boolean)).size, [trips.data]);
  const totalPois = useMemo(() => (trips.data || []).reduce((s, t) => s + (t.pois?.length || 0), 0), [trips.data]);

  const upload = async (file?: File) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) return setError("Image trop lourde (4 Mo max).");
    setUploading(true);
    setError(null);
    try {
      const res = await authApi.uploadPicture(file);
      setUser("user" in res && res.user ? res.user : (res as AuthUser));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const removePicture = async () => {
    setUploading(true);
    try {
      const res = await authApi.deletePicture();
      setUser("user" in res && res.user ? res.user : (res as AuthUser));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;
  const xp = profile?.xp ?? 0;
  const thermal = THERMAL.find((t) => t.id === (user.thermal_sensitivity || "balanced"));

  return (
    <div className="flex flex-col gap-8">
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-gold/5 to-transparent" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
          <div className="relative w-fit">
            <Avatar picture={user.picture} emoji={user.avatar_emoji} size={140} ring="gold" />
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-lg bg-gold px-3 py-1 text-sm font-bold text-[#2a1f00]">NIV. {profile?.level ?? 1}</span>
            {!isGuest && (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute right-0 top-0 flex size-10 items-center justify-center rounded-full border border-line bg-surface-solid hover:border-primary cursor-pointer"
                aria-label="Changer la photo"
              >
                <Camera className={cn("size-4", uploading && "animate-pulse")} />
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight">{displayName(user)}</h1>
              {user.is_pro && (
                <span className="flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold">
                  <Crown className="size-3.5" /> Explorer Pro
                </span>
              )}
            </div>
            <p className="mt-2 text-lg text-muted">
              {levelTitle(xp)} · {[user.city, user.country].filter(Boolean).join(", ") || "Citoyen du monde"}
            </p>
            <div className="mt-5 max-w-lg">
              <div className="mb-1.5 flex justify-between text-sm">
                <span>Prochain niveau</span>
                <span className="font-bold text-gold">{xp % 100} / 100 XP</span>
              </div>
              <XpBar value={xp % 100} max={100} />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Button variant="gold" onClick={() => setEditing((e) => !e)}>
              <Pencil className="size-4" /> Modifier le profil
            </Button>
            {user.picture && (
              <Button variant="ghost" onClick={removePicture} loading={uploading}>
                <Trash2 className="size-4" /> Retirer la photo
              </Button>
            )}
          </div>
        </div>
        {error && <div className="relative mt-4"><ErrorBox message={error} /></div>}
      </Card>

      {editing && (
        <Card className="p-6 animate-pop-in">
          <h2 className="mb-5 text-xl font-bold">Modifier mon profil</h2>
          <EditForm user={user} onDone={() => setEditing(false)} />
        </Card>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <section>
          <SectionTitle>Statistiques de voyage</SectionTitle>
          <Card className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              { label: "Voyages générés", value: profile?.trips_count ?? trips.data?.length ?? 0, sub: "itinéraires IA" },
              { label: "Série en cours", value: `${profile?.streak ?? 0} j`, sub: "🔥 continue comme ça !" },
              { label: "Pays explorés", value: countries, sub: `${totalPois} lieux découverts` },
            ].map((s) => (
              <div key={s.label} className="p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-gold">{s.label}</p>
                <p className="mt-2 text-4xl font-bold">{s.value}</p>
                <p className="mt-2 text-sm text-muted">{s.sub}</p>
              </div>
            ))}
          </Card>

          <Card className="mt-6 p-6">
            <h3 className="mb-4 font-bold">Informations</h3>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Email</dt>
                <dd className="font-semibold">{user.email || "Compte invité"}</dd>
              </div>
              <div>
                <dt className="text-muted">Date de naissance</dt>
                <dd className="font-semibold">{formatDate(user.date_of_birth) || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Genre</dt>
                <dd className="font-semibold">{GENDERS.find((g) => g.id === user.gender)?.label || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Abonnement</dt>
                <dd className="font-semibold">{user.is_pro ? `Pro (${user.pro_tier || "actif"})` : "Gratuit · 3 voyages / mois"}</dd>
              </div>
            </dl>
          </Card>
        </section>

        <aside className="flex flex-col gap-6">
          <Card className="p-6">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <Fingerprint className="size-5 text-gold" /> ADN du voyageur
            </h3>
            {dna.length === 0 ? (
              <p className="mt-4 text-sm text-muted">Génère des voyages pour révéler ton ADN de voyageur.</p>
            ) : (
              <div className="mt-5 flex flex-col gap-5">
                {dna.map((d) => (
                  <div key={d.id}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span>
                        {INTEREST_META[d.id]?.emoji} {INTEREST_META[d.id]?.label || d.id}
                      </span>
                      <b>{d.pct}%</b>
                    </div>
                    <XpBar value={d.pct} max={100} height={6} />
                  </div>
                ))}
              </div>
            )}
            <div className="my-6 h-px bg-line" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Métriques biologiques</p>
            <div className="mt-3 flex items-center gap-4 rounded-xl border border-line bg-bg-deep/50 p-4">
              <span className="flex size-11 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <Thermometer className="size-5" />
              </span>
              <div>
                <p className="text-xs text-muted">Profil thermique</p>
                <p className="font-bold">
                  {thermal?.emoji} {thermal?.label}
                </p>
              </div>
            </div>
          </Card>

          {!user.is_pro && (
            <div className="rounded-2xl bg-gradient-to-br from-gold to-gold-dark p-6 text-[#2a1f00]">
              <h3 className="text-2xl font-bold">Découverte illimitée</h3>
              <p className="mt-2 text-sm opacity-80">Voyages illimités, météo étendue et badge Pro exclusif.</p>
              <LinkButton href="/pricing" variant="dark" className="mt-5 w-full" size="lg">
                Voir les offres
              </LinkButton>
            </div>
          )}
          {isGuest && (
            <Card className="border-primary/40 p-6">
              <p className="font-bold">Mode invité</p>
              <p className="mt-1 text-sm text-muted">Crée un compte pour garder tes voyages et ton XP.</p>
              <Link href="/signup" className="mt-3 inline-block text-sm font-bold text-primary hover:underline">
                Créer mon compte →
              </Link>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AppShell>
      <RequireAuth>
        <Profile />
      </RequireAuth>
    </AppShell>
  );
}
