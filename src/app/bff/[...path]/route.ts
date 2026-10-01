import { NextResponse, type NextRequest } from "next/server";
import { BACKEND_URL, COOKIE_ONBOARDED, COOKIE_SESSION, COOKIE_TENANT, cookieOptions } from "@/lib/server/session";
import type { AuthUser } from "@/lib/types";

/**
 * Backend-for-frontend : /bff/* → BACKEND_URL/api/*
 * - injecte le jeton (cookie httpOnly) et le tenant ;
 * - à la connexion, retire session_token de la réponse et le range en cookie ;
 * - à la déconnexion ou sur 401, efface les cookies.
 */
const AUTH_ISSUING = new Set(["auth/email/login", "auth/email/signup", "auth/guest"]);
const USER_RETURNING = new Set(["auth/me", "auth/profile", "upload/profile-picture"]);

function clearSession(res: NextResponse) {
  for (const name of [COOKIE_SESSION, COOKIE_TENANT, COOKIE_ONBOARDED]) res.cookies.set(name, "", { ...cookieOptions, maxAge: 0 });
}

function setOnboarded(res: NextResponse, user?: AuthUser | null) {
  if (user) res.cookies.set(COOKIE_ONBOARDED, user.onboarding_completed ? "1" : "0", cookieOptions);
}

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const route = path.join("/");
  const target = `${BACKEND_URL}/api/${route}${req.nextUrl.search}`;

  const headers = new Headers({ Accept: "application/json" });
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const token = req.cookies.get(COOKIE_SESSION)?.value;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  headers.set("x-tenant-id", req.cookies.get(COOKIE_TENANT)?.value || "default");

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      cache: "no-store",
    });
  } catch {
    if (route === "auth/logout") {
      const res = NextResponse.json({ message: "Logged out" });
      clearSession(res);
      return res;
    }
    return NextResponse.json({ message: "Impossible de joindre le serveur Voyago." }, { status: 502 });
  }

  const text = await upstream.text();
  const json = (() => {
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  })();

  // Connexion / inscription / invité : le jeton part en cookie, pas au navigateur
  if (AUTH_ISSUING.has(route) && upstream.ok && json?.session_token) {
    const { session_token, ...safe } = json as { session_token: string; tenant_id?: string; user_id: string; user: AuthUser };
    const res = NextResponse.json(safe, { status: upstream.status });
    res.cookies.set(COOKIE_SESSION, session_token, cookieOptions);
    res.cookies.set(COOKIE_TENANT, safe.tenant_id || safe.user_id, cookieOptions);
    setOnboarded(res, safe.user);
    return res;
  }

  const res = new NextResponse(text || null, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") || "application/json" },
  });

  if (route === "auth/logout") clearSession(res);
  else if (upstream.status === 401 && !AUTH_ISSUING.has(route)) clearSession(res);
  else if (upstream.ok && USER_RETURNING.has(route) && json) setOnboarded(res, (json.user as AuthUser) || (json as AuthUser));

  return res;
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
