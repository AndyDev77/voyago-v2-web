import type { Metadata } from "next";
import { getPublicUser } from "@/lib/server/data";
import { displayName } from "@/lib/utils";
import { AppShell } from "@/components/AppShell";
import { UserView } from "./UserView";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getPublicUser(id);
  if (!data) return { title: "Voyageur introuvable", robots: { index: false } };
  const name = displayName(data.user);
  const trips = data.profile?.trips_count ?? data.trips.length;
  const title = `${name} — voyageur Voyago`;
  const description = `Découvre les ${trips} itinéraire${trips > 1 ? "s" : ""} de ${name} : niveau ${data.profile?.level ?? 1}, ${data.profile?.xp ?? 0} XP sur Voyago.`;
  return {
    title,
    description,
    alternates: { canonical: `/user/${id}` },
    openGraph: { type: "profile", title, description, url: `/user/${id}` },
  };
}

export default async function PublicUserPage({ params }: Props) {
  const { id } = await params;
  const data = await getPublicUser(id);
  return (
    <AppShell>
      <UserView id={id} initial={data} />
    </AppShell>
  );
}
