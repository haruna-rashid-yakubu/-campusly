import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { SESSION_SECONDES } from "@/lib/constants";
import { delegations, sessions, users } from "@/db/schema";

/*
 * Sign-in for the native app.
 *
 * The app signs in through the web's own Google sign-in, opened in a system
 * browser sheet (see /api/v1/auth/mobile/start), and gets back a bearer token.
 * That token is a row in the same `session` table the web writes to: one place
 * to see who is signed in where, and one place to cut it off.
 */


/*
 * A session of its own for the app, opened once the browser sign-in has
 * succeeded. The browser's session stays the browser's: signing out of one
 * never signs out of the other.
 */
export async function creerSessionMobile(userId: string) {
  const sessionToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
  // As long as the web's, and pushed back the same way: the API reads it through auth() (see proxy).
  const expires = new Date(Date.now() + SESSION_SECONDES * 1000);
  await db.insert(sessions).values({ sessionToken, userId, expires });
  return sessionToken;
}

function bearer(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

export type MobileUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: "etudiant" | "admin";
  classeId: number | null;
  delegations: number[];
};

/** The signed-in user behind a request's bearer token, or null. */
export async function getMobileUser(request: Request): Promise<MobileUser | null> {
  const token = bearer(request);
  if (!token) return null;
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
      role: users.role,
      classeId: users.classeId,
      expires: sessions.expires,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.sessionToken, token), gt(sessions.expires, new Date())));
  if (!row) return null;
  const { expires, ...user } = row;

  // Used today: its full life again, once a day at most, as Auth.js does for the web's.
  const jour = 24 * 60 * 60 * 1000;
  if (expires.getTime() < Date.now() + SESSION_SECONDES * 1000 - jour) {
    await db
      .update(sessions)
      .set({ expires: new Date(Date.now() + SESSION_SECONDES * 1000) })
      .where(eq(sessions.sessionToken, token));
  }

  // Read on the e-mail, as on the web: a délégué can be named before signing in.
  const delegues = await db
    .select({ classeId: delegations.classeId })
    .from(delegations)
    .where(eq(delegations.email, user.email.toLowerCase()));

  return { ...user, delegations: delegues.map((d) => d.classeId) };
}

/** Ends the session behind a request's bearer token. */
export async function signOutMobile(request: Request) {
  const token = bearer(request);
  if (token) await db.delete(sessions).where(eq(sessions.sessionToken, token));
}
