"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi, setOnAuthExpired } from "./api";
import { storage } from "./storage";
import type { AuthResponse, AuthUser } from "./types";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const clear = useCallback(() => {
    storage.clearSession();
    setUserState(null);
    setToken(null);
  }, []);

  const applySession = useCallback((res: AuthResponse) => {
    storage.setSession(res.session_token, res.user_id, res.tenant_id, res.user);
    setToken(res.session_token);
    setUserState(res.user);
    return res.user;
  }, []);

  const setUser = useCallback((u: AuthUser) => {
    storage.setUser(u);
    setUserState(u);
  }, []);

  const refresh = useCallback(async () => {
    if (!storage.getToken()) return;
    try {
      setUser(await authApi.me());
    } catch {
      // 401 géré par onAuthExpired ; autres erreurs : on garde le cache
    }
  }, [setUser]);

  // Chargement de session au démarrage (équivalent AuthNotifier.loadSession)
  useEffect(() => {
    setOnAuthExpired(clear);
    const t = storage.getToken();
    const cached = storage.getUser();
    if (t && cached) {
      setToken(t);
      setUserState(cached);
      authApi.me().then(setUser).catch(() => {});
    }
    if (!storage.getGuestId()) storage.setGuestId(newGuestId());
    setReady(true);
    return () => setOnAuthExpired(null);
  }, [clear, setUser]);

  const value = useMemo<AuthContextValue>(() => {
    const isLoggedIn = !!user && !!token;
    return {
      user,
      token,
      ready,
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
        } catch {
          // session déjà expirée côté serveur
        }
        clear();
      },
      updateProfile: async (dto) => {
        const updated = await authApi.updateMe(dto);
        setUser(updated);
        return updated;
      },
      setUser,
      refresh,
    };
  }, [user, token, ready, applySession, clear, setUser, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}
