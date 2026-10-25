import { NextResponse } from "next/server";
import { getMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getMobileUser(request);
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  return NextResponse.json(user);
}
