import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

/*
 * Mints a short-lived token so the browser can send a file straight to the
 * blob store, instead of pushing it through a Server Action.
 *
 * It has to work this way. A Server Action's body is capped at 1 MB by
 * default and at 4.5 MB by the platform whatever the setting — one photograph
 * of an exam is already past the first and a three-page paper past the
 * second. That cap is what délégués were hitting: not the number of papers,
 * the weight of one. Going direct takes the server out of the data path
 * entirely, so a cupboard of twenty sheets is no longer a single enormous
 * request that either fits or fails whole.
 *
 * The token is the thing being guarded, so the right is checked here, before
 * one is handed out: an admin, or a délégué of at least one promo. Everything
 * else about the paper — which promo it lands on — is checked again when the
 * row is written, because a token says who may upload, never what may be
 * claimed afterwards.
 */
export async function POST(request: Request) {
  const session = await auth();
  const autorise =
    session?.user?.role === "admin" || (session?.user?.delegations?.length ?? 0) > 0;
  if (!autorise) return new NextResponse("Unauthorized", { status: 401 });

  const body = (await request.json()) as HandleUploadBody;

  try {
    const resultat = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/jpeg", "image/png", "application/pdf"],
        addRandomSuffix: true,
        maximumSizeInBytes: 25 * 1024 * 1024,
      }),
      // Nothing to do on completion: the row is written by the action that
      // follows, which is also where the promo is checked.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(resultat);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Téléversement refusé" },
      { status: 400 }
    );
  }
}
