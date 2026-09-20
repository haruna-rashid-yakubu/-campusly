"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckIcon, WarnIcon } from "@/components/icons";
import { hasTabBar } from "@/lib/nav";

type ToastVariant = "success" | "warn";
type ToastState = { message: string; variant: ToastVariant } | null;

const ToastContext = createContext<{
  show: (message: string, variant?: ToastVariant) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const bottom = hasTabBar(pathname)
    ? "calc(76px + var(--safe-bottom) + 12px)"
    : "calc(16px + var(--safe-bottom))";

  const show = useCallback((message: string, variant: ToastVariant = "success") => {
    setToast({ message, variant });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <div
          className="fixed left-4 right-4 z-50 mx-auto flex max-w-sm items-center gap-2.5 rounded-2xl bg-ink px-3.5 py-2.5 text-[13.5px] font-semibold leading-snug text-white shadow-lg anim-toast"
          style={{ bottom }}
          role="status"
        >
          <span className="flex-none">
            {toast.variant === "warn" ? <WarnIcon size={18} /> : <CheckIcon size={18} />}
          </span>
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
