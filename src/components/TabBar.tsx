"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Agent } from "@/components/Agent";
import { Icon, type IconName } from "@/components/icons";
import { Logo } from "@/components/Logo";

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Accueil", icon: "home" },
  { href: "/sujets", label: "Sujets", icon: "doc" },
  { href: "/programme", label: "Programme", icon: "cal" },
];

const SERVICES: { href: string; label: string; icon: IconName }[] = [
  { href: "/commander", label: "Commander", icon: "bag" },
  { href: "/logements", label: "Logements", icon: "bed" },
  { href: "/pressing", label: "Pressing", icon: "shirt" },
  { href: "/notifications", label: "Notifications", icon: "bell" },
];

const estActif = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

/*
 * The app's navigation. On a phone and a tablet, the tab bar at the bottom;
 * from a laptop's width, a sidebar on the left with the same tabs and the
 * services, which a wide screen has room to name. The assistant sits among
 * the tabs: not a page but the thing that does the pages' work, so it opens
 * over whichever screen it is called from — on a laptop, as a panel on the
 * right, with the page still in view.
 */
export function TabBar() {
  const pathname = usePathname();
  const [assistant, setAssistant] = useState(false);

  const ongletAssistant = (
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

  const lienLateral = (t: { href: string; label: string; icon: IconName }) => {
    const actif = estActif(pathname, t.href);
    return (
      <Link
        key={t.href}
        href={t.href}
        aria-current={actif ? "page" : undefined}
        className={`flex h-11 items-center gap-3 rounded-xl px-3 text-[14.5px] font-bold transition-colors ${
          actif ? "bg-teal-tint text-teal-active" : "text-slate hover:bg-surface hover:text-ink"
        }`}
      >
        <Icon name={t.icon} size={20} strokeWidth={actif ? 2.1 : 1.7} />
        {t.label}
      </Link>
    );
  };

  return (
    <>
      {/* Phones and tablets: the tab bar. */}
      <div className="fixed inset-x-0 bottom-0 z-10 lg:hidden">
        <div
          className="pointer-events-none h-8"
          style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.97) 85%)" }}
        />
        <nav
          aria-label="Navigation principale"
          className="border-t border-[#EAEFF1] bg-white/97 px-1.5 pt-2 backdrop-blur-md"
          style={{ paddingBottom: "var(--safe-bottom)" }}
        >
          <div className="mx-auto flex max-w-[560px]">
            {[...TABS.slice(0, 2), null, TABS[2]].map((tab) => {
              if (!tab) return ongletAssistant;
              const active = estActif(pathname, tab.href);
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
          </div>
        </nav>
      </div>

      {/* Laptops and desktops: the sidebar. Its id is what makes the content leave room for it (globals.css). */}
      <aside
        id="cy-barre-laterale"
        aria-label="Navigation principale"
        className="fixed inset-y-0 left-0 z-10 hidden w-[248px] flex-col border-r border-line bg-white px-3.5 py-5 lg:flex"
      >
        <Link href="/" className="mb-6 flex items-center gap-2.5 px-2">
          <Logo size={34} />
          <span className="text-[19px] font-extrabold tracking-tight">Campusly</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {TABS.slice(0, 2).map(lienLateral)}
          <button
            onClick={() => setAssistant(true)}
            aria-expanded={assistant}
            className={`flex h-11 items-center gap-3 rounded-xl px-3 text-left text-[14.5px] font-bold transition-colors ${
              assistant ? "bg-teal-tint text-teal-active" : "text-slate hover:bg-surface hover:text-ink"
            }`}
          >
            <Icon name="spark" size={20} strokeWidth={assistant ? 2.1 : 1.7} />
            Assistant
          </button>
          {lienLateral(TABS[2])}
        </nav>
        <div className="mb-1.5 mt-7 px-3 text-[11.5px] font-black uppercase tracking-[.08em] text-slate-light">Services</div>
        <nav className="flex flex-col gap-1">{SERVICES.map(lienLateral)}</nav>
        <div className="mt-auto rounded-2xl bg-surface p-3.5">
          <div className="text-[13.5px] font-extrabold">Campusly sur ton téléphone</div>
          <p className="mt-1 text-[12.5px] leading-snug text-slate">Les rappels de cours et les nouveaux sujets, en notification.</p>
          <Link href="/installer" className="mt-2.5 inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-[13px] font-bold text-teal-dark ring-1 ring-line hover:bg-teal-tint">
            Installer l&rsquo;app
            <Icon name="right" size={14} strokeWidth={2.4} />
          </Link>
        </div>
      </aside>

      {/* On <body>: inside a navigation layer, the page's higher layers would cover it. */}
      {assistant && createPortal(<Agent onFermer={() => setAssistant(false)} />, document.body)}
    </>
  );
}
