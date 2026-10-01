import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-6xl">🦜</span>
      <h1 className="text-3xl font-bold">Page introuvable</h1>
      <p className="text-muted">Même notre perroquet ne connaît pas cette destination.</p>
      <Link href="/" className="mt-4 rounded-xl bg-primary px-6 py-3 font-bold text-[#062420]">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
