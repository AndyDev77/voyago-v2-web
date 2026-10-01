"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi, setOnAuthExpired } from "./api";
import { storage } from "./storage";
import type { AuthResponse, AuthUser } from "./types";

interface AuthContextValue {
  user: AuthUser | null;
  /** Toujours vrai : la session est résolue côté serveur avant le premier rendu. */
  ready: boolean;
  isLoggedIn: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (dto: Parameters<typeof authApi.signup>[0]) => Promise<AuthUser>;
  continueAsGuest: () => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateProfile: (dto: Partial<AuthUser>) => Promise<AuthUser>;
  setUser: (u: AuthUser) => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function newGuestId() {
  const uuid = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}${Math.random()}`;
  return `guest_${uuid}`;
}

/**
 * L'utilisateur initial est lu côté serveur (cookie httpOnly → /api/auth/me) dans le layout racine :
 * pas de jeton dans le navigateur, pas d'écran de chargement au démarrage.
 */
export function AuthProvider({ children, initialUser }: { children: React.ReactNode; initialUser: AuthUser | null }) {
  const [user, setUserState] = useState<AuthUser | null>(initialUser);

  const setUser = useCallback((u: AuthUser) => setUserState(u), []);
  const applySession = useCallback((res: AuthResponse) => {
    setUserState(res.user);
    return res.user;
  }, []);

  useEffect(() => {
    // Session expirée côté backend : le BFF a déjà effacé les cookies
    setOnAuthExpired(() => setUserState(null));
    storage.purgeLegacySession();
    if (!storage.getGuestId()) storage.setGuestId(newGuestId());
    return () => setOnAuthExpired(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setUserState(await authApi.me());
    } catch {
      // 401 géré par onAuthExpired
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const isLoggedIn = !!user;
    return {
      user,
      ready: true,
      isLoggedIn,
      isGuest: isLoggedIn && (user?.auth_provider === "guest" || user?.user_id.startsWith("guest_") === true),
      login: async (email, password) => applySession(await authApi.login(email, password)),
      signup: async (dto) => {
        const guestId = user?.user_id.startsWith("guest_") ? user.user_id : undefined;
        return applySession(await authApi.signup({ ...dto, guest_user_id: guestId }));
      },
      continueAsGuest: async () => {
        let gid = storage.getGuestId();
        if (!gid) {
          gid = newGuestId();
          storage.setGuestId(gid);
        }
        return applySession(await authApi.guest(gid));
      },
      logout: async () => {
        try {
          await authApi.logout();
        } finally {
          // Navigation complète : le layout serveur se re-rend sans session (pas de redirection parasite vers /login)
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- rechargement complet voulu
          window.location.assign("/");
        }
      },
      updateProfile: async (dto) => {
        const updated = await authApi.updateMe(dto);
        setUserState(updated);
        return updated;
      },
      setUser,
      refresh,
    };
  }, [user, applySession, setUser, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}
