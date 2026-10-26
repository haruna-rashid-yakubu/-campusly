import { NextResponse } from "next/server";
import {
  getClasseByLabel,
  getLatestProgramme,
  getPreferredClasse,
  getRecentCite,
  getRecentSubjects,
} from "@/lib/data";
import { cartesAnnonces, cartesEvenements, decorDuJour, rubanDuJour } from "@/lib/evenements";
import { getMaReponse, getResultats, getSondageOuvert } from "@/lib/sondage";
import { boutiquesRecentes, cartesALaUne, getVendeurs } from "@/lib/vendeurs";
import { vendeurPublic } from "@/lib/api";

export const dynamic = "force-dynamic";

// What the home screen shows, in one round trip.
export async function GET() {
  const classe = await getPreferredClasse();
  const [classeRow, recentSubjects, recentCite, vendeurs, sondage] = await Promise.all([
    getClasseByLabel(classe),
    getRecentSubjects(),
    getRecentCite(),
    getVendeurs({ inclureInternes: true }),
    getSondageOuvert(),
  ]);
  // The shops a student can open, without Campusly's own services (the pressing).
  const ouvertes = vendeurs.filter((v) => v.categorie !== "interne");
  const [programme, cartesVendeurs, sondageDetail] = await Promise.all([
    classeRow ? getLatestProgramme(classeRow.id) : null,
    cartesALaUne(vendeurs),
    sondage ? Promise.all([getResultats(sondage), getMaReponse(sondage.id)]) : null,
  ]);

  return NextResponse.json({
    classe,
    programme,
    cartesUne: [...cartesEvenements(), ...cartesAnnonces(), ...cartesVendeurs],
    ruban: rubanDuJour(),
    decor: decorDuJour(),
    sondage: sondage && sondageDetail
      ? { ...sondage, resultats: sondageDetail[0], maReponse: sondageDetail[1] }
      : null,
    recentSubjects,
    recentCite,
    vendeurs: ouvertes.map(vendeurPublic),
    // "Nouveautés" leads with shops opened in the last month, as on the web.
    boutiquesRecentes: boutiquesRecentes(ouvertes).map(vendeurPublic),
  });
}
