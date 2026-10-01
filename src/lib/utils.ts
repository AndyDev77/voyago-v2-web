import clsx, { type ClassValue } from "clsx";
import type { POI, Trip } from "./types";

export const cn = (...v: ClassValue[]) => clsx(v);

export function displayName(u?: { pseudo?: string | null; name?: string | null } | null) {
  if (!u) return "Voyageur";
  return u.pseudo && u.pseudo.trim() ? u.pseudo : u.name || "Voyageur";
}

export function poisForDay(trip: Trip, day: number): POI[] {
  return (trip.pois || []).filter((p) => p.day === day).sort((a, b) => a.order - b.order);
}

export function tripCover(trip: Trip): string | null {
  if (trip.cover_image_url) return trip.cover_image_url;
  return trip.pois?.find((p) => p.image_url)?.image_url ?? null;
}

export function tripTitle(trip: Trip) {
  return trip.city || trip.destination?.split(",")[0] || "Voyage";
}

export function formatDate(iso?: string | null, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", opts);
}

export function timeAgo(iso?: string | null) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 30) return `il y a ${Math.floor(diff / 86400)} j`;
  return formatDate(iso);
}

export function formatDuration(min?: number) {
  if (!min) return "";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m}` : `${h} h`;
}

/** Heure de départ estimée de chaque POI à partir de 9h, en enchaînant les durées + 20 min de trajet. */
export function scheduleDay(pois: POI[]) {
  let t = 9 * 60;
  return pois.map((p) => {
    const start = t;
    t += (p.duration_minutes || 60) + 20;
    const hh = String(Math.floor(start / 60)).padStart(2, "0");
    const mm = String(start % 60).padStart(2, "0");
    return { poi: p, time: `${hh}:${mm}` };
  });
}

/** Distance à vol d'oiseau en km (Haversine). */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function flagEmoji(code?: string | null) {
  if (!code || code.length !== 2) return "🌍";
  return String.fromCodePoint(...code.toUpperCase().split("").map((c) => 127397 + c.charCodeAt(0)));
}

export function categoryEmoji(cat?: string) {
  const c = (cat || "").toLowerCase();
  if (/(food|restau|gastro|café|cafe|bar|march)/.test(c)) return "🍽️";
  if (/(mus|culture|hist|monument|art)/.test(c)) return "🏛️";
  if (/(nature|parc|park|jardin|rando)/.test(c)) return "🌿";
  if (/(plage|beach|mer)/.test(c)) return "🏖️";
  if (/(shop|boutique)/.test(c)) return "🛍️";
  if (/(night|club|soir)/.test(c)) return "🌙";
  if (/(view|vue|panor)/.test(c)) return "🌄";
  return "📍";
}
