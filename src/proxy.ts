import { NextResponse } from "next/server";
import { auth } from "@/auth";

/*
 * /admin is no longer one door. An admin sees all of it; a délégué sees the
 * part that concerns their promo and nothing else, which the page itself
 * decides. Here we only answer "has this account any business on the screen
 * at all" — everything finer belongs with the data, not with the URL.
 */
export default auth((req) => {
  const user = req.auth?.user;
  const autorise = user?.role === "admin" || (user?.delegations?.length ?? 0) > 0;
  if (!autorise) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
