import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profils, users } from "@/db/schema";

export type Profil = { prenom: string | null; nom: string | null; telephone: string | null };

const VIDE: Profil = { prenom: null, nom: null, telephone: null };

/*
 * "6 90 00 00 00", "+237690000000", "00237 690…" all become "237690000000".
 * A Cameroonian mobile is nine digits starting with 6; anything else is kept
 * as typed (digits only) for the student abroad, or refused when too short.
 */
export function normaliserTelephone(brut: string | null | undefined): string | null {
  const chiffres = (brut ?? "").replace(/\D/g, "").replace(/^00/, "");
  if (chiffres.length === 9 && chiffres.startsWith("6")) return `237${chiffres}`;
  if (chiffres.length < 9 || chiffres.length > 15) return null;
  return chiffres;
}

function propre(texte: string | null | undefined, max = 60) {
  const t = (texte ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  return t || null;
}

export function nettoyerProfil(p: Partial<Profil>): Profil {
  return { prenom: propre(p.prenom), nom: propre(p.nom), telephone: normaliserTelephone(p.telephone) };
}

/** The account's profile when signed in, else this device's. */
export async function lireProfil(deviceId: string | null, userId: string | null): Promise<Profil> {
  if (userId) {
    const [u] = await db
      .select({ prenom: users.prenom, nom: users.nom, telephone: users.telephone })
      .from(users)
      .where(eq(users.id, userId));
    if (u && (u.prenom || u.telephone)) return u;
  }
  if (!deviceId) return VIDE;
  const [p] = await db
    .select({ prenom: profils.prenom, nom: profils.nom, telephone: profils.telephone })
    .from(profils)
    .where(eq(profils.deviceId, deviceId));
  return p ?? VIDE;
}

/*
 * Written on the device, and on the account too when there is one. Fields
 * left empty do not wipe what is already known: skipping a step later must
 * not erase it.
 */
export async function ecrireProfil(
  deviceId: string,
  userId: string | null,
  classeId: number | null,
  entree: Partial<Profil>
) {
  const p = nettoyerProfil(entree);
  const champs = Object.fromEntries(Object.entries(p).filter(([, v]) => v !== null)) as Partial<Profil>;
  await db
    .insert(profils)
    .values({ deviceId, userId, classeId, ...champs })
    .onConflictDoUpdate({
      target: profils.deviceId,
      set: { ...champs, ...(userId ? { userId } : {}), ...(classeId ? { classeId } : {}), majLe: new Date() },
    });
  if (userId && Object.keys(champs).length > 0) {
    await db.update(users).set(champs).where(eq(users.id, userId));
  }
  return lireProfil(deviceId, userId);
}

/*
 * On sign-in: what the device already knows fills the account's blanks, and
 * the device is tied to the account. The account's own answers are kept.
 */
export async function rattacherProfil(deviceId: string, userId: string) {
  const [appareil] = await db.select().from(profils).where(eq(profils.deviceId, deviceId));
  if (!appareil) return;
  const [compte] = await db
    .select({ prenom: users.prenom, nom: users.nom, telephone: users.telephone })
    .from(users)
    .where(eq(users.id, userId));
  if (!compte) return;
  const manquants = {
    ...(compte.prenom ? {} : appareil.prenom ? { prenom: appareil.prenom } : {}),
    ...(compte.nom ? {} : appareil.nom ? { nom: appareil.nom } : {}),
    ...(compte.telephone ? {} : appareil.telephone ? { telephone: appareil.telephone } : {}),
  };
  if (Object.keys(manquants).length > 0) await db.update(users).set(manquants).where(eq(users.id, userId));
  await db.update(profils).set({ userId }).where(eq(profils.deviceId, deviceId));
}
