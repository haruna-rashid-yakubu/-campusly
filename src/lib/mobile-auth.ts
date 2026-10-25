import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { accounts, delegations, sessions, users } from "@/db/schema";

/*
 * Sign-in for the native app.
 *
 * Auth.js lives on cookies and browser redirects, neither of which a phone app
 * has. So the app signs in with Google natively, hands us the ID token Google
 * gave it, and gets back a bearer token. That token is a row in the same
 * `session` table the web writes to: one place to see who is signed in where,
 * and one place to cut it off.
 */

const SESSION_DAYS = 90;

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// The web client ID is the audience when the app asks Google for an ID token
// with `webClientId`; the platform IDs are accepted too in case it does not.
const audiences = [process.env.AUTH_GOOGLE_ID, ...(process.env.GOOGLE_MOBILE_CLIENT_IDS ?? "").split(",")]
  .map((a) => a?.trim())
  .filter(Boolean) as string[];

type GoogleClaims = {
  sub: string;
  email: string;
  email_verified: string | boolean;
  name?: string;
  picture?: string;
  aud: string;
  iss: string;
  exp: string;
};

/*
 * Google's tokeninfo endpoint checks the signature and expiry for us. It is a
 * network round trip, but it only runs once per sign-in, which is rare enough
 * not to be worth carrying a JWKS cache for.
 */
async function verifyGoogleIdToken(idToken: string): Promise<GoogleClaims | null> {
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  const claims = (await res.json()) as GoogleClaims;
  if (!audiences.includes(claims.aud)) return null;
  if (claims.iss !== "accounts.google.com" && claims.iss !== "https://accounts.google.com") return null;
  if (claims.email_verified !== true && claims.email_verified !== "true") return null;
  if (Number(claims.exp) * 1000 < Date.now()) return null;
  return claims;
}

/** Exchanges a Google ID token for a session token, creating the account if needed. */
export async function signInWithGoogleIdToken(idToken: string) {
  const claims = await verifyGoogleIdToken(idToken);
  if (!claims) return null;
  const email = claims.email.toLowerCase();

  // Found the way the adapter would: by the Google account first, then by the
  // address, so someone who signed in on the web gets the same account here.
  const [lien] = await db
    .select({ userId: accounts.userId })
    .from(accounts)
    .where(and(eq(accounts.provider, "google"), eq(accounts.providerAccountId, claims.sub)));

  let userId = lien?.userId;
  if (!userId) {
    const [existant] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    userId = existant?.id;
    if (!userId) {
      const [cree] = await db
        .insert(users)
        .values({
          email,
          name: claims.name ?? null,
          image: claims.picture ?? null,
          emailVerified: new Date(),
          role: adminEmails.includes(email) ? "admin" : "etudiant",
        })
        .returning({ id: users.id });
      userId = cree.id;
    }
    await db
      .insert(accounts)
      .values({ userId, type: "oidc", provider: "google", providerAccountId: claims.sub })
      .onConflictDoNothing();
  }

  const sessionToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ sessionToken, userId, expires });

  return { token: sessionToken, expires };
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
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.sessionToken, token), gt(sessions.expires, new Date())));
  if (!row) return null;

  // Read on the e-mail, as on the web: a délégué can be named before signing in.
  const delegues = await db
    .select({ classeId: delegations.classeId })
    .from(delegations)
    .where(eq(delegations.email, row.email.toLowerCase()));

  return { ...row, delegations: delegues.map((d) => d.classeId) };
}

/** Ends the session behind a request's bearer token. */
export async function signOutMobile(request: Request) {
  const token = bearer(request);
  if (token) await db.delete(sessions).where(eq(sessions.sessionToken, token));
}
