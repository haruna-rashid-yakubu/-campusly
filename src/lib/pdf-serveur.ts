import puppeteer from "@cloudflare/puppeteer";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { imprimerAvec, type Navigateur } from "@/lib/pdf-impression";

/** On the site: the Chromium of Cloudflare Browser Rendering (the BROWSER binding, wrangler.jsonc). */
export async function imprimerPdf(html: string, piedDePage: string): Promise<Uint8Array> {
  const { env } = getCloudflareContext();
  const navigateur = await puppeteer.launch(env.BROWSER);
  return imprimerAvec(navigateur as unknown as Navigateur, html, piedDePage);
}
