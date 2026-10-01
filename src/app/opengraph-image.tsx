/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { ImageResponse } from "next/og";
import { BrandBadge, fill, getLogo, ogOptions, ogSafeImage, OG_SIZE } from "@/lib/server/og";
import { IMAGES } from "@/lib/constants";

export const alt = "Voyago — Voyage plus malin, joue plus fort";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const logo = await getLogo();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0c1a18", fontFamily: "Space Grotesk" }}>
        <img src={ogSafeImage(IMAGES.hero)!} width={1200} height={630} style={{ ...fill, objectFit: "cover" }} />
        <div style={{ ...fill, display: "flex", background: "linear-gradient(180deg, rgba(12,26,24,0.55) 0%, rgba(12,26,24,0.95) 100%)" }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", gap: 28 }}>
          <BrandBadge logo={logo} />
          <span style={{ fontSize: 84, fontWeight: 700, color: "#f2fbf9" }}>Voyage plus malin,</span>
          <span style={{ fontSize: 84, fontWeight: 700, color: "#0df2cc", marginTop: -28 }}>joue plus fort.</span>
          <span style={{ fontSize: 30, color: "#c9dcd8" }}>Itinéraires IA · Météo · XP & badges</span>
        </div>
      </div>
    ),
    await ogOptions(),
  );
}
