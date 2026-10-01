// Types alignés sur les réponses du backend NestJS (voyago-v2-backend)
// et sur les modèles Dart de l'app mobile (voyago-v2-frontend/lib/models).

export type ThermalSensitivity = "cold" | "balanced" | "warm";
export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export interface AuthUser {
  user_id: string;
  auth_provider?: string;
  name: string;
  email?: string | null;
  picture?: string | null;
  pseudo?: string | null;
  avatar_emoji?: string | null;
  date_of_birth?: string | null;
  gender?: Gender | null;
  thermal_sensitivity?: ThermalSensitivity | null;
  onboarding_completed?: boolean;
  country?: string | null;
  city?: string | null;
  is_pro?: boolean;
  pro_tier?: string | null;
  pro_expires_at?: string | null;
}

/** Réponse d'auth telle que renvoyée par le BFF (le session_token reste côté serveur, en cookie httpOnly). */
export interface AuthResponse {
  user_id: string;
  tenant_id: string;
  user: AuthUser;
}

export interface POI {
  name: string;
  description: string;
  category: string;
  image_query?: string;
  lat: number;
  lng: number;
  day: number;
  order: number;
  duration_minutes?: number;
  image_url?: string | null;
  rating?: number;
  reviews_count?: number;
  insider_tip?: string | null;
}

export interface DayWeather {
  date: string;
  icon: string;
  summary: string;
  weather_code: number;
  temp_max: number;
  temp_min: number;
}

export interface PublicAuthor {
  user_id: string;
  name: string;
  pseudo?: string | null;
  avatar_emoji?: string | null;
  picture?: string | null;
  is_pro?: boolean;
}

export interface Trip {
  id: string;
  _id?: string;
  user_id: string;
  destination: string;
  city?: string | null;
  country?: string | null;
  country_code?: string | null;
  cover_image_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  pace: string;
  budget: string;
  duration_days: number;
  transports: string[];
  interests: string[];
  pois: POI[];
  weather: DayWeather[];
  is_public?: boolean;
  likes?: number;
  created_at?: string;
  author?: PublicAuthor | null;
}

export interface UserProfile {
  user_id: string;
  name: string;
  pseudo?: string | null;
  avatar_emoji?: string | null;
  country?: string | null;
  city?: string | null;
  is_pro?: boolean;
  pro_tier?: string | null;
  xp: number;
  level: number;
  streak: number;
  badges: string[];
  trips_count: number;
  last_active?: string;
}

export interface Interest {
  id: string;
  title: string;
  emoji: string;
  description: string;
  image_url?: string | null;
}

export interface XpAction {
  action: string;
  xp: number;
  emoji: string;
  icon_name?: string;
  label: string;
  completed: boolean;
  progress_label?: string | null;
}

export interface XpLevel {
  level: number;
  min_xp: number;
  title: string;
  reward: string;
  is_reached?: boolean;
  is_current?: boolean;
  status?: "current" | "reached" | "locked";
}

export interface XpRewards {
  total_xp: number;
  level: number;
  current_level_xp: number;
  next_level_xp: number;
  xp_to_next_level: number;
  progress_ratio: number;
  current_level_title: string;
  next_level_title: string;
  actions: XpAction[];
  levels: XpLevel[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  xp_reward: number;
}

export interface ProTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: "month" | "year" | "lifetime";
  benefits: string[];
  best_offer?: boolean;
}

export interface MemberPreview {
  user_id: string;
  role: string;
  name: string;
  pseudo?: string | null;
  avatar_emoji?: string | null;
  picture?: string | null;
  is_pro?: boolean;
}

export interface CommunityCircle {
  id: string;
  _id?: string;
  name: string;
  slug?: string;
  description?: string;
  avatar_emoji?: string;
  cover_image_url?: string;
  category?: string;
  destination_city?: string | null;
  destination_country?: string | null;
  creator_id?: string;
  members_count?: number;
  trips_count?: number;
  posts_count?: number;
  is_public?: boolean;
  tags?: string[];
  is_member?: boolean;
  my_role?: string | null;
  creator?: PublicAuthor | null;
  members_sample?: MemberPreview[];
  created_at?: string;
}

export interface CommunityPost {
  id: string;
  _id?: string;
  circle_id: string;
  user_id: string;
  content: string;
  trip_id?: string | null;
  poi_title?: string | null;
  poi_city?: string | null;
  poi_country?: string | null;
  image_urls?: string[];
  likes_count?: number;
  liked_by?: string[];
  created_at?: string;
  author?: PublicAuthor | null;
  trip?: Trip | null;
}

export interface PublicUserProfile {
  user: PublicAuthor & { created_at?: string };
  profile: {
    xp: number;
    level: number;
    streak: number;
    badges: string[];
    trips_count: number;
  } | null;
  trips: Trip[];
}
