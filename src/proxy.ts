import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { CLASSE_COOKIE, DEVICE_COOKIE, SESSION_SECONDES } from "@/lib/constants";

/*
 * /admin is no longer one door. An admin sees all of it; a délégué sees the
 * part that concerns their promo and nothing else, which the page itself
 * decides. Here we only answer "has this account any business on the screen
 * at all" — everything finer belongs with the data, not with the URL.
 */
const proxyAdmin = auth((req) => {
  const user = req.auth?.user;
  const autorise = user?.role === "admin" || (user?.delegations?.length ?? 0) > 0;
  if (!autorise) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
});

/*
 * The native app has no cookie jar it can be trusted with, so it sends what
 * the browser would keep in cookies as headers instead: its session as a
 * bearer token, its promo and its device id. Turned back into cookies here,
 * they reach `auth()` and the server actions exactly as the web's do, and the
 * API can call the same code the pages call instead of a copy of it.
 *
 * The bearer token is a row of the `session` table, so Auth.js checks it the
 * way it checks any web session.
 */
function decoder(valeur: string | null) {
  if (!valeur) return null;
  try {
    return decodeURIComponent(valeur);
  } catch {
    return valeur;
  }
}

function pontMobile(req: NextRequest) {
  const ajouts: string[] = [];
  const [scheme, token] = (req.headers.get("authorization") ?? "").split(" ");
  if (scheme?.toLowerCase() === "bearer" && token) {
    // Which of the two names Auth.js reads depends on whether it runs over https.
    ajouts.push(`authjs.session-token=${token}`, `__Secure-authjs.session-token=${token}`);
  }
  // Sent URL-encoded: a header cannot carry the "·" of "BME · L2" intact.
  const classe = decoder(req.headers.get("x-campusly-classe"));
  if (classe) ajouts.push(`${CLASSE_COOKIE}=${encodeURIComponent(classe)}`);
  const device = req.headers.get("x-campusly-device");
  if (device) ajouts.push(`${DEVICE_COOKIE}=${encodeURIComponent(device)}`);
  if (ajouts.length === 0) return NextResponse.next();

  const headers = new Headers(req.headers);
  const existants = headers.get("cookie");
  headers.set("cookie", [existants, ...ajouts].filter(Boolean).join("; "));
  return NextResponse.next({ request: { headers } });
}

/*
 * The session cookie, given its full life again once a day of use.
 *
 * Auth.js pushes the session row back as the pages read it, but a page cannot
 * set a cookie, so the browser kept the one written at sign-in and dropped it
 * on its date: signed out a month later however often Campusly was opened.
 * The marker cookie keeps this to one renewal a day.
 */
const SESSIONS = ["__Secure-authjs.session-token", "authjs.session-token"];
const RENOUVELE = "cy-session-renouvelee";

function prolonger(req: NextRequest, res: NextResponse) {
  if (req.cookies.has(RENOUVELE)) return res;
  const nom = SESSIONS.find((n) => req.cookies.has(n));
  if (!nom) return res;
  const secure = nom.startsWith("__Secure-");
  const options = { path: "/", httpOnly: true, sameSite: "lax" as const, secure };
  res.cookies.set(nom, req.cookies.get(nom)!.value, { ...options, maxAge: SESSION_SECONDES });
  res.cookies.set(RENOUVELE, "1", { ...options, maxAge: 24 * 60 * 60 });
  return res;
}

export default function proxy(req: NextRequest, ev: NextFetchEvent) {
  const chemin = req.nextUrl.pathname;
  if (chemin.startsWith("/admin")) {
    return (proxyAdmin as unknown as (r: NextRequest, e: NextFetchEvent) => ReturnType<typeof pontMobile>)(req, ev);
  }
  if (chemin.startsWith("/api/")) return pontMobile(req);
  return prolonger(req, NextResponse.next());
}

export const config = {
  matcher: [
    // The files too: a later app sends its session to them directly instead of a signed link.
    "/admin/:path*",
    "/api/v1/:path*",
    "/api/blob/:path*",
    "/api/fichiers/:path*",
    "/api/sujets/:path*",
    // Every page, for the session's renewal; not the build's files or the images.
    "/((?!api/|_next/|.*\\.(?:png|jpg|jpeg|svg|webp|ico|webmanifest|js|css|txt|xml)$).*)",
  ],
};
