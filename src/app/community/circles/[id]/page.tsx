import type { Metadata } from "next";
import { getCircle, getCirclePosts } from "@/lib/server/data";
import { getCurrentUser } from "@/lib/server/session";
import { AppShell } from "@/components/AppShell";
import { CircleView } from "./CircleView";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await getCurrentUser();
  const c = await getCircle(id, user?.user_id);
  if (!c) return { title: "Tribu introuvable", robots: { index: false } };
  const title = `${c.name} — tribu Voyago`;
  const description = c.description || `Rejoins la tribu ${c.name} sur Voyago : ${c.members_count ?? 1} voyageurs partagent leurs bons plans.`;
  return {
    title,
    description,
    alternates: { canonical: `/community/circles/${c.id}` },
    openGraph: { title, description, url: `/community/circles/${c.id}`, images: c.cover_image_url ? [{ url: c.cover_image_url }] : undefined },
    robots: c.is_public === false ? { index: false } : undefined,
  };
}

export default async function CirclePage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  const [circle, posts] = await Promise.all([getCircle(id, user?.user_id), getCirclePosts(id)]);
  return (
    <AppShell>
      <CircleView id={id} initialCircle={circle} initialPosts={posts} />
    </AppShell>
  );
}
