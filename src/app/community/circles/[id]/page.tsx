/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Heart, LogOut, MapPin, Send, Users } from "lucide-react";
import { communityApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/lib/hooks";
import { IMAGES, circleCategoryLabel } from "@/lib/constants";
import type { CommunityPost } from "@/lib/types";
import { cn, displayName, timeAgo } from "@/lib/utils";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { TripCard } from "@/components/TripCard";
import { Button, Card, EmptyState, ErrorBox, Spinner } from "@/components/ui";

function PostCard({ post, myId, onLike }: { post: CommunityPost; myId?: string; onLike: () => void }) {
  const liked = !!myId && (post.liked_by || []).includes(myId);
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <Link href={`/user/${post.user_id}`}>
          <Avatar picture={post.author?.picture} emoji={post.author?.avatar_emoji} size={42} />
        </Link>
        <div className="flex-1">
          <Link href={`/user/${post.user_id}`} className="font-bold hover:text-primary">
            {displayName(post.author)} {post.author?.is_pro && "💎"}
          </Link>
          <p className="text-xs text-muted">{timeAgo(post.created_at)}</p>
        </div>
      </div>
      {post.content && <p className="mt-4 whitespace-pre-line text-ink/90">{post.content}</p>}
      {post.poi_title && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-primary">
          <MapPin className="size-4" /> {post.poi_title}
          {post.poi_city ? `, ${post.poi_city}` : ""}
        </p>
      )}
      {post.image_urls && post.image_urls.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {post.image_urls.slice(0, 4).map((u) => (
            <img key={u} src={u} alt="" className="aspect-video w-full rounded-xl object-cover" />
          ))}
        </div>
      )}
      {post.trip && (
        <div className="mt-4 max-w-sm">
          <TripCard trip={{ ...post.trip, id: post.trip.id || post.trip._id || post.trip_id || "" }} />
        </div>
      )}
      <button
        onClick={onLike}
        disabled={!myId}
        className={cn("mt-4 flex items-center gap-1.5 text-sm font-semibold cursor-pointer disabled:cursor-default", liked ? "text-coral" : "text-muted hover:text-coral")}
      >
        <Heart className={cn("size-4", liked && "fill-coral")} /> {post.likes_count || 0}
      </button>
    </Card>
  );
}

export default function CircleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const circle = useAsync(() => communityApi.circle(id, user?.user_id), [id, user?.user_id]);
  const posts = useAsync(() => communityApi.posts(id), [id]);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const c = circle.data;

  const toggleMembership = async () => {
    if (!isLoggedIn) return router.push(`/login?next=/community/circles/${id}`);
    if (!c) return;
    setBusy(true);
    setError(null);
    try {
      if (c.is_member) await communityApi.leave(c.id);
      else await communityApi.join(c.id);
      await circle.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const publish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    setError(null);
    try {
      await communityApi.createPost(id, { content: content.trim() });
      setContent("");
      await posts.reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPosting(false);
    }
  };

  const like = async (p: CommunityPost) => {
    if (!user) return;
    // Mise à jour optimiste
    const was = (p.liked_by || []).includes(user.user_id);
    posts.setData((list) =>
      (list || []).map((x) =>
        x.id === p.id
          ? {
              ...x,
              likes_count: Math.max(0, (x.likes_count || 0) + (was ? -1 : 1)),
              liked_by: was ? (x.liked_by || []).filter((u) => u !== user.user_id) : [...(x.liked_by || []), user.user_id],
            }
          : x,
      ),
    );
    try {
      await communityApi.likePost(p.id);
    } catch {
      posts.reload();
    }
  };

  if (circle.loading) return <AppShell><Spinner /></AppShell>;
  if (circle.error || !c)
    return (
      <AppShell>
        <ErrorBox message={circle.error || "Tribu introuvable"} onRetry={circle.reload} />
      </AppShell>
    );

  return (
    <AppShell>
      <Link href="/community" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary">
        <ArrowLeft className="size-4" /> Toutes les tribus
      </Link>

      <div className="relative mt-4 overflow-hidden rounded-3xl border border-line">
        <img src={c.cover_image_url || IMAGES.hero} alt="" className="h-56 w-full object-cover sm:h-72" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <span className="flex size-20 items-center justify-center rounded-2xl border-4 border-bg bg-surface-2 text-5xl">{c.avatar_emoji || "🧭"}</span>
            <div>
              <p className="text-sm text-primary">{circleCategoryLabel(c.category)}</p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{c.name}</h1>
              {(c.destination_city || c.destination_country) && (
                <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                  <MapPin className="size-3.5" /> {[c.destination_city, c.destination_country].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </div>
          <Button variant={c.is_member ? "ghost" : "primary"} loading={busy} onClick={toggleMembership}>
            {c.is_member ? (
              <>
                <LogOut className="size-4" /> Quitter
              </>
            ) : (
              <>
                <Users className="size-4" /> Rejoindre
              </>
            )}
          </Button>
        </div>
      </div>

      {error && <div className="mt-4"><ErrorBox message={error} /></div>}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          {c.is_member && (
            <Card className="p-4">
              <form onSubmit={publish} className="flex items-start gap-3">
                <Avatar picture={user?.picture} emoji={user?.avatar_emoji} size={40} />
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Partage un bon plan, une question, un moment…"
                  className="h-20 flex-1 resize-none rounded-xl border border-line bg-bg-deep/60 p-3 text-sm outline-none focus:border-primary"
                />
                <Button type="submit" size="sm" loading={posting} disabled={!content.trim()} aria-label="Publier">
                  <Send className="size-4" />
                </Button>
              </form>
            </Card>
          )}
          {posts.loading ? (
            <Spinner />
          ) : posts.error ? (
            <ErrorBox message={posts.error} onRetry={posts.reload} />
          ) : !posts.data?.length ? (
            <EmptyState emoji="💬" title="Aucune publication" text={c.is_member ? "Sois le premier à lancer la discussion !" : "Rejoins la tribu pour publier."} />
          ) : (
            posts.data.map((p) => <PostCard key={p.id} post={p} myId={user?.user_id} onLike={() => like(p)} />)
          )}
        </div>

        <aside className="flex flex-col gap-5">
          <Card className="p-5">
            <h3 className="font-bold">À propos</h3>
            <p className="mt-2 text-sm text-muted">{c.description || "Pas encore de description."}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { v: c.members_count ?? 0, l: "Membres" },
                { v: c.posts_count ?? 0, l: "Posts" },
                { v: c.trips_count ?? 0, l: "Voyages" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl bg-surface-2 py-3">
                  <p className="text-xl font-bold text-primary">{s.v}</p>
                  <p className="text-xs text-muted">{s.l}</p>
                </div>
              ))}
            </div>
            {c.tags && c.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {c.tags.map((t) => (
                  <span key={t} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </Card>
          {c.members_sample && c.members_sample.length > 0 && (
            <Card className="p-5">
              <h3 className="font-bold">Membres</h3>
              <ul className="mt-3 flex flex-col gap-3">
                {c.members_sample.slice(0, 12).map((m) => (
                  <li key={m.user_id}>
                    <Link href={`/user/${m.user_id}`} className="flex items-center gap-3 hover:text-primary">
                      <Avatar picture={m.picture} emoji={m.avatar_emoji} size={32} />
                      <span className="flex-1 truncate text-sm font-semibold">{displayName(m)}</span>
                      {m.role && m.role !== "member" && m.role !== "explorer" && <span className="text-xs text-gold">{m.role}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
