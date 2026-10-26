import { FideliteInvite } from "@/components/commander/FideliteInvite";
import { carteVide, resumeRegle, type Carte, type Regle } from "@/lib/fidelite";
import { Icon } from "@/components/icons";
import { IconeEmoji } from "@/components/TexteIcone";

/*
 * The shop's boxes, the gifts drawn on the ones that carry them, the done
 * ones filled. Below, the one sentence that matters: what the next order
 * brings, or how far the next gift is.
 *
 * Signed out it is a single line (FideliteInvite): the card is tied to the
 * account so that it survives a new phone.
 */
export function CarteFidelite({
  carte,
  regle,
  vendeurNom,
}: {
  carte: Carte | null;
  regle: Regle;
  vendeurNom: string;
}) {
  if (carte === null) return <FideliteInvite texte={`Carte fidélité : ${resumeRegle(regle)}. Connecte-toi pour cumuler`} />;
  const cases = carte.cases ?? carteVide(regle);

  return (
    <div className="mt-3 rounded-[18px] border-[1.5px] border-[#f7b6c9] bg-[#fff6f9] p-3.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[14.5px] font-extrabold">Ta carte fidélité {vendeurNom}</span>
        {carte && (
          <span className="text-[12.5px] font-bold text-[#c2185b]">
            {carte.tampons}/{regle.cycle}
          </span>
        )}
      </div>
      <div
        className="mt-2.5 grid gap-1"
        // Ten boxes fill the row; a shorter card keeps the same box size.
        style={{ gridTemplateColumns: `repeat(${Math.max(regle.cycle, 10)}, minmax(0, 1fr))` }}
      >
        {cases.map((c) => (
          <div
            key={c.numero}
            className={`grid aspect-square place-items-center rounded-full text-[13px] ${
              c.faite ? "bg-[#e5528a] text-white" : "border-[1.5px] border-dashed border-[#f0a3bd] bg-white"
            }`}
            title={c.cadeau?.libelle}
          >
            {c.faite ? <Icon name="check" size={15} strokeWidth={2.4} /> : c.cadeau ? <IconeEmoji emoji={c.cadeau.icone} fallback="gift" size={15} /> : null}
          </div>
        ))}
      </div>
      <div className="mt-2.5 text-[12.5px] leading-snug text-ink-soft">
        {carte.prochaine ? (
          <span className="inline-flex items-center gap-1.5 font-extrabold text-[#c2185b]"><Icon name="gift" size={15} strokeWidth={2} />Ta prochaine commande : {carte.prochaine.libelle} !</span>
        ) : (
          <>
            Encore <b>{carte.prochainCadeau.dans}</b> commande{carte.prochainCadeau.dans > 1 ? "s" : ""} avant{" "}
            {carte.prochainCadeau.palier.libelle}. Une commande compte quand {vendeurNom} l&rsquo;a livrée.
          </>
        )}
      </div>
    </div>
  );
}
