import { ParrotSvg } from "./ParrotSvg";

/**
 * Le perroquet Voyago en plein vol : il plane en ondulant pendant que nuages,
 * collines et traînée défilent derrière lui (effet parallaxe). 100 % CSS.
 */
export function FlyingParrot() {
  return (
    <div className="flight-sky relative mx-auto h-48 w-full max-w-sm overflow-hidden rounded-[2rem] border border-line">
      {/* Soleil */}
      <div className="absolute right-8 top-6 size-10 rounded-full bg-gold/80 blur-[2px] shadow-[0_0_40px_rgba(255,200,0,0.6)]" />

      {/* Nuages (3 plans de vitesse différente) */}
      <span className="flight-cloud" style={{ top: "18%", width: 70, animationDuration: "5s", animationDelay: "-1s" }} />
      <span className="flight-cloud" style={{ top: "42%", width: 110, animationDuration: "7s", animationDelay: "-4s", opacity: 0.5 }} />
      <span className="flight-cloud" style={{ top: "66%", width: 54, animationDuration: "3.6s", animationDelay: "-2.2s" }} />
      <span className="flight-cloud" style={{ top: "28%", width: 90, animationDuration: "6s", animationDelay: "-3s", opacity: 0.35 }} />

      {/* Collines lointaines */}
      <svg className="flight-hills absolute bottom-0 left-0 h-12 w-[200%]" viewBox="0 0 800 50" preserveAspectRatio="none" aria-hidden>
        <path d="M0 50 Q50 10 100 30 T200 25 T300 32 T400 50 Q450 10 500 30 T600 25 T700 32 T800 50 Z" fill="rgba(13,242,204,0.18)" />
      </svg>

      {/* Le perroquet : vol ondulant + vrais battements d'ailes (SVG) */}
      <div className="flight-bob absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        {/* Traînée de vitesse */}
        <div className="absolute left-[80%] top-[48%] flex -translate-y-1/2 flex-col gap-2">
          <span className="flight-streak w-12" style={{ animationDelay: "0s" }} />
          <span className="flight-streak w-16" style={{ animationDelay: "0.2s" }} />
          <span className="flight-streak w-10" style={{ animationDelay: "0.4s" }} />
        </div>
        <ParrotSvg className="relative h-32 w-40 drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)]" />
      </div>
    </div>
  );
}
