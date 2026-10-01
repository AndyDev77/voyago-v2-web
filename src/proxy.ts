import { NextResponse, type NextRequest } from "next/server";

// Vérification optimiste (cookies uniquement, sans appel backend) avant le rendu des pages privées.
const SESSION = "voyago_session";
const ONBOARDED = "voyago_onboarded";

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const hasSession = !!req.cookies.get(SESSION)?.value;

  if (!hasSession) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  const onboarded = req.cookies.get(ONBOARDED)?.value;
  if (onboarded === "0" && pathname !== "/onboarding") return NextResponse.redirect(new URL("/onboarding", req.url));
  if (onboarded === "1" && pathname === "/onboarding") return NextResponse.redirect(new URL("/dashboard", req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/swipe", "/configure", "/rewards", "/profile", "/onboarding"],
};
