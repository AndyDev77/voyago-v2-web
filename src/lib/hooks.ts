"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

/** Profil gamifié (XP, niveau, série, badges) rechargé à chaque notifyXpChanged(). */
export function useGameProfile() {
  const { user, isLoggedIn } = useAuth();
  const uid = user?.user_id;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(XP_EVENT, bump);
    return () => window.removeEventListener(XP_EVENT, bump);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !uid) return;
    let cancelled = false;
    gamificationApi
      .profile(uid)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch(() => {
        // le profil gamifié est secondaire : pas d'erreur bloquante
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, uid, version]);

  return { profile: isLoggedIn ? profile : null, reload: notifyXpChanged };
}

interface AsyncState<T> {
  key: string | null;
  data: T | null;
  error: string | null;
}

/**
 * Chargement asynchrone relancé quand `deps` change.
 * `loading` est dérivé (aucun setState synchrone dans les effets).
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[], initialData?: T | null) {
  const key = JSON.stringify(deps);
  const fnRef = useRef(fn);
  const keyRef = useRef(key);
  // Clé des données déjà en main (rendu serveur) : pas de second appel, même sous StrictMode
  const loadedKey = useRef<string | null>(initialData != null ? key : null);
  const [state, setState] = useState<AsyncState<T>>(
    initialData != null ? { key, data: initialData, error: null } : { key: null, data: null, error: null },
  );
  const [reloading, setReloading] = useState(false);

  // Toujours appeler la dernière version de fn (déclaré avant l'effet de chargement)
  useEffect(() => {
    fnRef.current = fn;
    keyRef.current = key;
  });

  useEffect(() => {
    if (loadedKey.current === key) return;
    let cancelled = false;
    fnRef
      .current()
      .then((data) => {
        if (cancelled) return;
        loadedKey.current = key;
        setState({ key, data, error: null });
      })
      .catch((e: Error) => {
        if (!cancelled) setState((s) => ({ key, data: s.data, error: e.message || "Une erreur est survenue" }));
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const reload = useCallback(async () => {
    setReloading(true);
    try {
      const data = await fnRef.current();
      setState({ key: keyRef.current, data, error: null });
    } catch (e) {
      setState((s) => ({ ...s, key: keyRef.current, error: (e as Error).message || "Une erreur est survenue" }));
    } finally {
      setReloading(false);
    }
  }, []);

  const setData = useCallback((updater: T | null | ((prev: T | null) => T | null)) => {
    setState((s) => ({ ...s, data: typeof updater === "function" ? (updater as (p: T | null) => T | null)(s.data) : updater }));
  }, []);

  return {
    data: state.data,
    error: state.key === key ? state.error : null,
    // Un rechargement manuel ne masque pas les données déjà affichées
    loading: state.key !== key || (reloading && state.data === null),
    setData,
    reload,
  };
}
