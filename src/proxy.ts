import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const isAdmin = req.auth?.user?.role === "admin";
  if (!isAdmin) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
