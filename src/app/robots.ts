import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Espaces privés et proxy API : rien à indexer
      disallow: ["/bff/", "/dashboard", "/swipe", "/configure", "/rewards", "/profile", "/onboarding", "/login", "/signup", "/forgot-password"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
