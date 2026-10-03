"use client";

import { subscribePush } from "@/lib/actions";

export const SUBSCRIBED_KEY = "campusly:notif-subscribed";

export type PushStatus =
  | "active" // subscribed on this device
  | "default" // can be asked
  | "denied" // refused at the browser level
  | "install-required" // iPhone, in Safari: needs the home screen first
  | "unsupported";

function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  // iPadOS 13+ reports itself as a Mac; the touch points give it away.
  return /iphone|ipad|ipod/.test(ua) || (/macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/*
 * Safari only allows web push once the site is on the home screen. In a tab
 * the API simply is not there, so the honest answer is not "unsupported on
 * this device" — it is "install it first", which is also the thing we want
 * people to do. Separating the two is what turns a dead end into a step.
 */
export function readPushStatus(): PushStatus {
  if (typeof window === "undefined") return "unsupported";
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return "unsupported";

  const hasApi = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
  if (!hasApi) return isIOS() && !isStandalone() ? "install-required" : "unsupported";

  if (Notification.permission === "denied") return "denied";
  if (Notification.permission === "granted" && localStorage.getItem(SUBSCRIBED_KEY) === "1") {
    return "active";
  }
  return "default";
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Asks, subscribes and records it. Returns the status the device ends in. */
export async function enablePush(): Promise<PushStatus> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return readPushStatus();

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
  });
  await subscribePush(
    subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
  );
  localStorage.setItem(SUBSCRIBED_KEY, "1");
  return "active";
}
