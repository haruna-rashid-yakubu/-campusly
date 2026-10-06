import type { Metadata } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import { BackHeader } from "@/components/BackHeader";
import { EnregistrerAffiche } from "@/components/EnregistrerAffiche";
import { CopierTexte } from "@/components/CopierTexte";
import { plateforme } from "@/lib/ua";
import { APP_URL } from "@/lib/constants";

/*
 * The caption is where the address stays tappable. Printed on the poster it
 * has to be typed out by hand, and nobody types an address off someone
 * else's statut — so the poster carries the message, and this carries the
 * tap. Kept short on purpose: WhatsApp folds a long caption behind "lire la
 * suite", which would hide the link again.
 */
const LEGENDE = `Campusly, pour toute la cato. C'est gratuit.\n${APP_URL}`;

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Image pour ton statut",
  // Nothing here is worth indexing, and a poster is not a page.
  robots: { index: false, follow: false },
};

/*
 * There is no address that posts to a WhatsApp statut, so the app cannot do
 * it for anyone. This page hands over the finished poster instead: save it,
 * then publish it from WhatsApp like any photo. It is the one route that
 * behaves the same on every phone.
 */
export default async function StatutPage() {
  const surIPhone = plateforme((await headers()).get("user-agent") ?? "") === "iPhone";

  const etapes = [
    surIPhone
      ? "Appuie longuement sur l'image, puis « Ajouter aux photos »."
      : "Touche « Enregistrer l'image » : elle va dans ta galerie.",
    "Ouvre WhatsApp, onglet Actus, puis Statut, et choisis l'image.",
    "Colle la légende dans « Ajouter une légende », puis publie.",
  ];

  return (
    <div className="min-h-dvh">
      <BackHeader title="Image pour ton statut" fallbackHref="/" />
      <div className="px-5 pb-12 pt-2">
        <p className="mb-4 text-[14.5px] leading-relaxed text-slate">
          WhatsApp ne laisse aucun site publier un statut à ta place. Enregistre cette image et
          publie-la depuis WhatsApp : ça marche sur tous les téléphones.
        </p>

        <div className="overflow-hidden rounded-[20px] border border-line">
          <span className="relative block aspect-[9/16] w-full bg-teal-dark">
            <Image
              src="/statut/image"
              alt="Affiche Campusly à publier en statut"
              fill
              unoptimized
              priority
              className="object-cover"
            />
          </span>
        </div>

        <EnregistrerAffiche surIPhone={surIPhone} />

        <div className="mt-7 text-base font-extrabold">La légende, pour le lien cliquable</div>
        <p className="mt-1 text-[13.5px] leading-snug text-slate-light">
          L&rsquo;adresse imprimée sur l&rsquo;affiche se lit, mais ne se touche pas — aucune image
          ne peut contenir un lien. Colle ceci dans la légende du statut : là, WhatsApp la rend
          cliquable.
        </p>
        <CopierTexte texte={LEGENDE} label="Copier la légende" />

        <div className="mt-7 mb-3 text-base font-extrabold">Ensuite, en 3 étapes</div>
        {etapes.map((texte, i) => (
          <div key={texte} className="mb-3 flex gap-3.5 rounded-[20px] border border-line p-3.5">
            <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[11px] bg-teal text-[14px] font-extrabold text-white">
              {i + 1}
            </span>
            <div className="flex-1 text-[14.5px] font-semibold leading-snug">{texte}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
