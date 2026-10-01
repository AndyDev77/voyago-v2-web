# 🦜 Voyago — Web (Next.js)

Version web de **Voyago**, le planificateur de voyage IA gamifié. Elle reprend les écrans et la logique de l'app mobile Flutter (`voyago-v2-frontend`), consomme la même API NestJS (`voyago-v2-backend`) et s'inspire des maquettes Stitch (`stitch_user_profile_gamification_hub`).

## Stack

- **Next.js 16** (App Router) · React 19 · TypeScript
- **Tailwind CSS v4** (tokens dans `src/app/globals.css`)
- **Leaflet / react-leaflet** pour la carte des itinéraires (tuiles OpenStreetMap)
- **Open-Meteo** (sans clé) pour l'autocomplétion des destinations et la météo du coach IA
- `lucide-react` pour les icônes

## Démarrage

```bash
npm install
cp .env.example .env.local   # BACKEND_URL + NEXT_PUBLIC_SITE_URL
npm run dev
```

Le backend NestJS doit tourner sur `http://localhost:3333` (`npm run start:dev` dans `voyago-v2-backend`).

> **Stripe** : le backend redirige après paiement vers `APP_BASE_URL/pricing?session_id=…`.
> Mets `APP_BASE_URL=http://localhost:3000` (l'URL du site web) dans le `.env` du backend pour que le retour de paiement arrive sur ce site.

## Écrans

| Route | Équivalent mobile | Description |
|---|---|---|
| `/` | `welcome_screen` | Landing (maquette Stitch « landing page ») |
| `/login`, `/signup`, `/forgot-password` | `auth_screen`, `forgot_password_screen` | Email + mot de passe, mode invité, reset par code |
| `/onboarding` | `onboarding_screen` | Date de naissance, genre, sensibilité thermique, écran XP |
| `/dashboard` | `home_screen` | Profil gamifié, stats, mes voyages, XP quotidien |
| `/swipe` | `swipe_screen` | Swipe des envies (drag, boutons, flèches ← →) |
| `/configure` | `configure_screen` | Destination, dates, rythme, transports, budget + coach IA météo |
| `/trips/[id]` | `itinerary_screen` | Carte + timeline jour par jour, météo, astuces, partage en tribu |
| `/community`, `/community/circles/[id]` | `community_screen`, `circle_detail_screen` | Tribus, fil public, posts, likes |
| `/rewards` | `xp_rewards_screen` | Niveaux, actions XP, Hall of Fame des badges |
| `/profile` | `profile_screen` | Édition du profil, photo, ADN du voyageur |
| `/pricing`, `/pricing/success` | `pricing_screen` | Offres Pro et retour Stripe |
| `/user/[id]` | `public_user_screen` | Profil public |

## Sécurité de la session (BFF)

Le navigateur ne voit jamais le jeton du backend :

1. Le client appelle `/bff/...` (même origine) au lieu de `BACKEND_URL/api/...`.
2. La route `src/app/bff/[...path]/route.ts` relaie vers le backend en ajoutant `Authorization` et `x-tenant-id` lus dans des **cookies httpOnly**.
3. À la connexion, le `session_token` est retiré de la réponse et rangé en cookie ; à la déconnexion ou sur 401, les cookies sont effacés.
4. `src/proxy.ts` redirige les pages privées (`/dashboard`, `/swipe`…) vers `/login` ou `/onboarding` avant tout rendu.
5. Le layout racine résout l'utilisateur côté serveur : aucun écran de chargement au démarrage.

## SEO & partage

- Pages publiques rendues côté serveur avec métadonnées : `/trips/[id]`, `/user/[id]`, `/community`, `/community/circles/[id]`, `/pricing`, `/`.
- Images d'aperçu générées à la volée (`opengraph-image.tsx`) : carte « Paris en 3 jours » pour chaque voyage partagé sur WhatsApp, Instagram, X…
- `sitemap.xml` (voyages et tribus publics) et `robots.txt` (espaces privés exclus).
- Les polices des aperçus sont dans `assets/fonts` (Space Grotesk, WOFF).

## Architecture

```
src/
├── proxy.ts        # Redirections optimistes des pages privées (cookies)
├── app/            # Routes (App Router) — page.tsx serveur + *View.tsx client
│   └── bff/        # Proxy authentifié vers le backend
├── components/     # AppShell (nav), TripMap, TripCard, UI kit…
└── lib/
    ├── server/     # session (cookies), data (fetch serveur dédupliqué), og (aperçus)
    ├── api.ts      # Client REST → /bff
    ├── auth.tsx    # Contexte d'auth (utilisateur initial fourni par le serveur)
    ├── hooks.ts    # useGameProfile, useAsync, awardXp
    ├── geo.ts      # Open-Meteo : géocodage, prévisions, conseils tenue
    ├── constants.ts / types.ts / utils.ts
```

L'anti-triche XP reste côté backend : le web appelle simplement `/api/profile/award-xp`.
