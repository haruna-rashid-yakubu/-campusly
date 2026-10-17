import { NextResponse } from "next/server";

/*
 * A notification that should open a WhatsApp conversation — "one pack left,
 * tap to get it" — lands here first. A push opens a page of the app far more
 * reliably than an outside address, on iPhone above all, so the tap opens
 * /wa and this sends the phone on to WhatsApp with the message already typed.
 *
 * It only ever sends to wa.me, with a phone number and a short text: nobody
 * can use it to bounce a link through Campusly to somewhere else.
 */
export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  let numero = (params.get("n") ?? "").replace(/\D/g, "");
  // A Cameroonian mobile typed without its country code: 6XX XX XX XX.
  if (numero.length === 9 && numero.startsWith("6")) numero = `237${numero}`;
  if (numero.length < 8 || numero.length > 15) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  const texte = (params.get("t") ?? "").slice(0, 500);
  const cible = `https://wa.me/${numero}${texte ? `?text=${encodeURIComponent(texte)}` : ""}`;
  return NextResponse.redirect(cible);
}
