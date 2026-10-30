/*
 * What the agent's actions show on screen, between its words: results to tap
 * (papers, shops, residences), a menu, a day's courses, a poll to answer, and
 * the actions that need the student's own tap before they happen — an order
 * to send, a promo to change. Shared by the route that fills them and the
 * screen that draws them.
 */
export type Widget =
  | { t: "sujets"; items: { id: number; matiere: string; type: string; annee: string; filiere: string; niveau: string; corrige: boolean }[] }
  | { t: "programme"; titre: string; jours: { libelle: string; cours: { heures: string; matiere: string; salle: string | null; enseignant: string | null; cc: boolean }[] }[] }
  | { t: "boutiques"; items: { slug: string; nom: string; logo: string | null; description: string | null }[] }
  | {
      t: "menu";
      boutique: { slug: string; nom: string; logo: string | null };
      sections: { titre: string; items: { nom: string; description: string | null; prix: string; epuise: boolean }[] }[];
    }
  | {
      t: "commande";
      boutique: { id: number; slug: string; nom: string; logo: string | null };
      lignes: { libelle: string; quantite: number; montant: number }[];
      frais: { libelle: string; montant: number }[];
      total: number;
      remise: string | null;
      // Exactly what the shop's own page would send, for the student's tap to send it.
      envoi:
        | { genre: "menu"; vendeurId: number; lignes: { item: string; taille: string; choix?: string; quantite: number }[]; mode: string; precision?: string }
        | { genre: "packs"; vendeurId: number; panier: { formuleId: number; parfums: Record<number, number> }[]; precision?: string };
    }
  | { t: "logements"; items: { id: number; nom: string; quartier: string; distance: string; prixMin: number | null; disponibles: number; photo: string | null }[] }
  | { t: "sondage"; id: number; question: string; options: string[]; maReponse: number | null }
  | { t: "classe"; label: string }
  | { t: "liens"; items: { libelle: string; href: string; icone: "doc" | "cal" | "bed" | "shirt" | "bag" | "bell" | "plus" | "spark" | "inbox" }[] }
  | { t: "notifications"; items: { titre: string; detail: string; href: string }[] };

// The stream the agent's route sends, one JSON object per line.
export type Evenement =
  | { t: "etape"; texte: string }
  | { t: "widget"; widget: Widget }
  | { t: "texte"; texte: string }
  | { t: "contexte"; texte: string }
  | { t: "erreur"; message: string }
  | { t: "fin" };
