/* eslint-disable @next/next/no-img-element */
"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, ZoomControl } from "react-leaflet";
import { Clock, ListOrdered, Navigation, Sparkles, Star } from "lucide-react";
import type { POI } from "@/lib/types";
import { categoryEmoji, formatDuration } from "@/lib/utils";

function numberedIcon(n: number, active: boolean) {
  return L.divIcon({
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
    html: `<div style="width:36px;height:36px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-weight:700;font-family:inherit;
      background:${active ? "#ffc800" : "#0df2cc"};color:#062420;border:3px solid #0c1a18;
      box-shadow:0 0 ${active ? 22 : 12}px ${active ? "rgba(255,200,0,.8)" : "rgba(13,242,204,.6)"};transform:scale(${active ? 1.2 : 1});transition:transform .2s">${n}</div>`,
  });
}

function FitBounds({ points, focus }: { points: [number, number][]; focus: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (focus) {
      // Le marqueur est placé sous le centre pour laisser la place à sa fiche (popup) au-dessus
      const zoom = Math.max(map.getZoom(), 15);
      const lift = Math.min(190, map.getSize().y * 0.28);
      const target = map.unproject(map.project(focus, zoom).subtract([0, lift]), zoom);
      map.flyTo(target, zoom, { duration: 0.8 });
      return;
    }
    if (points.length === 1) map.setView(points[0], 14);
    else if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [60, 60] });
  }, [map, points, focus]);
  return null;
}

/** Fiche complète d'une étape, même contenu que la carte de la timeline. */
function PoiPopup({ poi, n, time, onShowInList }: { poi: POI; n: number; time?: string; onShowInList: () => void }) {
  const [imgOk, setImgOk] = useState(true);
  const reviews = poi.reviews_count ? (poi.reviews_count > 999 ? `${(poi.reviews_count / 1000).toFixed(1)}k` : String(poi.reviews_count)) : null;

  return (
    <div className="w-[280px] font-sans text-ink">
      <div className="relative h-28 overflow-hidden rounded-t-xl bg-surface-2">
        {poi.image_url && imgOk ? (
          <img src={poi.image_url} alt="" className="size-full object-cover" onError={() => setImgOk(false)} />
        ) : (
          <div className="flex size-full items-center justify-center text-5xl">{categoryEmoji(poi.category)}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-solid via-transparent to-transparent" />
        <span className="absolute left-3 top-3 flex size-7 items-center justify-center rounded-full bg-gold text-xs font-bold text-[#2a1f00]">{n}</span>
        {time && <span className="absolute left-12 top-3.5 rounded-lg bg-bg/80 px-2 py-0.5 text-xs font-bold backdrop-blur">{time}</span>}
      </div>

      <div className="flex flex-col gap-1.5 p-3.5">
        <p className="text-xs text-muted">
          {categoryEmoji(poi.category)} {poi.category}
        </p>
        <h3 className="text-base font-bold leading-tight">{poi.name}</h3>
        <p className="flex items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Star className="size-3.5 fill-gold text-gold" /> {(poi.rating ?? 4.7).toFixed(1)}
            {reviews ? ` (${reviews})` : ""}
          </span>
          {poi.duration_minutes ? (
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" /> {formatDuration(poi.duration_minutes)}
            </span>
          ) : null}
        </p>
        {poi.description && <p className="line-clamp-3 text-[13px] leading-snug text-ink/85">{poi.description}</p>}
        {poi.insider_tip && (
          <p className="flex gap-2 rounded-lg bg-primary/10 px-2.5 py-2 text-xs leading-snug text-primary">
            <Sparkles className="mt-0.5 size-3.5 shrink-0" /> {poi.insider_tip}
          </p>
        )}
        <div className="mt-1 flex gap-2">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-2 py-2 text-xs font-bold !text-[#062420] hover:bg-primary-dark"
          >
            <Navigation className="size-3.5" /> Y aller
          </a>
          <button
            onClick={onShowInList}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2 py-2 text-xs font-bold hover:border-primary hover:text-primary cursor-pointer"
          >
            <ListOrdered className="size-3.5" /> Voir l&apos;étape
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TripMap({
  pois,
  times,
  activeIndex,
  onSelect,
  onShowInList,
}: {
  pois: POI[];
  /** Heure de passage estimée de chaque étape (même ordre que pois). */
  times?: string[];
  activeIndex: number | null;
  onSelect: (i: number) => void;
  onShowInList?: (i: number) => void;
}) {
  const valid = useMemo(() => pois.map((p, i) => ({ p, i })).filter(({ p }) => p.lat && p.lng), [pois]);
  const points = useMemo<[number, number][]>(() => valid.map(({ p }) => [p.lat, p.lng]), [valid]);
  const focus = activeIndex !== null && pois[activeIndex]?.lat ? ([pois[activeIndex].lat, pois[activeIndex].lng] as [number, number]) : null;
  const center: [number, number] = points[0] || [48.8566, 2.3522];
  const markers = useRef(new Map<number, L.Marker>());

  // Étape choisie depuis la timeline : on ouvre aussi sa fiche sur la carte
  useEffect(() => {
    if (activeIndex === null) return;
    const m = markers.current.get(activeIndex);
    if (m && !m.isPopupOpen()) m.openPopup();
  }, [activeIndex]);

  return (
    <MapContainer center={center} zoom={13} className="size-full voyago-map" zoomControl={false} scrollWheelZoom>
      {/* Tuiles OSM gratuites, assombries via CSS (.voyago-map .leaflet-tile-pane) */}
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ZoomControl position="bottomright" />
      {points.length > 1 && <Polyline positions={points} pathOptions={{ color: "#0df2cc", weight: 3, opacity: 0.7, dashArray: "8 8" }} />}
      {valid.map(({ p, i }, n) => (
        <Marker
          key={`${p.name}-${i}`}
          ref={(m) => {
            if (m) markers.current.set(i, m);
            else markers.current.delete(i);
          }}
          position={[p.lat, p.lng]}
          icon={numberedIcon(n + 1, activeIndex === i)}
          eventHandlers={{ click: () => onSelect(i) }}
        >
          <Popup className="voyago-popup" minWidth={280} maxWidth={280} autoPanPadding={[40, 40]}>
            <PoiPopup poi={p} n={n + 1} time={times?.[i]} onShowInList={() => onShowInList?.(i)} />
          </Popup>
        </Marker>
      ))}
      <FitBounds points={points} focus={focus} />
    </MapContainer>
  );
}
