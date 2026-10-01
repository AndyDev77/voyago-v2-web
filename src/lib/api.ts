import type {
  AuthResponse,
  AuthUser,
  Badge,
  CommunityCircle,
  CommunityPost,
  Interest,
  ProTier,
  PublicUserProfile,
  Trip,
  UserProfile,
  XpRewards,
} from "./types";

// Tous les appels passent par le BFF Next.js (/bff → backend /api), qui porte le jeton en cookie httpOnly.
const BFF_PREFIX = "/bff";

export class ApiError extends Error {
  constructor(message: string, public status?: number, public data?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

// Appelé sur 401 hors routes d'auth (équivalent de DioClient.onAuthExpired)
let onAuthExpired: (() => void) | null = null;
export function setOnAuthExpired(cb: (() => void) | null) {
  onAuthExpired = cb;
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function extractMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const msg = (data as { message?: unknown }).message;
    if (Array.isArray(msg)) return msg.join(", ");
    if (typeof msg === "string") return msg;
  }
  return fallback;
}

async function request<T>(method: Method, path: string, body?: unknown, init?: { timeoutMs?: number }): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  // La génération IA multi-jours peut prendre 20 à 60 s (cf. DioClient mobile)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), init?.timeoutMs ?? 30_000);

  let res: Response;
  try {
    res = await fetch(path.replace(/^\/api/, BFF_PREFIX), { method, headers, body: payload, signal: controller.signal, credentials: "same-origin" });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new ApiError("Le serveur met trop de temps à répondre. Réessaie dans un instant.");
    }
    throw new ApiError("Impossible de joindre le serveur Voyago. Vérifie que le backend tourne.");
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const isAuthRoute = path.includes("/api/auth/email/");
    if (res.status === 401 && !isAuthRoute) onAuthExpired?.();
    throw new ApiError(extractMessage(data, `Erreur ${res.status}`), res.status, data);
  }
  return data as T;
}

const get = <T>(p: string) => request<T>("GET", p);
const post = <T>(p: string, b?: unknown, o?: { timeoutMs?: number }) => request<T>("POST", p, b ?? {}, o);
const patch = <T>(p: string, b?: unknown) => request<T>("PATCH", p, b ?? {});
const del = <T>(p: string) => request<T>("DELETE", p);

// Normalise l'identifiant Mongo (_id) en id
function withId<T extends { id?: string; _id?: string }>(x: T): T & { id: string } {
  return { ...x, id: x.id || x._id || "" };
}

// ---------------------------------------------------------------- AUTH
export const authApi = {
  options: () => get<{ countries: string[]; avatar_emojis: string[] }>("/api/auth/options"),
  login: (email: string, password: string) => post<AuthResponse>("/api/auth/email/login", { email, password }),
  signup: (dto: {
    email: string;
    password: string;
    name: string;
    pseudo?: string;
    avatar_emoji?: string;
    date_of_birth?: string;
    country?: string;
    city?: string;
    guest_user_id?: string;
  }) => post<AuthResponse>("/api/auth/email/signup", dto),
  guest: (guest_id?: string) => post<AuthResponse>("/api/auth/guest", guest_id ? { guest_id } : {}),
  forgotPassword: (email: string) => post<{ message: string }>("/api/auth/forgot-password", { email }),
  resetPassword: (email: string, code: string, new_password: string) =>
    post<{ message: string }>("/api/auth/reset-password", { email, code, new_password }),
  me: () => get<AuthUser>("/api/auth/me"),
  updateMe: (dto: Partial<AuthUser>) => patch<AuthUser>("/api/auth/me", dto),
  logout: () => post<{ message: string }>("/api/auth/logout"),
  uploadPicture: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<AuthUser | { user: AuthUser }>("POST", "/api/upload/profile-picture", fd, { timeoutMs: 60_000 });
  },
  deletePicture: () => del<AuthUser | { user: AuthUser }>("/api/upload/profile-picture"),
};

// ---------------------------------------------------------------- TRIPS
export interface GenerateTripDto {
  destination: string;
  duration_days: number;
  pace: "tranquille" | "equilibre" | "intensif";
  transports: string[];
  budget: "economique" | "moyen" | "luxe";
  interests: string[];
  start_date?: string;
  end_date?: string;
  city?: string;
  country?: string;
  country_code?: string;
  thermal_sensitivity?: string;
}

export const tripsApi = {
  generate: async (dto: GenerateTripDto) => withId(await post<Trip>("/api/trips/generate", dto, { timeoutMs: 240_000 })),
  byUser: async (userId: string) => (await get<Trip[]>(`/api/trips/${userId}`)).map(withId),
  byId: async (tripId: string) => withId(await get<Trip>(`/api/trip/${tripId}`)),
};

// ---------------------------------------------------------------- GAMIFICATION
export const gamificationApi = {
  profile: (userId: string) => get<UserProfile>(`/api/profile/${userId}`),
  awardXp: (userId: string, action: string) =>
    post<UserProfile & { xp_awarded?: number; message?: string }>("/api/profile/award-xp", { user_id: userId, action }),
  rewards: (userId?: string) => get<XpRewards>(userId ? `/api/xp-rewards/${userId}` : "/api/xp-rewards"),
  badges: () => get<Badge[]>("/api/badges"),
};

// ---------------------------------------------------------------- INTERESTS
export const interestsApi = {
  list: () => get<Interest[]>("/api/interests"),
};

// ---------------------------------------------------------------- PRO
export const proApi = {
  tiers: () => get<ProTier[]>("/api/pro/tiers"),
  checkout: (tier: string) => post<{ checkout_url: string; session_id: string }>("/api/pro/checkout", { tier }),
  status: (sessionId: string) =>
    get<{ status: string; payment_status: string; applied: boolean }>(`/api/pro/status/${sessionId}`),
  me: () => get<{ is_pro: boolean; tier: string | null; expires_at: string | null }>("/api/pro/me"),
};

// ---------------------------------------------------------------- COMMUNITY
export const communityApi = {
  feed: async () => (await get<Trip[]>("/api/community/feed")).map(withId),
  user: async (id: string) => {
    const data = await get<PublicUserProfile>(`/api/community/user/${id}`);
    return { ...data, trips: (data.trips || []).map(withId) };
  },
  circles: async (params: { category?: string; search?: string; my_user_id?: string; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    });
    const q = qs.toString();
    const data = await get<CommunityCircle[] | { circles: CommunityCircle[] }>(`/api/community/circles${q ? `?${q}` : ""}`);
    const list = Array.isArray(data) ? data : data.circles || [];
    return list.map(withId);
  },
  circle: async (id: string, userId?: string) => {
    const data = await get<CommunityCircle | { circle: CommunityCircle }>(
      `/api/community/circles/${id}${userId ? `?user_id=${encodeURIComponent(userId)}` : ""}`,
    );
    const c = "circle" in data && data.circle ? data.circle : (data as CommunityCircle);
    return withId(c);
  },
  createCircle: async (dto: {
    name: string;
    description?: string;
    avatar_emoji?: string;
    cover_image_url?: string;
    category?: string;
    destination_city?: string;
    destination_country?: string;
    is_public?: boolean;
    tags?: string[];
  }) => {
    const data = await post<CommunityCircle | { circle: CommunityCircle }>("/api/community/circles", dto);
    const c = "circle" in data && data.circle ? data.circle : (data as CommunityCircle);
    return withId(c);
  },
  join: (id: string) => post<unknown>(`/api/community/circles/${id}/join`),
  leave: (id: string) => post<unknown>(`/api/community/circles/${id}/leave`),
  posts: async (id: string) => {
    const data = await get<CommunityPost[] | { posts: CommunityPost[] }>(`/api/community/circles/${id}/posts`);
    const list = Array.isArray(data) ? data : data.posts || [];
    return list.map(withId);
  },
  createPost: (id: string, dto: { content: string; trip_id?: string; poi_title?: string; image_urls?: string[] }) =>
    post<CommunityPost>(`/api/community/circles/${id}/posts`, dto),
  shareTrip: (id: string, trip_id: string, comment?: string) =>
    post<unknown>(`/api/community/circles/${id}/share-trip`, { trip_id, comment }),
  likePost: (postId: string) => post<{ likes_count?: number; liked_by?: string[] }>(`/api/community/posts/${postId}/like`),
};
