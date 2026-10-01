import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Voyago — Voyage plus malin, joue plus fort",
    template: "%s · Voyago",
  },
  description:
    "Voyago génère ton itinéraire de voyage sur-mesure avec l'IA, adapté à la météo et à tes envies. Gagne de l'XP, débloque des badges et partage tes aventures.",
};

export const viewport: Viewport = {
  themeColor: "#0c1a18",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={spaceGrotesk.variable}>
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
