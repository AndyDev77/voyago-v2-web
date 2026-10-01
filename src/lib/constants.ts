// Libellés et options repris de l'app mobile (configure_screen.dart, auth_user.dart, community_circle.dart)

export const PACES = [
  { id: "tranquille", label: "Tranquille", quote: "Rythme doux, visites contemplatives et pauses détente régulières." },
  { id: "equilibre", label: "Équilibré", quote: "Le savant dosage entre visites incontournables et moments de flânerie." },
  { id: "intensif", label: "Intensif", quote: "Un itinéraire dynamique pour explorer un maximum de merveilles sans temps mort." },
] as const;

export const TRANSPORTS = [
  { id: "marche", label: "Marche", emoji: "🚶" },
  { id: "velo", label: "Vélo", emoji: "🚲" },
  { id: "transport", label: "Transport", emoji: "🚌" },
  { id: "voiture", label: "Voiture", emoji: "🚗" },
  { id: "bateau", label: "Bateau", emoji: "⛵" },
] as const;

export const BUDGETS = [
  { id: "economique", label: "Économique", emoji: "💰" },
  { id: "moyen", label: "Moyen", emoji: "💳" },
  { id: "luxe", label: "Luxe", emoji: "💎" },
] as const;

export const THERMAL = [
  { id: "cold", label: "Frileux", en: "Runs Cold", emoji: "❄️", desc: "Tu as vite froid et préfères des couches en plus.", tint: "from-sky/25" },
  { id: "balanced", label: "Équilibré", en: "Balanced", emoji: "🧥", desc: "Tu es à l'aise dans la plupart des conditions.", tint: "from-primary/25" },
  { id: "warm", label: "Chaleureux", en: "Runs Warm", emoji: "☀️", desc: "Tu as vite chaud et préfères des vêtements légers.", tint: "from-orange/25" },
] as const;

export const GENDERS = [
  { id: "male", label: "Homme" },
  { id: "female", label: "Femme" },
  { id: "other", label: "Autre" },
  { id: "prefer_not_to_say", label: "Préfère ne pas dire" },
] as const;

export const AVATAR_EMOJIS = ["🦜", "🦁", "🐼", "🦊", "🐨", "🦋", "🐬", "🦅", "🐯", "🦄", "🐺", "🦩"];

const U = (id: string, w = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMAGES = {
  hero: U("photo-1488646953014-85cb44e25828", 2000),
  paris: U("photo-1502602898657-3e91760cbb34"),
  adventure: U("photo-1503899036084-c55cdd92da26"),
  culture: U("photo-1552832230-c0197dd311b5"),
  nature: U("photo-1523987355523-c7b5b0dd90a7"),
  food: U("photo-1555396273-367ea4eb4db5"),
  beach: U("photo-1507525428034-b723cf961d3e"),
};

// Visuels des cartes d'envies (swipe) — photo quand dispo, sinon dégradé + emoji
export const INTEREST_VISUALS: Record<string, { image?: string; gradient: string; tags: string[] }> = {
  culture: { image: IMAGES.culture, gradient: "from-amber-700 to-stone-900", tags: ["#Musées", "#Monuments", "#Histoire"] },
  gastronomie: { image: IMAGES.food, gradient: "from-orange-600 to-rose-900", tags: ["#StreetFood", "#Marchés", "#Local"] },
  nature: { image: IMAGES.nature, gradient: "from-emerald-600 to-emerald-950", tags: ["#Rando", "#Parcs", "#Paysages"] },
  plage: { image: IMAGES.beach, gradient: "from-cyan-500 to-blue-900", tags: ["#Plage", "#Snorkeling", "#Soleil"] },
  nightlife: { gradient: "from-fuchsia-600 to-indigo-950", tags: ["#Bars", "#Clubs", "#Concerts"] },
  shopping: { gradient: "from-pink-500 to-purple-900", tags: ["#Boutiques", "#Souvenirs", "#Créateurs"] },
  sport: { image: IMAGES.adventure, gradient: "from-lime-600 to-green-950", tags: ["#Aventure", "#Outdoor", "#Adrénaline"] },
  bien_etre: { gradient: "from-teal-400 to-teal-900", tags: ["#Spa", "#Yoga", "#Détente"] },
  art: { gradient: "from-violet-500 to-slate-900", tags: ["#Galeries", "#StreetArt", "#Design"] },
  famille: { gradient: "from-yellow-500 to-orange-900", tags: ["#Enfants", "#Parcs", "#Fun"] },
};

export const CIRCLE_CATEGORIES = [
  { id: "", label: "Tous", emoji: "🧭" },
  { id: "culture", label: "Culture & Histoire", emoji: "🏛️", cover: IMAGES.culture },
  { id: "adventure", label: "Aventure & Roadtrip", emoji: "⛩️", cover: IMAGES.adventure },
  { id: "nature", label: "Nature & Bivouac", emoji: "🌿", cover: IMAGES.nature },
  { id: "food", label: "Gastronomie", emoji: "🍷", cover: IMAGES.food },
  { id: "beach", label: "Plage & Soleil", emoji: "🏖️", cover: IMAGES.beach },
];

export function circleCategoryLabel(cat?: string) {
  const c = (cat || "").toLowerCase();
  const map: Record<string, string> = {
    culture: "🏛️ Culture & Histoire",
    adventure: "⛩️ Aventure & Roadtrip",
    nature: "🌿 Nature & Bivouac",
    food: "🍷 Gastronomie",
    gastronomie: "🍷 Gastronomie",
    beach: "🏖️ Plage & Soleil",
    plage: "🏖️ Plage & Soleil",
  };
  return map[c] || "🧭 Exploration";
}

export const BADGE_FALLBACK: Record<string, { title: string; emoji: string }> = {
  first_swipe: { title: "Premier Swipe", emoji: "👆" },
  first_trip: { title: "Premier Voyage", emoji: "✈️" },
  complete_profile: { title: "Profil complet", emoji: "👤" },
  select_interests: { title: "Envies définies", emoji: "🎯" },
  thermal_setup: { title: "Thermo-calibré", emoji: "🌡️" },
  globe_trotter: { title: "Globe-trotter", emoji: "🌍" },
  explorateur: { title: "Explorateur", emoji: "🗺️" },
  en_feu: { title: "En Feu", emoji: "🔥" },
  voyago_pro: { title: "Voyago Pro", emoji: "💎" },
};

export const LEVEL_TITLES = [
  { level: 1, min_xp: 0, title: "Explorateur" },
  { level: 2, min_xp: 100, title: "Voyageur" },
  { level: 3, min_xp: 200, title: "Aventurier" },
  { level: 5, min_xp: 400, title: "Globe-trotteur" },
  { level: 10, min_xp: 900, title: "Légende" },
];

export function levelTitle(xp: number) {
  return [...LEVEL_TITLES].reverse().find((l) => xp >= l.min_xp)?.title ?? "Explorateur";
}
