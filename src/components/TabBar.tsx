"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Agent } from "@/components/Agent";
import { Icon, type IconName } from "@/components/icons";

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Accueil", icon: "home" },
  { href: "/sujets", label: "Sujets", icon: "doc" },
  { href: "/programme", label: "Programme", icon: "cal" },
];

/*
 * The tab bar, with the assistant in the middle: not a page but the thing
 * that does the pages' work, so it opens over whichever screen it is called
 * from and closes back onto it.
 */
export function TabBar() {
  const pathname = usePathname();
  const [assistant, setAssistant] = useState(false);

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
        {[...TABS.slice(0, 2), null, TABS[2]].map((tab) => {
          if (!tab) {
            // A tab like the others; lit while the assistant is open over the page.
            return (
              <button
                key="assistant"
                onClick={() => setAssistant(true)}
                aria-label="Assistant Campusly"
                aria-expanded={assistant}
                className="press-scale flex min-h-[62px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 pb-3 pt-1"
                style={{
                  background: assistant ? "var(--color-teal-tint)" : "transparent",
                  color: assistant ? "var(--color-teal-active)" : "var(--color-slate-light)",
                }}
              >
                <span className="grid h-[34px] place-items-center">
                  <Icon name="spark" size={23} strokeWidth={assistant ? 2.1 : 1.6} />
                </span>
                <span className="text-[10.5px] font-bold tracking-[0.01em]">Assistant</span>
              </button>
            );
          }
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className="press-scale flex min-h-[62px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 pb-3 pt-1"
              style={{
                background: active ? "var(--color-teal-tint)" : "transparent",
                color: active ? "var(--color-teal-active)" : "var(--color-slate-light)",
              }}
            >
              <span className="grid h-[34px] place-items-center">
                <Icon name={tab.icon} size={23} strokeWidth={active ? 2.1 : 1.6} />
              </span>
              <span className="text-[10.5px] font-bold tracking-[0.01em]">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
      {/* On <body>: inside the bar's own layer, the page's higher layers would cover it. */}
      {assistant && createPortal(<Agent onFermer={() => setAssistant(false)} />, document.body)}
    </div>
  );
}
