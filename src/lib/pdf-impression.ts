/*
 * HTML printed to PDF by a real Chromium, so the maths, the tables and the
 * fonts come out as they look on screen. The same steps whichever browser
 * prints: Browser Rendering on the site (lib/pdf-serveur), the machine's
 * Chrome in the scripts (scripts/pdf-local).
 */

type Page = {
  setContent(html: string, options: { waitUntil: "load"; timeout: number }): Promise<unknown>;
  evaluateHandle(expression: string): Promise<unknown>;
  pdf(options: Record<string, unknown>): Promise<Uint8Array>;
};

export type Navigateur = { newPage(): Promise<Page>; close(): Promise<void> };

export async function imprimerAvec(navigateur: Navigateur, html: string, piedDePage: string): Promise<Uint8Array> {
  try {
    const page = await navigateur.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 25_000 });
    await page.evaluateHandle("document.fonts.ready");
    return await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: piedDePage,
      margin: { top: "18mm", bottom: "20mm", left: "16mm", right: "16mm" },
    });
  } finally {
    await navigateur.close();
  }
}
