"use client";

import { useCallback, useEffect, useState } from "react";
import { gamificationApi } from "./api";
import { useAuth } from "./auth";
import type { UserProfile } from "./types";

const XP_EVENT = "voyago:xp-changed";

/** Notifie toute l'UI qu'il faut recharger l'XP (nav, dashboard…). */
export function notifyXpChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(XP_EVENT));
}

/** Attribue de l'XP sans bloquer l'UI (anti-triche géré par le backend). */
export async function awardXp(userId: string | undefined, action: string) {
  if (!userId) return null;
  try {
    const res = await gamificationApi.awardXp(userId, action);
    notifyXpChanged();
    return res;
  } catch {
    return null;
  }
}

export function useGameProfile() {
  const { user, isLoggedIn } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.user_id) {
      setLoading(false);
      return;
    }
    try {
      setProfile(await gamificationApi.profile(user.user_id));
    } catch {
      // le profil gamifié est secondaire : on n'affiche pas d'erreur bloquante
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    if (!isLoggedIn) return;
    load();
    window.addEventListener(XP_EVENT, load);
    return () => window.removeEventListener(XP_EVENT, load);
  }, [isLoggedIn, load]);

  return { profile, loading, reload: load };
}

/** Petit helper de chargement asynchrone avec état. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fn());
    } catch (e) {
      setError((e as Error).message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { data, setData, error, loading, reload: run };
}
