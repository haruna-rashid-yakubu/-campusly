import { FideliteInvite } from "@/components/commander/FideliteInvite";
import type { ProgresHebdo, RegleHebdo } from "@/lib/fidelite";
import { IconeEmoji } from "@/components/TexteIcone";

/*
 * The weekly card: a bar that fills with the dishes delivered since Monday,
 * and the one sentence that matters — how many are left, or that the gift
 * comes with the next order. Signed out, the rule and the reason to sign in.
 */
export function CarteHebdo({
  regle,
  progres,
  vendeurNom,
}: {
  regle: RegleHebdo;
  progres: ProgresHebdo | null;
  vendeurNom: string;
}) {
  if (!progres) {
    return <FideliteInvite texte={`${regle.seuil} plats dans la semaine : ${regle.libelle}. Connecte-toi pour cumuler`} />;
  }
  const plats = Math.min(progres.plats, regle.seuil);
  return (
    <div className="mt-3 rounded-[18px] border-[1.5px] border-[var(--v-bord,#f7b6c9)] bg-[var(--v-doux,#fff6f9)] p-3.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[14.5px] font-extrabold">Ta carte fidélité {vendeurNom}</span>
        <span className="text-[12.5px] font-bold tabular-nums text-[var(--v-fonce,#c2185b)]">
            {plats}/{regle.seuil} plats
          </span>
      </div>
      <div className="mt-2.5 h-3 overflow-hidden rounded-full bg-white ring-1 ring-[var(--v-bord,#f0a3bd)]">
        <div className="h-full rounded-full bg-[var(--v-accent,#e5528a)]" style={{ width: `${(plats / regle.seuil) * 100}%` }} />
      </div>
      <div className="mt-2.5 text-[12.5px] leading-snug text-ink-soft">
        {progres.dejaOffert ? (
          <>Cadeau de la semaine déjà offert. Ta carte repart à zéro lundi.</>
        ) : progres.cadeauPret ? (
          <span className="inline-flex items-center gap-1.5 font-extrabold text-[var(--v-fonce,#c2185b)]">
            <IconeEmoji emoji={regle.icone} fallback="gift" size={15} /> Ta prochaine commande : {regle.libelle} !
          </span>
        ) : (
          <>
            Encore <b>{regle.seuil - plats}</b> plat{regle.seuil - plats > 1 ? "s" : ""} cette semaine avant :{" "}
            {regle.libelle}. Un plat compte quand {vendeurNom} l&rsquo;a livré. Remise à zéro chaque lundi.
          </>
        )}
      </div>
    </div>
  );
}
