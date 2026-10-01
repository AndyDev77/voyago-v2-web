/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { ImageResponse } from "next/og";
import { getTrip } from "@/lib/server/data";
import { BrandBadge, fill, getLogo, ogOptions, ogSafeImage, OG_SIZE } from "@/lib/server/og";
import { IMAGES } from "@/lib/constants";
import { poisForDay, tripCover, tripTitle } from "@/lib/utils";

export const alt = "Itinéraire de voyage Voyago";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [trip, logo] = await Promise.all([getTrip(id), getLogo()]);

  const cover = ogSafeImage(trip ? tripCover(trip) : null) || ogSafeImage(IMAGES.hero)!;
  const days = trip?.duration_days || 1;
  const stops = trip?.pois?.length || 0;
  const highlights = trip ? poisForDay(trip, 1).slice(0, 3).map((p) => p.name) : [];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0c1a18", fontFamily: "Space Grotesk" }}>
        <img src={cover} width={1200} height={630} style={{ ...fill, objectFit: "cover" }} />
        <div
          style={{
            ...fill,
            display: "flex",
            background: "linear-gradient(90deg, rgba(8,18,16,0.96) 0%, rgba(8,18,16,0.8) 55%, rgba(8,18,16,0.2) 100%)",
          }}
        />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, width: "100%" }}>
          <BrandBadge logo={logo} />
          <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 760 }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: "#0df2cc", letterSpacing: 3, textTransform: "uppercase" }}>Itinéraire généré par l&apos;IA</span>
            <span style={{ fontSize: 88, fontWeight: 700, color: "#f2fbf9", lineHeight: 1 }}>{trip ? tripTitle(trip) : "Voyage"}</span>
            <div style={{ display: "flex", gap: 16 }}>
              {[`${days} jour${days > 1 ? "s" : ""}`, `${stops} étapes`].map((t) => (
                <span key={t} style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#062420", background: "#0df2cc", borderRadius: 999, padding: "8px 24px" }}>
                  {t}
                </span>
              ))}
            </div>
            {highlights.length > 0 && <span style={{ fontSize: 28, color: "#c9dcd8" }}>{highlights.join(" · ")}</span>}
          </div>
          <span style={{ fontSize: 24, color: "#ffc800", fontWeight: 700 }}>Crée le tien gratuitement sur Voyago</span>
        </div>
      </div>
    ),
    await ogOptions(),
  );
}
