import { NextResponse } from "next/server";
import { preparerPressing } from "@/lib/actions";

export const dynamic = "force-dynamic";

// Records the order and returns the reference to put in the WhatsApp message.
export async function POST() {
  return NextResponse.json(await preparerPressing());
}
