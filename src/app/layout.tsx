import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import { SITE_URL } from "@/lib/site";
import { getCurrentUser } from "@/lib/server/session";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const description =
  "Voyago génère ton itinéraire de voyage sur-mesure avec l'IA, adapté à la météo et à tes envies. Gagne de l'XP, débloque des badges et partage tes aventures.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Voyago — Voyage plus malin, joue plus fort",
    template: "%s · Voyago",
  },
  description,
  applicationName: "Voyago",
  openGraph: {
    type: "website",
    siteName: "Voyago",
    locale: "fr_FR",
    title: "Voyago — Voyage plus malin, joue plus fort",
    description,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0c1a18",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  return (
    <html lang="fr" className={spaceGrotesk.variable}>
      <body className="antialiased">
        <AuthProvider initialUser={user}>{children}</AuthProvider>
      </body>
    </html>
  );
}
