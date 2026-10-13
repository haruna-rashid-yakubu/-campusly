import { SignInButton } from "@/components/SignInButton";
import { LIBELLES, type Carte } from "@/lib/fidelite";

/*
 * Ten boxes, the gifts drawn on the ones that carry them, the done ones
 * filled. Below, the one sentence that matters: what the next order brings,
 * or how far the next gift is.
 *
 * Signed out, the same card is shown empty with the reason to sign in — the
 * card is tied to the account so that it survives a new phone.
 */
export function CarteFidelite({ carte, vendeurNom }: { carte: Carte | null; vendeurNom: string }) {
  const vide = carte === null;
  const cases =
    carte?.cases ??
    Array.from({ length: 10 }, (_, i) => ({
      numero: i + 1,
      cadeau: i + 1 === 10 ? ("pack4" as const) : i + 1 === 3 || i + 1 === 6 ? ("donut" as const) : null,
      faite: false,
    }));

  return (
    <div className="mt-3 rounded-[18px] border-[1.5px] border-[#f7b6c9] bg-[#fff6f9] p-3.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[14.5px] font-extrabold">Ta carte fidélité {vendeurNom}</span>
        {carte && <span className="text-[12.5px] font-bold text-[#c2185b]">{carte.tampons}/10</span>}
      </div>
      <div className="mt-2.5 grid grid-cols-10 gap-1">
        {cases.map((c) => (
          <div
            key={c.numero}
            className={`grid aspect-square place-items-center rounded-full text-[13px] ${
              c.faite ? "bg-[#e5528a] text-white" : "border-[1.5px] border-dashed border-[#f0a3bd] bg-white"
            }`}
            title={c.cadeau ? LIBELLES[c.cadeau] : undefined}
          >
            {c.faite ? "✓" : c.cadeau === "pack4" ? "🎁" : c.cadeau === "donut" ? "🍩" : ""}
          </div>
        ))}
      </div>
      <div className="mt-2.5 text-[12.5px] leading-snug text-ink-soft">
        {vide ? (
          <>
            3ᵉ et 6ᵉ commande : 1 donut offert · 10ᵉ commande : 1 pack de 4 offert.{" "}
            <span className="font-bold">Connecte-toi pour cumuler tes commandes</span> <SignInButton />
          </>
        ) : carte.prochaine ? (
          <span className="font-extrabold text-[#c2185b]">
            🎁 Ta prochaine commande : {LIBELLES[carte.prochaine]} !
          </span>
        ) : (
          <>
            Encore <b>{carte.prochainCadeau.dans}</b> commande{carte.prochainCadeau.dans > 1 ? "s" : ""} avant{" "}
            {LIBELLES[carte.prochainCadeau.recompense]}. Une commande compte quand {vendeurNom} l&rsquo;a livrée.
          </>
        )}
      </div>
    </div>
  );
}
