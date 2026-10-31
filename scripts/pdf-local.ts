import puppeteer from "puppeteer-core";
import { imprimerAvec, type Navigateur } from "../src/lib/pdf-impression";

/** In the scripts: the machine's Chrome, as the digitisation script does. */
const CHROME_LOCAL = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export async function imprimerPdf(html: string, piedDePage: string): Promise<Uint8Array> {
  const navigateur = await puppeteer.launch({ executablePath: CHROME_LOCAL, headless: true });
  return imprimerAvec(navigateur as unknown as Navigateur, html, piedDePage);
}
