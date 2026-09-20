"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";

const SUBSCRIBED_KEY = "campusly:notif-subscribed";

export function NotificationBell() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(
      typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted" &&
        window.localStorage.getItem(SUBSCRIBED_KEY) === "1"
    );
  }, []);

  return (
    <Link
      href="/notifications"
      className="press-scale relative grid h-11 w-11 place-items-center text-ink-soft"
      aria-label="Notifications"
    >
      <Icon name="bell" size={22} />
      {active && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-teal" />}
    </Link>
  );
}
