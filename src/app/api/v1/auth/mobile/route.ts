import { NextResponse } from "next/server";
import { signInWithGoogleIdToken, signOutMobile } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

// The app sends the ID token it got from native Google sign-in.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { idToken?: string } | null;
  if (!body?.idToken) {
    return NextResponse.json({ error: "idToken manquant" }, { status: 400 });
  }
  const session = await signInWithGoogleIdToken(body.idToken);
  if (!session) {
    return NextResponse.json({ error: "Jeton Google invalide" }, { status: 401 });
  }
  return NextResponse.json(session);
}

export async function DELETE(request: Request) {
  await signOutMobile(request);
  return new NextResponse(null, { status: 204 });
}
