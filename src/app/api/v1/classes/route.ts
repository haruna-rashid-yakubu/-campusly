import { NextResponse } from "next/server";
import { getClasses } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getClasses());
}
