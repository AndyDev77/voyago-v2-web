"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import type { POI } from "@/lib/types";

function numberedIcon(n: number, active: boolean) {
  return L.divIcon({
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `<div style="width:36px;height:36px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-weight:700;font-family:inherit;
      background:${active ? "#ffc800" : "#0df2cc"};color:#062420;border:3px solid #0c1a18;
      box-shadow:0 0 ${active ? 22 : 12}px ${active ? "rgba(255,200,0,.8)" : "rgba(13,242,204,.6)"};transform:scale(${active ? 1.2 : 1});transition:transform .2s">${n}</div>`,
  });
}

function FitBounds({ points, focus }: { points: [number, number][]; focus: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (focus) {
      map.flyTo(focus, Math.max(map.getZoom(), 15), { duration: 0.8 });
      return;
    }
    if (points.length === 1) map.setView(points[0], 14);
    else if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [60, 60] });
  }, [map, points, focus]);
  return null;
}

export default function TripMap({
  pois,
  activeIndex,
  onSelect,
}: {
  pois: POI[];
  activeIndex: number | null;
  onSelect: (i: number) => void;
}) {
  const valid = useMemo(() => pois.map((p, i) => ({ p, i })).filter(({ p }) => p.lat && p.lng), [pois]);
  const points = useMemo<[number, number][]>(() => valid.map(({ p }) => [p.lat, p.lng]), [valid]);
  const focus = activeIndex !== null && pois[activeIndex]?.lat ? ([pois[activeIndex].lat, pois[activeIndex].lng] as [number, number]) : null;
  const center: [number, number] = points[0] || [48.8566, 2.3522];

  return (
    <MapContainer center={center} zoom={13} className="size-full" zoomControl scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {points.length > 1 && <Polyline positions={points} pathOptions={{ color: "#0df2cc", weight: 3, opacity: 0.7, dashArray: "8 8" }} />}
      {valid.map(({ p, i }, n) => (
        <Marker key={`${p.name}-${i}`} position={[p.lat, p.lng]} icon={numberedIcon(n + 1, activeIndex === i)} eventHandlers={{ click: () => onSelect(i) }}>
          <Popup>
            <b>{p.name}</b>
            <br />
            <span style={{ opacity: 0.7 }}>{p.category}</span>
          </Popup>
        </Marker>
      ))}
      <FitBounds points={points} focus={focus} />
    </MapContainer>
  );
}
