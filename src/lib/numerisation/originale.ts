import { PDFDocument, StandardFonts } from "pdf-lib";
import sharp from "sharp";
import type { PageExtraite } from "@/lib/numerisation/extraction";

/*
 * The Version originale: the photographs themselves, cleaned and set on A4
 * pages, with the extracted text laid underneath as invisible text so the
 * document can be searched and copied. Nothing visible is redrawn: this is the
 * reference a student checks the Version reconstituée against.
 */

const A4 = { l: 595.28, h: 841.89 };
const MARGE = 18;

/*
 * Upright, cropped to the sheet, in grey with its contrast stretched, and
 * light enough for a campus connection. The paper is not forced to white: on
 * a blurred photograph that thins faint print until it cannot be read, and
 * this version is the reference a student checks a word against.
 */
export async function nettoyerPage(image: Uint8Array, rotation = 0) {
  const droite = await sharp(await sharp(image).rotate().toBuffer()).rotate(rotation).toBuffer();
  // The white margins of a PDF page the photo had been pasted into.
  const rognee = await sharp(droite)
    .trim({ background: "#ffffff", threshold: 25 })
    .toBuffer()
    .catch(() => droite);
  return new Uint8Array(
    await sharp(rognee)
      .resize({ width: 1700, height: 2400, fit: "inside", withoutEnlargement: true })
      .grayscale()
      .normalise({ lower: 1, upper: 99 })
      .linear(1.15, -20)
      .sharpen({ sigma: 0.7 })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer()
  );
}

// The flat text of a page, for the invisible layer.
function texteDe(page: PageExtraite) {
  const lignes: string[] = [];
  if (page.entete) lignes.push(...page.entete.etablissement, page.entete.matiere ?? "");
  for (const b of page.blocs) {
    if (b.t === "titre" || b.t === "paragraphe") lignes.push(b.texte);
    else if (b.t === "exercice") lignes.push(b.titre);
    else if (b.t === "question") lignes.push(`${b.numero} ${b.texte}`);
    else if (b.t === "formule") lignes.push(b.latex);
    else if (b.t === "liste") lignes.push(...b.elements);
    else if (b.t === "tableau") lignes.push(...b.lignes.map((l) => l.join(" | ")));
  }
  return lignes.join("\n");
}

// The standard font only knows Latin-1: anything else is replaced, the layer is for search, not reading.
const latin1 = (s: string) =>
  s
    .replace(/[‘’]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x0a\x20-\x7e\xa0-\xff]/g, " ");

export async function versionOriginale(pages: { image: Uint8Array; extraite: PageExtraite }[], titre: string) {
  const pdf = await PDFDocument.create();
  const police = await pdf.embedFont(StandardFonts.Helvetica);
  pdf.setTitle(titre);
  pdf.setProducer("Campusly");
  pdf.setCreator("Campusly · campusly-ucac.vercel.app");

  for (const { image, extraite } of pages) {
    const page = pdf.addPage([A4.l, A4.h]);
    const jpg = await pdf.embedJpg(await nettoyerPage(image, extraite.rotation ?? 0));
    const k = Math.min((A4.l - 2 * MARGE) / jpg.width, (A4.h - 2 * MARGE) / jpg.height);
    const l = jpg.width * k;
    const h = jpg.height * k;
    page.drawImage(jpg, { x: (A4.l - l) / 2, y: (A4.h - h) / 2, width: l, height: h });

    // The text, invisible, inside the image's frame.
    const lignes = latin1(texteDe(extraite)).split("\n").flatMap((l) => l.match(/.{1,110}(\s|$)/g) ?? [""]);
    const pas = Math.min(10, (h - 4) / Math.max(1, lignes.length));
    lignes.forEach((ligne, i) => {
      page.drawText(ligne.trim(), {
        x: (A4.l - l) / 2 + 2,
        y: (A4.h + h) / 2 - (i + 1) * pas,
        size: Math.max(1, pas * 0.8),
        font: police,
        opacity: 0,
      });
    });
  }
  return pdf.save();
}
