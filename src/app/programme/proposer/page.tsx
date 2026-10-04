import type { Metadata } from "next";
import { auth } from "@/auth";
import { BackHeader } from "@/components/BackHeader";
import { SignInRequired } from "@/components/SignInRequired";
import { ProposerProgrammeForm } from "@/components/ProposerProgrammeForm";
import { getClasses, getPreferredClasse } from "@/lib/data";
import { addDays, mondayOf, nowInWAT, toISODate, weekRangeLabel } from "@/lib/semaine";

export const metadata: Metadata = {
  title: "Proposer l'emploi du temps",
};

export const dynamic = "force-dynamic";

export default async function ProposerProgrammePage() {
  const session = await auth();
  if (!session?.user) {
    return <SignInRequired backHref="/programme" title="Proposer l'emploi du temps" />;
  }

  const [classes, classe] = await Promise.all([getClasses(), getPreferredClasse()]);

  // This week and the next, and nothing else: the board is photographed either
  // the day it goes up or the day it starts, never three weeks ahead.
  const lundi = mondayOf(nowInWAT());
  const semaines = [lundi, addDays(lundi, 7)].map((d, i) => ({
    value: toISODate(d),
    label: `${i === 0 ? "Cette semaine" : "Semaine prochaine"} · ${weekRangeLabel(d)}`,
  }));

  return (
    <div className="min-h-dvh">
      <BackHeader title="Proposer l'emploi du temps" fallbackHref="/programme" border />
      <ProposerProgrammeForm
        classes={classes.map((c) => c.label)}
        defaultClasse={classe}
        semaines={semaines}
      />
    </div>
  );
}
