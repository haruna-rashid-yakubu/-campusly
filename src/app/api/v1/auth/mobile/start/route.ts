import { NextResponse } from "next/server";
import { auth, signIn } from "@/auth";

export const dynamic = "force-dynamic";

/*
 * Where the app's sign-in sheet opens. It is the web's Google sign-in, with
 * the web's own OAuth client, ending on /retour instead of the home page.
 * Someone already signed in on this browser goes straight through.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (session?.user) {
    return NextResponse.redirect(new URL("/api/v1/auth/mobile/retour", request.url));
  }
  await signIn("google", { redirectTo: "/api/v1/auth/mobile/retour" });
}
