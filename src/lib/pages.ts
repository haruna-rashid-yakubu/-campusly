import { PDFDocument } from "pdf-lib";

/*
 * Binds the pages of one past paper into a single document.
 *
 * An exam is rarely one sheet. It is a recto-verso, or three pages stapled
 * together, and a délégué photographing it ends up with three images that
 * belong to one subject. Storing them as three separate papers is how
 * "Macroéconomie 2024" appears three times in the list and a student
 * downloads page 2 thinking they have the whole thing.
 *
 * So the pages are merged here, at publication, into one PDF: the row keeps a
 * single file, every screen that already reads it keeps working, and the
 * student gets the paper whole.
 */

const TYPES_IMAGE = ["image/jpeg", "image/png"];

/** A4 at 72dpi, the page a photograph is fitted into when it is not a PDF. */
const A4 = { largeur: 595.28, hauteur: 841.89 };

export function estFusionnable(file: File) {
  return file.type === "application/pdf" || TYPES_IMAGE.includes(file.type);
}

/**
 * Returns one file. A single page is handed back untouched — re-encoding a
 * perfectly good photograph would only cost quality and weight.
 */
export async function fusionnerPages(pages: File[], nomBase: string): Promise<File> {
  if (pages.length === 0) throw new Error("Aucune page.");
  if (pages.length === 1) return pages[0];

  const inconnue = pages.find((p) => !estFusionnable(p));
  if (inconnue) {
    throw new Error(
      `« ${inconnue.name} » n'est ni une photo ni un PDF : retire-la ou envoie-la seule.`
    );
  }

  const sortie = await PDFDocument.create();

  for (const page of pages) {
    const octets = new Uint8Array(await page.arrayBuffer());

    if (page.type === "application/pdf") {
      const source = await PDFDocument.load(octets);
      const copiees = await sortie.copyPages(source, source.getPageIndices());
      for (const p of copiees) sortie.addPage(p);
      continue;
    }

    const image =
      page.type === "image/png" ? await sortie.embedPng(octets) : await sortie.embedJpg(octets);

    // Fitted rather than stretched: an exam photographed in landscape must not
    // come out squashed into portrait, which is unreadable.
    const echelle = Math.min(A4.largeur / image.width, A4.hauteur / image.height);
    const largeur = image.width * echelle;
    const hauteur = image.height * echelle;
    const feuille = sortie.addPage([A4.largeur, A4.hauteur]);
    feuille.drawImage(image, {
      x: (A4.largeur - largeur) / 2,
      y: (A4.hauteur - hauteur) / 2,
      width: largeur,
      height: hauteur,
    });
  }

  const pdf = await sortie.save();
  const nom = `${nomBase.replace(/[^a-zA-Z0-9.\-_ ]/g, "_").trim() || "epreuve"}.pdf`;
  return new File([pdf as BlobPart], nom, { type: "application/pdf" });
}
