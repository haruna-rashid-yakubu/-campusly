import { NextResponse } from "next/server";
import { proposerProgramme } from "@/lib/actions";

export const dynamic = "force-dynamic";

// Multipart, with the same fields as the web form.
export async function POST(request: Request) {
  return NextResponse.json(await proposerProgramme(await request.formData()));
}
