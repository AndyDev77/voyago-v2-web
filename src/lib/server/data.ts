import "server-only";
import { cache } from "react";
import type { CommunityCircle, CommunityPost, ProTier, PublicUserProfile, Trip } from "@/lib/types";
import { backendJson } from "./session";

const withId = <T extends { id?: string; _id?: string }>(x: T) => ({ ...x, id: x.id || x._id || "" });

// cache() : un seul appel backend par requête, partagé entre generateMetadata, la page et l'image OG
export const getTrip = cache(async (id: string) => {
  const t = await backendJson<Trip>(`/api/trip/${encodeURIComponent(id)}`);
  return t ? withId(t) : null;
});

export const getPublicUser = cache(async (id: string) => {
  const d = await backendJson<PublicUserProfile>(`/api/community/user/${encodeURIComponent(id)}`);
  return d ? { ...d, trips: (d.trips || []).map(withId) } : null;
});

export const getPublicFeed = cache(async () => ((await backendJson<Trip[]>("/api/community/feed")) || []).map(withId));

export const getCircles = cache(async (userId?: string) => {
  const q = userId ? `?my_user_id=${encodeURIComponent(userId)}` : "";
  const d = await backendJson<CommunityCircle[] | { circles: CommunityCircle[] }>(`/api/community/circles${q}`);
  if (!d) return null;
  return (Array.isArray(d) ? d : d.circles || []).map(withId);
});

export const getCircle = cache(async (id: string, userId?: string) => {
  const q = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  const d = await backendJson<CommunityCircle | { circle: CommunityCircle }>(`/api/community/circles/${encodeURIComponent(id)}${q}`);
  if (!d) return null;
  const c = "circle" in d && d.circle ? d.circle : (d as CommunityCircle);
  return withId(c);
});

export const getProTiers = cache(async () => backendJson<ProTier[]>("/api/pro/tiers"));

export const getCirclePosts = cache(async (id: string) => {
  const d = await backendJson<CommunityPost[] | { posts: CommunityPost[] }>(`/api/community/circles/${encodeURIComponent(id)}/posts`);
  if (!d) return null;
  return (Array.isArray(d) ? d : d.posts || []).map(withId);
});
