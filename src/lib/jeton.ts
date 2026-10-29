import { createHmac, timingSafeEqual } from "node:crypto";

/*
 * A download link that says who asked for it. The app opens papers in its
 * in-app browser, which carries no session, and a signed-in page hands out
 * plain links: so the link itself carries the account, signed with the
 * session secret and good for twelve hours. Passed on to someone else, it
 * still counts against, and marks the file with, the account that took it.
 */
const DUREE = 12 * 60 * 60 * 1000;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET manquant : les liens de fichiers ne peuvent pas être signés.");
  return s;
}

const signature = (corps: string) => createHmac("sha256", secret()).update(corps).digest("base64url").slice(0, 22);

export function jetonFichier(userId: string, maintenant = Date.now()) {
  const corps = `${Buffer.from(userId).toString("base64url")}.${Math.floor((maintenant + DUREE) / 1000).toString(36)}`;
  return `${corps}.${signature(corps)}`;
}

/** The account a link was signed for, or null when it is forged or expired. */
export function lireJeton(jeton: string | null | undefined, maintenant = Date.now()): string | null {
  const [qui, fin, sig] = (jeton ?? "").split(".");
  if (!qui || !fin || !sig) return null;
  const attendue = Buffer.from(signature(`${qui}.${fin}`));
  const recue = Buffer.from(sig);
  if (attendue.length !== recue.length || !timingSafeEqual(attendue, recue)) return null;
  if (parseInt(fin, 36) * 1000 < maintenant) return null;
  return Buffer.from(qui, "base64url").toString();
}
