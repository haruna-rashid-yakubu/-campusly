import { NextResponse } from "next/server";
import { noterVuePressing } from "@/lib/actions";
import { getPressings } from "@/lib/data";
import { PRESSING_CONDITIONS, PRESSING_RESUME, PRESSING_WHATSAPP } from "@/lib/pressing";

export const dynamic = "force-dynamic";

export async function GET() {
  const [pressings] = await Promise.all([getPressings(), noterVuePressing()]);
  return NextResponse.json({
    pressings,
    conditions: PRESSING_CONDITIONS,
    resume: PRESSING_RESUME,
    whatsapp: PRESSING_WHATSAPP,
  });
}
