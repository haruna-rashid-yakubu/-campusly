import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SondageVote } from "@/components/SondageVote";
import { estOuvert, getMaReponse, getResultats, getSondage } from "@/lib/sondage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sondage",
  robots: { index: false },
};

function finLabel(d: Date) {
  return d.toLocaleString("fr-FR", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Douala",
  });
}

export default async function SondagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sondageId = Number(id);
  if (!Number.isInteger(sondageId)) notFound();

  const sondage = await getSondage(sondageId);
  if (!sondage) notFound();

  const [resultats, maReponse] = await Promise.all([getResultats(sondage), getMaReponse(sondage.id)]);
  const ouvert = estOuvert(sondage);

  return (
    <div className="min-h-dvh pb-[calc(92px+var(--safe-bottom))]">
      <div className="px-5" style={{ paddingTop: "calc(20px + var(--safe-top))" }}>
        <div className="text-[13px] font-bold uppercase tracking-wide text-teal-dark">
          Sondage Campusly
        </div>
        <h1 className="mt-1.5 text-[23px] font-extrabold leading-tight tracking-tight">
          {sondage.question}
        </h1>
        <div className="mt-1.5 text-[13px] text-slate-light">
          {ouvert ? `Ouvert jusqu'à ${finLabel(sondage.fermeLe)} · anonyme` : "Sondage terminé"}
        </div>
      </div>

      <div className="px-5 pt-5">
        <SondageVote
          sondageId={sondage.id}
          options={sondage.options}
          parOption={resultats.parOption}
          maReponse={maReponse}
          ouvert={ouvert}
        />

        <Link
          href="/"
          className="press-scale mt-6 flex h-[48px] w-full items-center justify-center rounded-[14px] border-[1.5px] border-line-4 text-[14.5px] font-bold"
        >
          Aller à l&rsquo;accueil
        </Link>
      </div>
    </div>
  );
}
