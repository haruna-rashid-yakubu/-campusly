"use client";

import { useTransition } from "react";
import { appSignOut } from "@/lib/actions";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => appSignOut())}
      className="text-[13px] font-bold text-slate-light underline-offset-2 active:underline disabled:opacity-60"
    >
      Se déconnecter
    </button>
  );
}
