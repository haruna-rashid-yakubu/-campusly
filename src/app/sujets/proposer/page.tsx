import type { Metadata } from "next";
import { auth } from "@/auth";
import { BackHeader } from "@/components/BackHeader";
import { SignInRequired } from "@/components/SignInRequired";
import { ProposerForm } from "@/components/ProposerForm";
import { Icon } from "@/components/icons";
import { getPreferredClasse } from "@/lib/data";

export const metadata: Metadata = {
  title: "Proposer un sujet",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ProposerPage() {
  const session = await auth();
  if (!session?.user) {
    return <SignInRequired backHref="/sujets" title="Proposer un sujet" />;
  }

  const classe = await getPreferredClasse();
  const [defaultFiliere, defaultNiveau] = classe.split(" · ");

  return (
    <div className="min-h-dvh">
      <BackHeader title="Proposer un sujet" fallbackHref="/sujets" border />
      <div className="px-5 pt-4">
        <div className="mb-1 flex items-center gap-2.5 rounded-[15px] border border-line bg-surface-3 p-3">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-teal text-[15px] font-extrabold text-white">
            {session.user.name?.[0]?.toUpperCase() ?? "?"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-bold">{session.user.name}</div>
            <div className="truncate text-[12.5px] text-slate-light">{session.user.email}</div>
          </div>
          <Icon name="check" size={18} className="flex-none text-teal-dark" />
        </div>
      </div>
      <ProposerForm defaultFiliere={defaultFiliere ?? ""} defaultNiveau={defaultNiveau ?? ""} />
    </div>
  );
}
