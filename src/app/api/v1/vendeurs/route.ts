import { NextResponse } from "next/server";
import { vendeurPublic } from "@/lib/api";
import { getVendeurs } from "@/lib/vendeurs";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json((await getVendeurs()).map(vendeurPublic));
}
