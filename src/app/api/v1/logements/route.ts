import { NextResponse, type NextRequest } from "next/server";
import { getCitesWithAvailability } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const cites = await getCitesWithAvailability({
    maxDistanceM: p.get("dist") ? Number(p.get("dist")) : undefined,
    maxPrice: p.get("prix") ? Number(p.get("prix")) : undefined,
    quartier: p.get("quartier") ?? undefined,
    sort: p.get("tri") === "prix" ? "prix" : "distance",
  });
  return NextResponse.json(cites);
}
