"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Accueil", icon: "home" },
  { href: "/sujets", label: "Sujets", icon: "doc" },
  { href: "/programme", label: "Programme", icon: "cal" },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-0 z-10">
      <div
        className="pointer-events-none h-8"
        style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.97) 85%)" }}
      />
      <nav
        aria-label="Navigation principale"
        className="flex border-t border-[#EAEFF1] bg-white/97 px-1.5 pt-2 backdrop-blur-md"
        style={{ paddingBottom: "var(--safe-bottom)" }}
      >
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className="press-scale flex min-h-[62px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-0.5 pb-3 pt-1.5"
              style={{
                background: active ? "var(--color-teal-tint)" : "transparent",
                color: active ? "var(--color-teal-active)" : "var(--color-slate-light)",
              }}
            >
              <Icon name={tab.icon} size={23} strokeWidth={active ? 2.1 : 1.6} />
              <span className="text-[10.5px] font-bold tracking-[0.01em]">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
