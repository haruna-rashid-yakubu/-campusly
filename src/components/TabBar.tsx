"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Accueil", icon: "home" },
  { href: "/sujets", label: "Sujets", icon: "doc" },
  { href: "/logements", label: "Logements", icon: "bed" },
  { href: "/pressing", label: "Pressing", icon: "shirt" },
  { href: "/programme", label: "Programme", icon: "cal" },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 flex border-t border-[#EAEFF1] bg-white/97 px-1.5 pt-2 backdrop-blur-md"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      {TABS.map((tab) => {
        const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
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
  );
}
