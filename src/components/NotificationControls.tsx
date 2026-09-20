"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { subscribePush, unsubscribePush } from "@/lib/actions";

const SUBSCRIBED_KEY = "campusly:notif-subscribed";

type Status = "unsupported" | "denied" | "default" | "active";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function readStatus(): Status {
  const supported =
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
  if (!supported) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission === "granted" && window.localStorage.getItem(SUBSCRIBED_KEY) === "1") {
    return "active";
  }
  return "default";
}

export function NotificationControls() {
  const { show } = useToast();
  const [status, setStatus] = useState<Status>("unsupported");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus(readStatus());
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(readStatus());
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      await subscribePush(subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } });
      window.localStorage.setItem(SUBSCRIBED_KEY, "1");
      setStatus("active");
      show("Notifications activées");
    } catch {
      show("Impossible d'activer les notifications", "warn");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await unsubscribePush(subscription.endpoint);
        await subscription.unsubscribe();
      }
      window.localStorage.removeItem(SUBSCRIBED_KEY);
      setStatus(readStatus());
      show("Notifications désactivées");
    } catch {
      show("Impossible de désactiver les notifications", "warn");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-5 mt-3 rounded-[20px] border border-line bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-[13px] bg-teal-tint text-teal-dark">
          <Icon name="bell" size={19} />
        </span>
        <div className="flex-1 pr-1.5">
          <div className="text-[15px] font-extrabold">
            {status === "active" ? "Notifications activées" : "Active les notifications"}
          </div>
          <div className="mt-0.5 text-[13px] leading-relaxed text-slate-light">
            {status === "unsupported" &&
              "Pas disponible sur ce navigateur ou cet appareil."}
            {status === "denied" &&
              "Bloquées pour Campusly — active-les dans les réglages de ton navigateur."}
            {status === "default" &&
              "Sois prévenu dès qu'un programme ou un sujet est publié sur Campusly."}
            {status === "active" && "Tu recevras une notification sur cet appareil."}
          </div>
        </div>
      </div>
      {status === "default" && (
        <button
          onClick={enable}
          disabled={busy}
          className="press-scale mt-3.5 flex h-[46px] w-full items-center justify-center rounded-[13px] bg-teal text-[14.5px] font-bold text-white active:bg-teal-press disabled:opacity-60"
        >
          Activer
        </button>
      )}
      {status === "active" && (
        <button
          onClick={disable}
          disabled={busy}
          className="press-scale mt-3.5 flex h-[46px] w-full items-center justify-center rounded-[13px] border-[1.5px] border-line-4 bg-white text-[14.5px] font-bold text-ink active:bg-surface-3 disabled:opacity-60"
        >
          Désactiver
        </button>
      )}
    </div>
  );
}
