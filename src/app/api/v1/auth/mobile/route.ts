import { NextResponse } from "next/server";
import { signOutMobile } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  await signOutMobile(request);
  return new NextResponse(null, { status: 204 });
}
