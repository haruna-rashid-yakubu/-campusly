import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { CLASSE_COOKIE, DEVICE_COOKIE } from "@/lib/constants";

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

export default function proxy(req: NextRequest, ev: NextFetchEvent) {
  if (req.nextUrl.pathname.startsWith("/admin")) {
    return (proxyAdmin as unknown as (r: NextRequest, e: NextFetchEvent) => ReturnType<typeof pontMobile>)(req, ev);
  }
  return pontMobile(req);
}

export const config = {
  matcher: ["/admin/:path*", "/api/v1/:path*", "/api/blob/:path*"],
};
