import type { Metadata } from "next";
import { getProTiers } from "@/lib/server/data";
import { AppShell } from "@/components/AppShell";
import { PricingView } from "./PricingView";

export const metadata: Metadata = {
  title: "Voyago Pro — voyages illimités",
  description: "Passe à Voyago Pro : itinéraires IA illimités, météo étendue 16 jours et badge Pro. Dès 4,99 €/mois, sans engagement.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage() {
  const tiers = await getProTiers();
  return (
    <AppShell>
      <PricingView initialTiers={tiers} />
    </AppShell>
  );
}
