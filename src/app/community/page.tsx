/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Compass, Globe2, Plus, Search, Users, X } from "lucide-react";
import { communityApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/lib/hooks";
import { AVATAR_EMOJIS, CIRCLE_CATEGORIES, IMAGES, circleCategoryLabel } from "@/lib/constants";
import type { CommunityCircle } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { TripCard } from "@/components/TripCard";
import { Button, Chip, EmptyState, ErrorBox, Field, inputCls, Spinner } from "@/components/ui";

function CircleCard({ c }: { c: CommunityCircle }) {
  return (
    <Link href={`/community/circles/${c.id}`} className="group overflow-hidden rounded-2xl border border-line bg-surface-solid/80 transition hover:-translate-y-1 hover:border-primary/50">
      <div className="relative h-36">
        <img src={c.cover_image_url || IMAGES.hero} alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-solid to-transparent" />
        <span className="absolute -bottom-6 left-5 flex size-14 items-center justify-center rounded-2xl border-4 border-surface-solid bg-surface-2 text-3xl">
          {c.avatar_emoji || "🧭"}
        </span>
        {c.is_member && <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-[#062420]">Membre</span>}
      </div>
      <div className="p-5 pt-8">
        <h3 className="text-lg font-bold leading-tight">{c.name}</h3>
        <p className="mt-0.5 text-xs text-primary">{circleCategoryLabel(c.category)}</p>
        <p className="mt-2 line-clamp-2 text-sm text-muted">{c.description}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-muted">
          <span className="flex items-center gap-1">
            <Users className="size-3.5" /> {c.members_count ?? 1} membres
          </span>
          <span>{c.posts_count ?? 0} posts · {c.trips_count ?? 0} voyages</span>
        </div>
        {c.members_sample && c.members_sample.length > 0 && (
          <div className="mt-3 flex -space-x-2">
            {c.members_sample.slice(0, 5).map((m) => (
              <Avatar key={m.user_id} picture={m.picture} emoji={m.avatar_emoji} size={26} className="border-2 border-surface-solid" />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function CreateCircleModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", description: "", category: "adventure", avatar_emoji: "🧭", destination_city: "", destination_country: "", is_public: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const cover = CIRCLE_CATEGORIES.find((c) => c.id === form.category)?.cover;
      const c = await communityApi.createCircle({
        ...form,
        destination_city: form.destination_city || undefined,
        destination_country: form.destination_country || undefined,
        cover_image_url: cover,
      });
      router.push(`/community/circles/${c.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-surface-solid p-6 animate-pop-in">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-bold">Créer une tribu</h3>
          <button type="button" onClick={onClose} className="cursor-pointer text-muted hover:text-ink" aria-label="Fermer">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {["🧭", "🏛️", "⛩️", "🌿", "🍷", "🏖️", ...AVATAR_EMOJIS.slice(0, 4)].map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setForm((f) => ({ ...f, avatar_emoji: em }))}
                className={cn("size-11 rounded-xl border text-2xl cursor-pointer", form.avatar_emoji === em ? "border-primary bg-primary/15" : "border-line")}
              >
                {em}
              </button>
            ))}
          </div>
          <Field label="Nom de la tribu">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Roadtrip Islande 2027" className={inputCls} />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputCls} h-24 py-3 resize-none`} placeholder="De quoi parle ta tribu ?" />
          </Field>
          <Field label="Catégorie">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls}>
              {CIRCLE_CATEGORIES.filter((c) => c.id).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ville (optionnel)">
              <input value={form.destination_city} onChange={(e) => setForm({ ...form, destination_city: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Pays (optionnel)">
              <input value={form.destination_country} onChange={(e) => setForm({ ...form, destination_country: e.target.value })} className={inputCls} />
            </Field>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} className="size-4 accent-[#0df2cc]" />
            Tribu publique (visible par tous)
          </label>
          {error && <ErrorBox message={error} />}
          <Button type="submit" size="lg" loading={saving}>
            Créer la tribu
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CommunityPage() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"circles" | "feed">("circles");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const circles = useAsync(() => communityApi.circles({ category, search: debounced, my_user_id: user?.user_id }), [category, debounced, user?.user_id]);
  const feed = useAsync(() => (tab === "feed" ? communityApi.feed() : Promise.resolve(null)), [tab]);

  const mine = (circles.data || []).filter((c) => c.is_member);
  const others = (circles.data || []).filter((c) => !c.is_member);

  return (
    <AppShell>
      {creating && <CreateCircleModal onClose={() => setCreating(false)} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Communauté</h1>
          <p className="mt-2 text-muted">Rejoins des tribus de voyageurs, partage tes itinéraires et inspire-toi.</p>
        </div>
        <Button onClick={() => (isLoggedIn ? setCreating(true) : router.push("/login?next=/community"))}>
          <Plus className="size-4" /> Créer une tribu
        </Button>
      </div>

      <div className="mt-8 flex gap-2 border-b border-line">
        {[
          { id: "circles", label: "Tribus", icon: Compass },
          { id: "feed", label: "Fil public", icon: Globe2 },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition cursor-pointer",
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted hover:text-ink",
            )}
          >
            <t.icon className="size-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "circles" ? (
        <div className="mt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative lg:w-80">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une tribu…" className={`${inputCls} pl-11`} />
            </div>
            <div className="flex flex-wrap gap-2">
              {CIRCLE_CATEGORIES.map((c) => (
                <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
                  {c.emoji} {c.label}
                </Chip>
              ))}
            </div>
          </div>

          {circles.loading ? (
            <Spinner />
          ) : circles.error ? (
            <div className="mt-6"><ErrorBox message={circles.error} onRetry={circles.reload} /></div>
          ) : (
            <>
              {mine.length > 0 && (
                <section className="mt-8">
                  <h2 className="mb-4 text-lg font-bold">Mes tribus</h2>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {mine.map((c) => (
                      <CircleCard key={c.id} c={c} />
                    ))}
                  </div>
                </section>
              )}
              <section className="mt-8">
                <h2 className="mb-4 text-lg font-bold">{mine.length ? "À découvrir" : "Toutes les tribus"}</h2>
                {others.length === 0 ? (
                  <EmptyState emoji="🧭" title="Aucune tribu trouvée" text="Lance la tienne et rassemble des voyageurs autour de ta destination favorite." />
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {others.map((c) => (
                      <CircleCard key={c.id} c={c} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      ) : (
        <div className="mt-6">
          {feed.loading ? (
            <Spinner />
          ) : feed.error ? (
            <ErrorBox message={feed.error} onRetry={feed.reload} />
          ) : !feed.data?.length ? (
            <EmptyState emoji="🌍" title="Le fil est encore vide" text="Les itinéraires publics de la communauté apparaîtront ici." />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {feed.data.map((t) => (
                <TripCard key={t.id} trip={t} showAuthor />
              ))}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
