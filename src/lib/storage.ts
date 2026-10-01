// Stockage navigateur limité aux données non sensibles.
// Le jeton de session vit désormais dans un cookie httpOnly géré par le BFF (/bff).
const KEY_GUEST_ID = "voyago_guest_user_id";

// Clés de l'ancienne version (jeton en localStorage) à purger
const LEGACY_KEYS = ["voyago_session_token", "voyago_user_id", "voyago_tenant_id", "voyago_auth_user"];

function safe<T>(fn: () => T, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export const storage = {
  getGuestId: () => safe(() => window.localStorage.getItem(KEY_GUEST_ID), null),
  setGuestId: (id: string) => safe(() => window.localStorage.setItem(KEY_GUEST_ID, id), undefined),
  purgeLegacySession: () => safe(() => LEGACY_KEYS.forEach((k) => window.localStorage.removeItem(k)), undefined),
};
