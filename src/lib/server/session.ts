import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import type { AuthUser } from "@/lib/types";

/**
 * Session côté serveur : le jeton du backend vit dans un cookie httpOnly,
 * jamais exposé au JavaScript du navigateur.
 */
export const BACKEND_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3333").replace(/\/$/, "");

export const COOKIE_SESSION = "voyago_session";
export const COOKIE_TENANT = "voyago_tenant";
/** "1" si l'onboarding est terminé — sert aux redirections rapides du proxy. */
export const COOKIE_ONBOARDED = "voyago_onboarded";

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

/** Appel serveur → backend, avec le jeton de session de l'utilisateur s'il existe. */
export async function backendFetch(path: string, init: RequestInit = {}) {
  const store = await cookies();
  const token = store.get(COOKIE_SESSION)?.value;
  const tenant = store.get(COOKIE_TENANT)?.value || "default";
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("x-tenant-id", tenant);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${BACKEND_URL}${path}`, { cache: "no-store", ...init, headers });
}

/** Lecture JSON tolérante : null si le backend est injoignable ou répond une erreur. */
export async function backendJson<T>(path: string): Promise<T | null> {
  try {
    // Délai court : un backend lent ne doit pas bloquer le rendu de toutes les pages
    const res = await backendFetch(path, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Utilisateur courant (dédupliqué sur la requête). */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const store = await cookies();
  if (!store.get(COOKIE_SESSION)?.value) return null;
  return backendJson<AuthUser>("/api/auth/me");
});
