import { NextResponse } from "next/server";
import { preparerCommande, preparerCommandeMenu } from "@/lib/actions";
import { corps, invalide } from "@/lib/api";

export const dynamic = "force-dynamic";

type Body =
  | ({ type: "catalogue" } & Parameters<typeof preparerCommande>[0])
  | ({ type: "menu" } & Parameters<typeof preparerCommandeMenu>[0]);

/*
 * Records an order before the app opens WhatsApp with it. A menu order may
 * carry the phone's Expo push token as pushEndpoint, so "ready" reaches it.
 */
export async function POST(request: Request) {
  const body = await corps<Body>(request);
  if (body?.type === "catalogue") return NextResponse.json(await preparerCommande(body));
  if (body?.type === "menu") return NextResponse.json(await preparerCommandeMenu(body));
  return invalide();
}
