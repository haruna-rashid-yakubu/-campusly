/*
 * A student's course, made text for the revision tutor, on the phone.
 *
 * A PDF with text in it is read here by pdf.js and never leaves the phone.
 * Photographs, and the pages of a scanned PDF, are shrunk to a readable JPEG
 * and transcribed by the server (api/sujets/[id]/tuteur/cours), one page per
 * call, so no request carries more than a few hundred kilobytes.
 */
export type Cours = { nom: string; texte: string; pages: number };

const WORKER = "/pdfjs/pdf.worker-6.4.299.min.mjs";
const PAGES_PDF = 40;
const PAGES_SCANNEES = 8;
const COTE = 1600;

async function enJpeg(source: CanvasImageSource & { width: number; height: number }): Promise<Blob> {
  const echelle = Math.min(1, COTE / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * echelle);
  canvas.height = Math.round(source.height * echelle);
  canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise((ok, ko) => canvas.toBlob((b) => (b ? ok(b) : ko(new Error("image"))), "image/jpeg", 0.8));
}

async function transcrire(subjectId: number, page: Blob): Promise<string> {
  const form = new FormData();
  form.append("page", page, "page.jpg");
  const res = await fetch(`/api/sujets/${subjectId}/tuteur/cours`, { method: "POST", body: form });
  const corps = (await res.json().catch(() => null)) as { texte?: string; erreur?: string; limite?: number } | null;
  if (res.ok && corps?.texte) return corps.texte;
  throw new Error(
    corps?.erreur === "quota_cours"
      ? `Tu as déjà fait lire ${corps.limite ?? 40} pages de cours aujourd'hui. Reviens demain pour en ajouter.`
      : "Impossible de lire cette page pour le moment. Réessaie."
  );
}

export async function lireCours(
  subjectId: number,
  fichier: File,
  progres: (fait: number, total: number) => void
): Promise<Cours> {
  if (fichier.type === "application/pdf" || /\.pdf$/i.test(fichier.name)) {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = WORKER;
    const doc = await pdfjs.getDocument({ data: new Uint8Array(await fichier.arrayBuffer()) }).promise;
    try {
      const total = Math.min(doc.numPages, PAGES_PDF);
      const pages: string[] = [];
      for (let n = 1; n <= total; n++) {
        const contenu = await (await doc.getPage(n)).getTextContent();
        pages.push(contenu.items.map((i) => ("str" in i ? i.str + (i.hasEOL ? "\n" : " ") : "")).join("").trim());
        progres(n, total);
      }
      // A scan: pictures of pages with no text in them. Drawn here, read by the server.
      if (pages.join("").length / total < 80) {
        const scannees = Math.min(doc.numPages, PAGES_SCANNEES);
        const textes: string[] = [];
        for (let n = 1; n <= scannees; n++) {
          const page = await doc.getPage(n);
          const vue = page.getViewport({ scale: COTE / page.getViewport({ scale: 1 }).height });
          const canvas = document.createElement("canvas");
          canvas.width = vue.width;
          canvas.height = vue.height;
          await page.render({ canvas, viewport: vue }).promise;
          textes.push(await transcrire(subjectId, await enJpeg(canvas)));
          progres(n, scannees);
        }
        return { nom: fichier.name, texte: textes.join("\n\n"), pages: scannees };
      }
      return { nom: fichier.name, texte: pages.join("\n\n"), pages: total };
    } finally {
      void doc.loadingTask.destroy();
    }
  }

  if (!fichier.type.startsWith("image/")) throw new Error("Ajoute un PDF ou des photos de ton cours.");
  progres(0, 1);
  const image = await createImageBitmap(fichier);
  const texte = await transcrire(subjectId, await enJpeg(image));
  image.close();
  progres(1, 1);
  return { nom: fichier.name, texte, pages: 1 };
}
