import { and, desc, eq, gt, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { classes, sondageReponses, sondages } from "@/db/schema";
import { DEVICE_COOKIE } from "@/lib/constants";

export type Sondage = typeof sondages.$inferSelect;

export type Resultats = {
  total: number;
  // One count per option, in display order, zeros included.
  parOption: number[];
};

export type ResultatsPromo = {
  promo: string | null;
  total: number;
  parOption: number[];
};

export function estOuvert(s: Pick<Sondage, "fermeLe">) {
  return s.fermeLe.getTime() > Date.now();
}

/* The poll the home screen and the admin box are about, if one is running. */
export async function getSondageOuvert(): Promise<Sondage | null> {
  const [row] = await db
    .select()
    .from(sondages)
    .where(gt(sondages.fermeLe, new Date()))
    .orderBy(desc(sondages.createdAt))
    .limit(1);
  return row ?? null;
}

/*
 * The latest poll whatever its state. The admin keeps seeing a closed poll's
 * results until the next one replaces it: closing is when the answer is
 * finally worth reading, not when it should disappear.
 */
export async function getDernierSondage(): Promise<Sondage | null> {
  const [row] = await db.select().from(sondages).orderBy(desc(sondages.createdAt)).limit(1);
  return row ?? null;
}

export async function getSondage(id: number): Promise<Sondage | null> {
  const [row] = await db.select().from(sondages).where(eq(sondages.id, id)).limit(1);
  return row ?? null;
}

export async function getResultats(sondage: Sondage): Promise<Resultats> {
  const rows = await db
    .select({ option: sondageReponses.option, n: sql<number>`count(*)::int` })
    .from(sondageReponses)
    .where(eq(sondageReponses.sondageId, sondage.id))
    .groupBy(sondageReponses.option);

  const parOption = sondage.options.map(() => 0);
  for (const r of rows) if (r.option >= 0 && r.option < parOption.length) parOption[r.option] = r.n;
  return { total: parOption.reduce((a, b) => a + b, 0), parOption };
}

/*
 * The same counts split by promo. Answers from a device that never chose its
 * promo are kept in their own line rather than dropped, so the lines always
 * add up to the total shown above them.
 */
export async function getResultatsParPromo(sondage: Sondage): Promise<ResultatsPromo[]> {
  const rows = await db
    .select({
      promo: classes.label,
      option: sondageReponses.option,
      n: sql<number>`count(*)::int`,
    })
    .from(sondageReponses)
    .leftJoin(classes, eq(classes.id, sondageReponses.classeId))
    .where(eq(sondageReponses.sondageId, sondage.id))
    .groupBy(classes.label, sondageReponses.option);

  const parPromo = new Map<string | null, number[]>();
  for (const r of rows) {
    const ligne = parPromo.get(r.promo) ?? sondage.options.map(() => 0);
    if (r.option >= 0 && r.option < ligne.length) ligne[r.option] = r.n;
    parPromo.set(r.promo, ligne);
  }

  return [...parPromo.entries()]
    .map(([promo, parOption]) => ({
      promo,
      parOption,
      total: parOption.reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => (a.promo === null ? 1 : b.promo === null ? -1 : b.total - a.total));
}

/* This device's answer, as an option index, or null. */
export async function getMaReponse(sondageId: number): Promise<number | null> {
  const store = await cookies();
  const deviceId = store.get(DEVICE_COOKIE)?.value;
  if (!deviceId) return null;
  const [row] = await db
    .select({ option: sondageReponses.option })
    .from(sondageReponses)
    .where(and(eq(sondageReponses.sondageId, sondageId), eq(sondageReponses.deviceId, deviceId)))
    .limit(1);
  return row?.option ?? null;
}
