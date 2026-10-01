import type { MetadataRoute } from "next";
import { getCircles, getPublicFeed } from "@/lib/server/data";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [trips, circles] = await Promise.all([getPublicFeed(), getCircles()]);
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/community`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ...trips.map((t) => ({
      url: `${SITE_URL}/trips/${t.id}`,
      lastModified: t.created_at ? new Date(t.created_at) : now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...(circles || [])
      .filter((c) => c.is_public !== false)
      .map((c) => ({ url: `${SITE_URL}/community/circles/${c.id}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.5 })),
  ];
}
