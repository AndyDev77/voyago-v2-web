import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };

// Logo lu une seule fois (valeur indépendante de la requête)
const logoPromise = readFile(join(process.cwd(), "public/brand/parrot.png")).then((b) => `data:image/png;base64,${b.toString("base64")}`);
export const getLogo = () => logoPromise;

// Police de la marque, copiée dans assets/fonts (Satori lit le WOFF, pas le WOFF2)
const fontDir = join(process.cwd(), "assets/fonts");
const fontsPromise = Promise.all([
  readFile(join(fontDir, "space-grotesk-latin-400-normal.woff")),
  readFile(join(fontDir, "space-grotesk-latin-700-normal.woff")),
]).then(([regular, bold]) => [
  { name: "Space Grotesk", data: regular, weight: 400 as const, style: "normal" as const },
  { name: "Space Grotesk", data: bold, weight: 700 as const, style: "normal" as const },
]);

/** Options communes des ImageResponse : taille + police. */
export async function ogOptions() {
  return { ...OG_SIZE, fonts: await fontsPromise };
}

/** Calque plein cadre (Satori ne gère pas la propriété raccourcie `inset`). */
export const fill = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" } as const;

/** Satori ne lit ni WebP ni AVIF : on force du JPEG pour les photos Unsplash. */
export function ogSafeImage(url?: string | null) {
  if (!url) return null;
  if (url.includes("images.unsplash.com")) {
    const u = new URL(url);
    u.searchParams.delete("auto");
    u.searchParams.set("fm", "jpg");
    u.searchParams.set("w", "1200");
    return u.toString();
  }
  return /\.(jpe?g|png)(\?|$)/i.test(url) ? url : null;
}

/** Bandeau de marque commun aux images d'aperçu. */
export function BrandBadge({ logo }: { logo: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={logo} width={56} height={56} />
      <span style={{ fontSize: 34, fontWeight: 700, color: "#f2fbf9" }}>Voyago</span>
    </div>
  );
}
