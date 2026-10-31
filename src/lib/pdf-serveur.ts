import puppeteer from "puppeteer-core";

/*
 * HTML printed to PDF by a real Chromium, so the maths, the tables and the
 * fonts come out as they look on screen. In the container, the Chromium the
 * image installs (CHROME_PATH, Dockerfile); on a Mac, the machine's Chrome,
 * as the digitisation script does.
 */
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export async function imprimerPdf(html: string, piedDePage: string): Promise<Uint8Array> {
  const navigateur = await puppeteer.launch({
    executablePath: CHROME,
    // A container has neither the sandbox's kernel features nor a large /dev/shm.
    args: process.platform === "linux" ? ["--no-sandbox", "--disable-dev-shm-usage"] : [],
    headless: true,
  });
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
