import type { AuthUser } from "./types";

// Équivalent web de SecureStorageService (mobile) — clés identiques.
const KEY_TOKEN = "voyago_session_token";
const KEY_USER_ID = "voyago_user_id";
const KEY_TENANT_ID = "voyago_tenant_id";
const KEY_AUTH_USER = "voyago_auth_user";
const KEY_GUEST_ID = "voyago_guest_user_id";
export const DEFAULT_TENANT_ID = "default";

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // stockage indisponible (navigation privée stricte) : on ignore
  }
}

export const storage = {
  getToken: () => read(KEY_TOKEN),
  getUserId: () => read(KEY_USER_ID),
  getTenantId: () => read(KEY_TENANT_ID) || DEFAULT_TENANT_ID,
  getGuestId: () => read(KEY_GUEST_ID),
  setGuestId: (id: string) => write(KEY_GUEST_ID, id),

  getUser(): AuthUser | null {
    const raw = read(KEY_AUTH_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  setSession(token: string, userId: string, tenantId: string, user: AuthUser) {
    write(KEY_TOKEN, token);
    write(KEY_USER_ID, userId);
    write(KEY_TENANT_ID, tenantId || userId);
    write(KEY_AUTH_USER, JSON.stringify(user));
  },

  setUser(user: AuthUser) {
    write(KEY_AUTH_USER, JSON.stringify(user));
  },

  clearSession() {
    write(KEY_TOKEN, null);
    write(KEY_USER_ID, null);
    write(KEY_TENANT_ID, null);
    write(KEY_AUTH_USER, null);
  },
};
