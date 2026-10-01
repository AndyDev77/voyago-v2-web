import type { Metadata } from "next";
import { getCircles } from "@/lib/server/data";
import { getCurrentUser } from "@/lib/server/session";
import { AppShell } from "@/components/AppShell";
import { CommunityView } from "./CommunityView";

export const metadata: Metadata = {
  title: "Communauté — tribus de voyageurs",
  description: "Rejoins des tribus de voyageurs Voyago, partage tes itinéraires IA et découvre les bons plans de la communauté.",
  alternates: { canonical: "/community" },
};

export default async function CommunityPage() {
  const user = await getCurrentUser();
  const circles = await getCircles(user?.user_id);
  return (
    <AppShell>
      <CommunityView initialCircles={circles} />
    </AppShell>
  );
}
