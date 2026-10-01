// Services géo gratuits sans clé (Open-Meteo) — équivalent web de DestinationService / LiveWeatherService.

export interface Place {
  id: number;
  name: string;
  country: string;
  country_code: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  if (query.trim().length < 2) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=6&language=fr&format=json`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: Place[] };
  return data.results || [];
}

export interface Forecast {
  current: number;
  code: number;
  days: { date: string; max: number; min: number; code: number }[];
}

export async function fetchForecast(lat: number, lng: number, signal?: AbortSignal): Promise<Forecast | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`;
  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  const d = await res.json();
  return {
    current: Math.round(d.current?.temperature_2m ?? 0),
    code: d.current?.weather_code ?? 0,
    days: (d.daily?.time || []).map((t: string, i: number) => ({
      date: t,
      max: Math.round(d.daily.temperature_2m_max[i]),
      min: Math.round(d.daily.temperature_2m_min[i]),
      code: d.daily.weather_code[i],
    })),
  };
}

export function weatherEmoji(code: number) {
  if (code === 0) return "☀️";
  if (code <= 2) return "🌤️";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 80 && code <= 82) return "🌦️";
  if (code >= 85 && code <= 86) return "🌨️";
  if (code >= 95) return "⛈️";
  return "🌤️";
}

export function weatherLabel(code: number) {
  if (code === 0) return "Ciel dégagé";
  if (code <= 2) return "Partiellement nuageux";
  if (code === 3) return "Couvert";
  if (code === 45 || code === 48) return "Brouillard";
  if (code >= 51 && code <= 67) return "Pluie";
  if (code >= 71 && code <= 77) return "Neige";
  if (code >= 80 && code <= 82) return "Averses";
  if (code >= 95) return "Orages";
  return "Variable";
}

export const isRainy = (code: number) => (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;

/** Conseil vestimentaire selon la température ressentie et la sensibilité thermique. */
export function clothingTip(temp: number, thermal?: string | null, rainy?: boolean) {
  const shift = thermal === "cold" ? 4 : thermal === "warm" ? -4 : 0;
  const t = temp - shift;
  let tip: string;
  if (t < 5) tip = "Grosse doudoune, bonnet et gants indispensables.";
  else if (t < 12) tip = "Manteau chaud et une écharpe, superpose les couches.";
  else if (t < 18) tip = "Une veste légère ou un pull, idéal pour marcher.";
  else if (t < 25) tip = "T-shirt et une petite laine pour le soir.";
  else tip = "Tenue légère, chapeau et crème solaire !";
  return rainy ? `${tip} Prévois un parapluie ☔` : tip;
}
