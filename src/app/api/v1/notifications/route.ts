import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getNotificationFeed } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  return NextResponse.json(await getNotificationFeed(session?.user?.id));
}
