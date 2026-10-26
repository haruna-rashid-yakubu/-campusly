import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { creerSessionMobile } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

// The app's scheme, fixed here: the token can only ever be handed to the app.
const RETOUR_APP = "campusly://auth";

// Back from Google: open a session for the app and hand it over through its URL scheme.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(`${RETOUR_APP}?erreur=1`);
  }
  const token = await creerSessionMobile(session.user.id);
  return NextResponse.redirect(`${RETOUR_APP}?token=${encodeURIComponent(token)}`);
}
