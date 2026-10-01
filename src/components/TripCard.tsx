/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { CalendarDays, Heart, MapPin } from "lucide-react";
import type { Trip } from "@/lib/types";
import { displayName, flagEmoji, formatDate, tripCover, tripTitle } from "@/lib/utils";
import { IMAGES } from "@/lib/constants";
import { Avatar } from "./Avatar";

export function TripCard({ trip, showAuthor }: { trip: Trip; showAuthor?: boolean }) {
  const cover = tripCover(trip) || IMAGES.paris;
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface-solid/80 transition hover:-translate-y-1 hover:border-primary/50"
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={cover}
          alt=""
          className="size-full object-cover transition duration-500 group-hover:scale-105"
          onError={(e) => ((e.currentTarget as HTMLImageElement).src = IMAGES.paris)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/10 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full glass px-2.5 py-1 text-xs font-bold">
          {trip.duration_days} jour{trip.duration_days > 1 ? "s" : ""}
        </span>
        {typeof trip.likes === "number" && trip.likes > 0 && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full glass px-2.5 py-1 text-xs font-bold">
            <Heart className="size-3 fill-coral text-coral" /> {trip.likes}
          </span>
        )}
        <h3 className="absolute bottom-3 left-4 right-4 text-xl font-bold leading-tight drop-shadow">
          {flagEmoji(trip.country_code)} {tripTitle(trip)}
        </h3>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 text-sm text-muted">
        <span className="flex items-center gap-1.5 truncate">
          <MapPin className="size-3.5 shrink-0 text-primary" /> {trip.destination}
        </span>
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0 text-primary" />
          {trip.start_date ? formatDate(trip.start_date) : `Créé le ${formatDate(trip.created_at)}`}
          <span className="ml-auto text-xs">{trip.pois?.length || 0} étapes</span>
        </span>
        {showAuthor && trip.author && (
          <span className="mt-1 flex items-center gap-2 border-t border-line pt-3 text-ink">
            <Avatar picture={trip.author.picture} emoji={trip.author.avatar_emoji} size={24} />
            <span className="truncate text-xs font-semibold">{displayName(trip.author)}</span>
            {trip.author.is_pro && <span className="text-xs">💎</span>}
          </span>
        )}
      </div>
    </Link>
  );
}
