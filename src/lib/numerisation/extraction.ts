/*
 * Reads one photographed page of a Sujet or a Corrigé and returns its content
 * as structured blocks: what the Version reconstituée is then laid out from.
 *
 * The model transcribes; it does not correct. A typo on the sheet stays a
 * typo, because a student comparing with the Version originale must find the
 * same words. Handwriting that is not part of the paper (a student's notes,
 * a seat number in a corner) is left out.
 */

export const TYPES_EPREUVE = ["Partiel", "CC", "Examen", "Rattrapage", "TD", "Concours"] as const;
export type TypeEpreuve = (typeof TYPES_EPREUVE)[number];

// Text may carry inline math as $…$; display math is its own block.
export type Bloc =
  | { t: "titre"; texte: string }
  | { t: "paragraphe"; texte: string }
  | { t: "exercice"; titre: string; points: number | null }
  | { t: "question"; numero: string; texte: string; points: number | null }
  | { t: "formule"; latex: string }
  | { t: "liste"; elements: string[] }
  | { t: "tableau"; lignes: string[][]; entete: boolean }
  // A diagram, a graph, a drawing: cropped from the photograph, never redrawn.
  // `boite` is [x0, y0, x1, y1] in thousandths of the page's width and height.
  | { t: "figure"; legende: string | null; boite: [number, number, number, number]; image?: string };

export type PageExtraite = {
  // Only read from the first page; null when the page does not say.
  entete: {
    etablissement: string[];
    matiere: string | null;
    type: TypeEpreuve | null;
    annee: number | null;
    duree: string | null;
    enseignant: string | null;
    session: string | null;
  } | null;
  langue: "fr" | "en";
  blocs: Bloc[];
  themes: string[];
  // 0 to 1: how sure the model is that every word and number is right.
  confiance: number;
  // Set when Claude has re-read the page against its photograph.
  verifiee?: boolean;
  // Degrees clockwise to turn the photograph upright, found at re-reading.
  rotation?: 0 | 90 | 180 | 270;
  // Something on the sheet that cannot be read even by eye: the page goes to the admin's review queue.
  aRelire?: string | null;
};

// The file kept in R2 beside the PDFs, and what the Version reconstituée is printed from.
export type Extraction = {
  sujet: number;
  corrige: boolean;
  meta: import("@/lib/numerisation/gabarit").Meta;
  confiance: number;
  themes: string[];
  pages: PageExtraite[];
  verification?: { par: string; le: string; corrections: string[] } | null;
  // R2 file names (under sujets/<id>/) of the cleaned page photographs, in order.
  photos?: string[];
};

const CONSIGNE = `Tu numérises une page d'un examen universitaire (UCAC, Cameroun) photographiée au téléphone.
Transcris INTÉGRALEMENT et FIDÈLEMENT le texte imprimé ou écrit par l'enseignant, sans rien corriger ni reformuler.
Ignore ce qui n'appartient pas au sujet : annotations d'étudiant, numéros griffonnés, tampons illisibles, bords de table.
Règles de classement :
- Les informations d'en-tête (établissement, faculté, département, classe, matière, durée, enseignant, session, année académique, date) vont UNIQUEMENT dans "entete" : ne les répète pas dans "blocs".
- Une ligne coupée par le bord de la photo ("AC", "SG", "née académique") n'est pas recopiée : complète-la seulement si elle est évidente ("UCAC", "Année académique 2025-2026"), sinon omets-la.
- "exercice" sert uniquement aux grandes divisions (Exercice, Cas, Partie, Problème, Section). Un point numéroté en chiffres romains, en chiffres ou en lettres ("I", "1-", "a)") qui pose une question est une "question", même s'il est en gras.
- Devoir surveillé, DS, contrôle continu = "CC". Mid-term/Midterm/Partiel = "Partiel".

Rends uniquement un objet JSON :
{
  "entete": null, ou si la page porte l'en-tête de l'épreuve : {
    "etablissement": [lignes d'en-tête institutionnelles, dans l'ordre],
    "matiere": nom de la matière tel qu'écrit,
    "type": un de ${JSON.stringify(TYPES_EPREUVE)} (Mid-term/Midterm = "Partiel", contrôle continu = "CC", Final/Examination/Normal session = "Examen", Resit/Rattrapage = "Rattrapage", Travaux dirigés/Tutorial = "TD") ou null,
    "annee": année (nombre) ou null, "duree": durée telle qu'écrite ou null,
    "enseignant": nom ou null, "session": libellé de session ou null
  },
  "langue": "fr" ou "en",
  "blocs": dans l'ordre de lecture, chacun l'un de :
    {"t":"titre","texte":...}  (titre de partie, "EXERCICE 1" se met plutôt en "exercice")
    {"t":"exercice","titre":"Exercice 1 : ...","points":nombre|null}
    {"t":"paragraphe","texte":...}   (énoncé, consigne, mise en situation)
    {"t":"question","numero":"1." | "a)" ...,"texte":...,"points":nombre|null}
    {"t":"formule","latex":...}   (formule centrée sur sa propre ligne)
    {"t":"liste","elements":[...]}
    {"t":"tableau","entete":true|false,"lignes":[[cellules]]}
    {"t":"figure","legende":texte|null,"boite":[x0,y0,x1,y1]}  (graphique, schéma, dessin : position en millièmes de la largeur et de la hauteur de la photo)
  Les maths dans le texte s'écrivent en LaTeX entre $...$ (ex. $\\bar{X}$, $\\sigma^2$, $P(X \\le 3)$).
  Le barème "(3mks)", "(2 pts)" va dans "points", pas dans le texte.
  "themes": 2 à 6 notions abordées, en français, courtes (ex. "intervalle de confiance"),
  "confiance": entre 0 et 1, ta certitude que chaque mot et chaque nombre est exact
}`;

// The first complete JSON object in the answer: the model sometimes adds a word after it.
function objetJson(texte: string) {
  const debut = texte.indexOf("{");
  let profondeur = 0;
  let chaine = false;
  for (let i = debut; i >= 0 && i < texte.length; i++) {
    const c = texte[i];
    if (chaine) {
      if (c === "\\") i++;
      else if (c === '"') chaine = false;
    } else if (c === '"') chaine = true;
    else if (c === "{") profondeur++;
    else if (c === "}" && --profondeur === 0) return JSON.parse(texte.slice(debut, i + 1));
  }
  throw new Error("Réponse sans objet JSON complet");
}

/** Reads a page, trying again on a malformed or failed answer. */
export async function extrairePage(image: Uint8Array, type = "image/jpeg"): Promise<PageExtraite> {
  let derniere: unknown;
  for (let essai = 0; essai < 3; essai++) {
    try {
      return await uneLecture(image, type);
    } catch (e) {
      derniere = e;
    }
  }
  throw derniere;
}

async function uneLecture(image: Uint8Array, type: string): Promise<PageExtraite> {
  const cle = process.env.DEEPSEEK_API_KEY;
  if (!cle) throw new Error("DEEPSEEK_API_KEY n'est pas configurée.");
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-flash",
      max_tokens: 16000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: CONSIGNE },
            { type: "image_url", image_url: { url: `data:${type};base64,${Buffer.from(image).toString("base64")}` } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek a refusé la page (${res.status}) : ${(await res.text()).slice(0, 200)}`);
  const d = (await res.json()) as { choices: { message: { content: string } }[] };
  const page = objetJson(d.choices[0].message.content) as PageExtraite;
  page.blocs ??= [];
  page.themes ??= [];
  page.confiance = typeof page.confiance === "number" ? page.confiance : 0;
  if (page.entete?.type && !TYPES_EPREUVE.includes(page.entete.type)) page.entete.type = null;
  return page;
}
