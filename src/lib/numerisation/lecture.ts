import type { Bloc, Extraction } from "@/lib/numerisation/extraction";
import { contenu } from "@/lib/numerisation/gabarit";
import { cles, lire } from "@/lib/numerisation/r2";

export type Lecture = {
  // The paper as text, ready to be set into the page.
  html: string;
  // The cleaned photographs, in order of the sheets.
  photos: string[];
  aRelire: boolean;
};

const image = (id: number, nom: string) => `/api/sujets/${id}/images/${nom}`;

/** A digitised paper's extraction, once proofread; null when not digitised yet or R2 cannot be reached. */
export async function lireExtraction(id: number, corrige = false): Promise<Extraction | null> {
  const brut = await lire(cles.extraction(id, corrige)).catch(() => null);
  if (!brut) return null;
  const e = JSON.parse(Buffer.from(brut).toString()) as Extraction;
  return e.verification ? e : null;
}

/*
 * What the Sujet page shows a reader allowed to read it: the Version
 * reconstituée as text sized for the screen it is read on, and the
 * photographs it was read from. Null when the photographs have not been
 * published: the page then falls back to the PDF.
 */
export function versLecture(e: Extraction, id: number): Lecture | null {
  if (!e.photos?.length) return null;
  const figures = new Map<Bloc, string>();
  for (const p of e.pages) for (const b of p.blocs) if (b.t === "figure" && b.image) figures.set(b, image(id, b.image));
  return {
    html: contenu(e.pages, figures, e.meta.langue),
    photos: e.photos.map((nom) => image(id, nom)),
    aRelire: e.pages.some((p) => p.aRelire),
  };
}
