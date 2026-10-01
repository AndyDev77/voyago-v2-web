import { useId } from "react";

/**
 * Perroquet Voyago en vol (vu de profil, tourné vers la gauche), dessiné en SVG
 * pour animer les ailes séparément. Couleurs reprises du logo.
 * Animations : .parrot-wing-front / .parrot-wing-back / .parrot-lift (globals.css).
 */
export function ParrotSvg({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3ccf5a" />
          <stop offset="1" stopColor="#1f9a3e" />
        </linearGradient>
        <linearGradient id={`${id}-wing`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d4e64a" />
          <stop offset="1" stopColor="#8cc63f" />
        </linearGradient>
        <clipPath id={`${id}-head`}>
          <circle cx="38" cy="43" r="13" />
        </clipPath>
      </defs>

      <g className="parrot-lift">
        {/* Aile arrière (plus sombre, derrière le corps) */}
        <path
          className="parrot-wing-back"
          d="M56 46 C54 30 62 14 76 6 L88 4 L83 11 L92 12 L84 19 L90 22 L78 30 C76 38 72 43 70 46 Z"
          fill="#168a35"
        />

        {/* Queue */}
        <path d="M84 56 L113 50 L108 56 L116 60 L105 62 L111 69 L86 65 Z" fill="#1c8a3b" />
        <path d="M88 59 L110 58 L104 62 Z" fill="#2fb3a0" opacity="0.7" />

        {/* Corps + ventre */}
        <ellipse cx="64" cy="56" rx="26" ry="15" transform="rotate(-8 64 56)" fill={`url(#${id}-body)`} />
        <ellipse cx="58" cy="62" rx="16" ry="7.5" fill="#8fe063" opacity="0.85" />

        {/* Pattes repliées */}
        <path d="M60 69 l-4 6 M67 69 l-2 6" stroke="#f4a51c" strokeWidth="3" strokeLinecap="round" />

        {/* Tête avec calotte rouge */}
        <g clipPath={`url(#${id}-head)`}>
          <circle cx="38" cy="43" r="13" fill={`url(#${id}-body)`} />
          <ellipse cx="38" cy="31" rx="16" ry="9.5" fill="#e8322f" />
        </g>
        <ellipse cx="29.5" cy="45" rx="3.6" ry="3" fill="#f07aa0" />

        {/* Bec */}
        <path d="M28 40 C22 38 17 42 18 49 C21 46 24 45 28.5 46 Z" fill="#ffc21a" />
        <path d="M27.5 46 C24.5 47 22.5 49 22.5 51 C25.5 50 27.5 49 29.5 48 Z" fill="#e09a10" />

        {/* Œil */}
        <circle cx="36" cy="41" r="4.2" fill="#ffe9c7" stroke="#e8a87c" strokeWidth="0.8" />
        <circle cx="35.3" cy="41" r="2.2" fill="#161616" />
        <circle cx="34.6" cy="40.2" r="0.8" fill="#fff" />

        {/* Aile avant (citron, devant le corps) */}
        <path
          className="parrot-wing-front"
          d="M52 48 C50 34 58 18 72 10 L84 8 L79 15 L88 16 L80 23 L87 26 L74 34 C72 40 70 45 68 48 Z"
          fill={`url(#${id}-wing)`}
          stroke="#7fb532"
          strokeWidth="0.8"
        />
      </g>
    </svg>
  );
}
