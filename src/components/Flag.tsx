/* eslint-disable @next/next/no-img-element */

/** Drapeau en image (les emojis drapeaux ne s'affichent pas sous Windows). */
export function Flag({ code, className = "h-[0.8em]" }: { code?: string | null; className?: string }) {
  if (!code || code.length !== 2) return <span className={className}>🌍</span>;
  const c = code.toLowerCase();
  return (
    <img
      src={`https://flagcdn.com/w40/${c}.png`}
      srcSet={`https://flagcdn.com/w80/${c}.png 2x`}
      alt={code.toUpperCase()}
      className={`inline-block w-auto rounded-[3px] align-[-0.05em] ${className}`}
    />
  );
}
