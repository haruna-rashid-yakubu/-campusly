import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { BackHeader } from "@/components/BackHeader";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/icons";
import { NotificationControls } from "@/components/NotificationControls";
import { getNotificationFeed } from "@/lib/data";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function timeAgo(date: Date) {
  const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} j`;
  return date.toLocaleDateString("fr-FR");
}

export default async function NotificationsPage() {
  const session = await auth();
  const feed = await getNotificationFeed(session?.user?.id);

  return (
    <div className="min-h-dvh pb-[calc(92px+var(--safe-bottom))]">
      <BackHeader title="Notifications" border />

      <NotificationControls />

      <div className="px-5 pt-5">
        {feed.length === 0 ? (
          <EmptyState icon="bell" title="Rien pour l'instant" body="Tu seras prévenu ici dès qu'un programme ou un sujet est publié." />
        ) : (
          feed.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 border-b border-line-3 py-3.5 active:opacity-60"
            >
              <span className="grid h-[46px] w-[46px] flex-none place-items-center rounded-[14px] bg-surface text-teal-dark">
                <Icon name={item.icon} size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-bold">{item.title}</span>
                <span className="mt-0.5 block truncate text-[12.5px] text-slate-light">{item.subtitle}</span>
              </span>
              <span className="flex-none text-[12px] text-slate-light">{timeAgo(item.date)}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
