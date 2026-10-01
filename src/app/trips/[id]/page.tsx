import type { Metadata } from "next";
import { getTrip } from "@/lib/server/data";
import { poisForDay, tripTitle } from "@/lib/utils";
import { AppShell } from "@/components/AppShell";
import { TripView } from "./TripView";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const trip = await getTrip(id);
  if (!trip) return { title: "Voyage introuvable", robots: { index: false } };

  const city = tripTitle(trip);
  const days = trip.duration_days || 1;
  const highlights = poisForDay(trip, 1)
    .slice(0, 3)
    .map((p) => p.name)
    .join(", ");
  const title = `${city} en ${days} jour${days > 1 ? "s" : ""} — itinéraire IA`;
  const description = `Itinéraire de ${days} jour${days > 1 ? "s" : ""} à ${trip.destination} généré par l'IA Voyago${highlights ? ` : ${highlights}…` : "."} Carte, météo et astuces d'initiés.`;

  return {
    title,
    description,
    alternates: { canonical: `/trips/${trip.id}` },
    openGraph: { type: "article", title, description, url: `/trips/${trip.id}` },
    twitter: { card: "summary_large_image", title, description },
    // Les voyages privés restent accessibles par lien mais ne sont pas indexés
    robots: trip.is_public === false ? { index: false } : undefined,
  };
}

export default async function TripPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { new: isNew } = await searchParams;
  const trip = await getTrip(id);

  return (
    <AppShell wide>
      <TripView id={id} initialTrip={trip} isNew={isNew === "1"} />
    </AppShell>
  );
}
