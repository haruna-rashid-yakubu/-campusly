import "dotenv/config";
import { db } from "./index";
import {
  classes,
  subjects,
  cites,
  roomTypes,
  pressings,
  pressingTarifs,
  programmePublications,
} from "./schema";

const CLASSE_LABELS = [
  "Génie informatique · L1",
  "Génie informatique · L2",
  "Génie informatique · L3",
  "Génie civil · L3",
  "Gestion · L1",
];

async function main() {
  console.log("Seeding…");

  await db
    .insert(classes)
    .values(CLASSE_LABELS.map((label) => ({ label })))
    .onConflictDoNothing();
  const classeRows = await db.select().from(classes);
  const classeByLabel = new Map(classeRows.map((c) => [c.label, c.id]));

  await db.insert(subjects).values([
    { matiere: "Analyse numérique", filiere: "Génie informatique", niveau: "L2", annee: "2024", type: "Partiel", corrige: true, downloads: 47 },
    { matiere: "Base de données", filiere: "Génie informatique", niveau: "L2", annee: "2023", type: "Examen", corrige: false, downloads: 31 },
    { matiere: "Algorithmique", filiere: "Génie informatique", niveau: "L1", annee: "2023", type: "Examen", corrige: true, downloads: 58 },
    { matiere: "Résistance des matériaux", filiere: "Génie civil", niveau: "L3", annee: "2023", type: "Rattrapage", corrige: false, downloads: 12 },
    { matiere: "Comptabilité générale", filiere: "Gestion", niveau: "L1", annee: "2022", type: "Examen", corrige: true, downloads: 22 },
    { matiere: "Réseaux informatiques", filiere: "Génie informatique", niveau: "L3", annee: "2024", type: "Partiel", corrige: false, downloads: 9 },
  ]);

  const [cite1, cite2, cite3, cite4] = await db
    .insert(cites)
    .values([
      {
        nom: "Cité Sainte-Thérèse",
        quartier: "Nkolbisson",
        distanceM: 650,
        description:
          "Cité calme tenue par la paroisse, portail fermé à 22 h, gardien la nuit. Forage et compteur individuel par chambre. Marché de Nkolbisson à 5 minutes à pied.",
        whatsapp: "+237600000011",
        photos: [
          "https://smp2uiacevm3zokj.public.blob.vercel-storage.com/cites/cite1-1-gP9DnOhFF68Y3kl1rGoPfm5TOztveX.png",
          "https://smp2uiacevm3zokj.public.blob.vercel-storage.com/cites/cite1-2-uwUdlSirLLIMb4nMM9U2FtPF9n2fF2.png",
        ],
      },
      {
        nom: "Résidence Le Campus",
        quartier: "Nkolbisson",
        distanceM: 900,
        description:
          "Résidence récente sur la route de l'UCAC. Eau courante, groupe électrogène en cas de coupure, cour fermée et parking motos.",
        whatsapp: "+237600000012",
        photos: [
          "https://smp2uiacevm3zokj.public.blob.vercel-storage.com/cites/cite2-1-JrocXC6LyqyQTlmrumIvPXVrFufdT0.png",
          "https://smp2uiacevm3zokj.public.blob.vercel-storage.com/cites/cite2-2-vNSHPWL9J1LDg4F5pRCEMQg0l2VWAF.png",
        ],
      },
      {
        nom: "Cité Les Palmiers",
        quartier: "Melen",
        distanceM: 1200,
        description:
          "Grande cité étudiante à Melen, à un carrefour desservi par les taxis. Cuisine commune par étage.",
        whatsapp: "+237600000013",
        photos: [
          "https://smp2uiacevm3zokj.public.blob.vercel-storage.com/cites/cite3-1-Us5lG13IcUn9NgCPh1jmOzie0XuqzX.png",
          "https://smp2uiacevm3zokj.public.blob.vercel-storage.com/cites/cite3-2-e636PPAJ9c6ZpCD1IF42BQwXP2vWSX.png",
        ],
      },
      {
        nom: "Résidence Akwa",
        quartier: "Biyem-Assi",
        distanceM: 2600,
        description:
          "Le moins cher de la sélection, plus loin du campus mais bien desservi. Eau de forage, gardien de jour.",
        whatsapp: "+237600000014",
        photos: [
          "https://smp2uiacevm3zokj.public.blob.vercel-storage.com/cites/cite4-1-ysQUcWJqSb6i8RB79OFB6X0SifLbji.png",
          "https://smp2uiacevm3zokj.public.blob.vercel-storage.com/cites/cite4-2-nKWnVcp673ecNZ0acdKJf1wBaIlYU5.png",
        ],
      },
    ])
    .returning();

  await db.insert(roomTypes).values([
    { citeId: cite1.id, type: "Chambre simple", surface: "9 m²", prixMensuel: 25000, stock: 3, sortOrder: 0 },
    { citeId: cite1.id, type: "Studio", surface: "16 m²", prixMensuel: 40000, stock: 1, sortOrder: 1 },
    { citeId: cite1.id, type: "Appartement", surface: "32 m²", prixMensuel: 75000, stock: 0, sortOrder: 2 },

    { citeId: cite2.id, type: "Chambre simple", surface: "11 m²", prixMensuel: 35000, stock: 2, sortOrder: 0 },
    { citeId: cite2.id, type: "Studio", surface: "18 m²", prixMensuel: 55000, stock: 0, sortOrder: 1 },

    { citeId: cite3.id, type: "Chambre simple", surface: "10 m²", prixMensuel: 30000, stock: 0, sortOrder: 0 },
    { citeId: cite3.id, type: "Studio", surface: "15 m²", prixMensuel: 45000, stock: 0, sortOrder: 1 },

    { citeId: cite4.id, type: "Chambre simple", surface: "9 m²", prixMensuel: 20000, stock: 5, sortOrder: 0 },
  ]);

  const [p1, p2, p3] = await db
    .insert(pressings)
    .values([
      { nom: "Pressing Bonne Presse", quartier: "Nkolbisson", distanceLabel: "400 m", badge: "Partenaire", whatsapp: "+237600000001" },
      { nom: "Net Express", quartier: "Nkolbisson", distanceLabel: "750 m", badge: "24 h", whatsapp: "+237600000002" },
      { nom: "Pressing Melen", quartier: "Melen", distanceLabel: "1,1 km", badge: "48 h", whatsapp: "+237600000003" },
    ])
    .returning();

  await db.insert(pressingTarifs).values([
    { pressingId: p1.id, article: "Chemise", prix: 500, sortOrder: 0 },
    { pressingId: p1.id, article: "Pantalon", prix: 700, sortOrder: 1 },
    { pressingId: p1.id, article: "Costume 2 pièces", prix: 2500, sortOrder: 2 },

    { pressingId: p2.id, article: "Chemise", prix: 400, sortOrder: 0 },
    { pressingId: p2.id, article: "Robe", prix: 1000, sortOrder: 1 },
    { pressingId: p2.id, article: "Draps", prix: 1500, sortOrder: 2 },

    { pressingId: p3.id, article: "Chemise", prix: 350, sortOrder: 0 },
    { pressingId: p3.id, article: "Pantalon", prix: 600, sortOrder: 1 },
    { pressingId: p3.id, article: "Veste", prix: 1200, sortOrder: 2 },
  ]);

  const PROGRAMME_PHOTOS: Record<string, string> = {
    "Génie informatique · L1":
      "https://smp2uiacevm3zokj.public.blob.vercel-storage.com/programme/g-nie-informatique-l1-jJdM5m8HxoshyDBsKZ44nvkfiCQpkG.png",
    "Génie informatique · L2":
      "https://smp2uiacevm3zokj.public.blob.vercel-storage.com/programme/g-nie-informatique-l2-XxB6pMJ1AUYhODSMrhdoJbPoBINhyt.png",
    "Génie informatique · L3":
      "https://smp2uiacevm3zokj.public.blob.vercel-storage.com/programme/g-nie-informatique-l3-VHfzrxQiYnbgpQvZpA2RfkYg3pzKb8.png",
    "Génie civil · L3":
      "https://smp2uiacevm3zokj.public.blob.vercel-storage.com/programme/g-nie-civil-l3-86gt83H7bLZldc98j5EXGuHDuo6R43.png",
    "Gestion · L1":
      "https://smp2uiacevm3zokj.public.blob.vercel-storage.com/programme/gestion-l1-23tDJ0VAqp7ucPgoei3mMjI4yStzwE.png",
  };

  const programme = (label: string, weekLabel: string, publishedAt: Date) => {
    const classeId = classeByLabel.get(label);
    const photoUrl = PROGRAMME_PHOTOS[label];
    if (!classeId || !photoUrl) return null;
    return { classeId, weekLabel, publishedAt, photoUrl };
  };

  await db.insert(programmePublications).values(
    [
      programme(
        "Génie informatique · L1",
        "Semaine du 15 au 20 sept.",
        new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      ),
      programme(
        "Génie informatique · L2",
        "Semaine du 15 au 20 sept.",
        new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      ),
      programme(
        "Génie informatique · L3",
        "Semaine du 8 au 13 sept.",
        new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      ),
      programme("Génie civil · L3", "Semaine du 15 au 20 sept.", new Date()),
      programme(
        "Gestion · L1",
        "Semaine du 1 au 6 sept.",
        new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      ),
    ].filter((p): p is NonNullable<typeof p> => p !== null)
  );

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
