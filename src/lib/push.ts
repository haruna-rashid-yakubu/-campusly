import webpush from "web-push";
import { db } from "@/db";
import { APP_URL } from "@/lib/constants";
import {
  delegations,
  notificationEnvois,
  notificationTypeEnum,
  pushSubscriptions,
  users,
} from "@/db/schema";
import { and, eq, ne, sql } from "drizzle-orm";

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(
    // The push services want a way to reach whoever operates the app. It used
    // to be an address at a domain that was never owned; the site itself is
    // both valid here and true.
    process.env.VAPID_SUBJECT ?? APP_URL,
    publicKey,
    privateKey
  );
  configured = true;
  return true;
}

type PushPayload = { title: string; body: string; url?: string };

type TypeEnvoi = (typeof notificationTypeEnum)[number];

/** True when the push service took the message. Never throws. */
async function sendToSubscription(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
    return true;
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
    }
    return false;
  }
}

/*
 * Sends, counts, and writes down what happened.
 *
 * Every path out of this file goes through here, so the log cannot drift from
 * reality: a send that is not recorded is a send that did not happen. The
 * write is guarded because a full log is worth less than a delivered message —
 * if recording fails, the notification has already gone.
 */
async function diffuser(
  subs: { endpoint: string; p256dh: string; auth: string }[],
  payload: PushPayload,
  type: TypeEnvoi,
  classeId: number | null = null
) {
  const resultats = await Promise.all(subs.map((s) => sendToSubscription(s, payload)));
  const atteints = resultats.filter(Boolean).length;
  try {
    await db.insert(notificationEnvois).values({
      type,
      classeId,
      titre: payload.title,
      corps: payload.body,
      atteints,
      vises: subs.length,
    });
  } catch {
    // The message is out; losing its line in the log is the lesser failure.
  }
  return atteints;
}

export async function sendPushToAll(payload: PushPayload) {
  if (!ensureConfigured()) return 0;
  const subs = await db.select().from(pushSubscriptions);
  return diffuser(subs, payload, "tous");
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!ensureConfigured()) return 0;
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
  return diffuser(subs, payload, "etudiant");
}

/*
 * Everyone in one promo. A device qualifies through the account it is signed
 * into, or failing that through the classe stamped on the subscription —
 * notifications can be turned on without ever signing in, and matching only
 * on the account would silently drop those people.
 */
export type PushKind = "programme" | "rappel";

export async function sendPushToClasse(
  classeId: number,
  payload: PushPayload,
  kind: PushKind
) {
  if (!ensureConfigured()) return 0;
  const pref =
    kind === "programme" ? pushSubscriptions.prefProgramme : pushSubscriptions.prefRappel;
  const subs = await db
    .select({
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
    })
    .from(pushSubscriptions)
    .leftJoin(users, eq(users.id, pushSubscriptions.userId))
    // The account wins when there is one: it follows the person across their
    // devices, while the stamp on the subscription can only ever describe the
    // device at the moment notifications were switched on. Falling back to it
    // is what keeps account-less devices reachable.
    .where(
      and(
        sql`coalesce(${users.classeId}, ${pushSubscriptions.classeId}) = ${classeId}`,
        eq(pref, true)
      )
    );

  return diffuser(subs, payload, kind, classeId);
}

// Admins are the only people who can act on a new submission, so the alert
// goes to their devices only — every other subscriber would just be spammed.
export async function sendPushToAdmins(payload: PushPayload) {
  if (!ensureConfigured()) return 0;
  const subs = await db
    .select({
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
    })
    .from(pushSubscriptions)
    .innerJoin(users, eq(users.id, pushSubscriptions.userId))
    .where(eq(users.role, "admin"));
  return diffuser(subs, payload, "admin", null);
}

/*
 * The délégués of one promo. They are the people who can actually act on what
 * just arrived for that promo, and nobody else needs to hear about it — an
 * admin gets the same alert through sendPushToAdmins, so between the two every
 * pair of hands that can do something is reached exactly once.
 *
 * Matched on the e-mail, the way the right itself is: a délégué named before
 * they ever signed in has no row to join on until they do, and then it simply
 * starts working.
 */
export async function sendPushToDelegues(classeId: number, payload: PushPayload) {
  if (!ensureConfigured()) return 0;
  const subs = await db
    .select({
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
    })
    .from(pushSubscriptions)
    .innerJoin(users, eq(users.id, pushSubscriptions.userId))
    .innerJoin(
      delegations,
      and(
        eq(delegations.classeId, classeId),
        sql`${delegations.email} = lower(${users.email})`
      )
    )
    // An admin who is also délégué would otherwise be buzzed twice for the
    // same event.
    .where(ne(users.role, "admin"));
  return diffuser(subs, payload, "delegue", classeId);
}

/*
 * One person, found by the address rather than by an account.
 *
 * Naming a délégué happens before they have necessarily ever opened the app,
 * so there may be no account and no device behind the address. The count comes
 * back so the screen can say which of the two happened: a phone that buzzed,
 * or someone who still has to be told by hand. Reporting "prévenu" when
 * nothing left the server would be the worst of both.
 */
export async function sendPushToEmail(email: string, payload: PushPayload) {
  if (!ensureConfigured()) return 0;
  const subs = await db
    .select({
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
    })
    .from(pushSubscriptions)
    .innerJoin(users, eq(users.id, pushSubscriptions.userId))
    .where(sql`lower(${users.email}) = ${email.toLowerCase()}`);
  return diffuser(subs, payload, "delegation", null);
}
