import webpush from "web-push";
import { db } from "@/db";
import { pushSubscriptions, users } from "@/db/schema";
import { eq } from "drizzle-orm";

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:contact@campusly.app",
    publicKey,
    privateKey
  );
  configured = true;
  return true;
}

type PushPayload = { title: string; body: string; url?: string };

async function sendToSubscription(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
    }
  }
}

export async function sendPushToAll(payload: PushPayload) {
  if (!ensureConfigured()) return;
  const subs = await db.select().from(pushSubscriptions);
  await Promise.all(subs.map((s) => sendToSubscription(s, payload)));
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!ensureConfigured()) return;
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
  await Promise.all(subs.map((s) => sendToSubscription(s, payload)));
}

// Admins are the only people who can act on a new submission, so the alert
// goes to their devices only — every other subscriber would just be spammed.
export async function sendPushToAdmins(payload: PushPayload) {
  if (!ensureConfigured()) return;
  const subs = await db
    .select({
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
    })
    .from(pushSubscriptions)
    .innerJoin(users, eq(users.id, pushSubscriptions.userId))
    .where(eq(users.role, "admin"));
  await Promise.all(subs.map((s) => sendToSubscription(s, payload)));
}
