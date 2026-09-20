"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { Sheet } from "@/components/Sheet";
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

export function NotificationBell() {
  const { show } = useToast();
  const [open, setOpen] = useState(false);
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
    <>
      <button
        onClick={() => {
          setStatus(readStatus());
          setOpen(true);
        }}
        className="press-scale relative grid h-11 w-11 place-items-center text-ink-soft"
        aria-label="Notifications"
      >
        <Icon name="bell" size={22} />
        {status === "active" && (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-teal" />
        )}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Notifications">
        {status === "unsupported" && (
          <p className="py-2 text-[14px] leading-relaxed text-slate-light">
            Les notifications ne sont pas disponibles sur ce navigateur ou cet appareil.
          </p>
        )}
        {status === "denied" && (
          <p className="py-2 text-[14px] leading-relaxed text-slate-light">
            Les notifications sont bloquées pour Campusly. Active-les dans les réglages de ton
            navigateur pour ce site, puis reviens ici.
          </p>
        )}
        {status === "default" && (
          <>
            <p className="py-2 text-[14px] leading-relaxed text-slate-light">
              Sois prévenu dès qu&rsquo;un programme ou un sujet est publié sur Campusly.
            </p>
            <button
              onClick={enable}
              disabled={busy}
              className="press-scale mt-1 flex h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl bg-teal text-[15px] font-bold text-white active:bg-teal-press disabled:opacity-60"
            >
              <Icon name="bell" size={18} strokeWidth={1.9} />
              Activer les notifications
            </button>
          </>
        )}
        {status === "active" && (
          <>
            <p className="py-2 text-[14px] leading-relaxed text-slate-light">
              Les notifications sont activées sur cet appareil.
            </p>
            <button
              onClick={disable}
              disabled={busy}
              className="press-scale mt-1 flex h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-line-4 bg-white text-[15px] font-bold text-ink active:bg-surface-3 disabled:opacity-60"
            >
              Désactiver
            </button>
          </>
        )}
      </Sheet>
    </>
  );
}
