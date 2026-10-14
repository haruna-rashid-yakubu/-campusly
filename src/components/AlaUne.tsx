import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";

/*
 * The newest shop, shown big on the home screen for its first weeks: its own
 * photo, what it sells and for how much, and one button. A line in
 * "Nouveautés" is read by those who scroll; this is seen by everyone who
 * opens the app.
 */
export function AlaUne({
  href,
  nom,
  image,
  ligne,
  prix,
  offre,
}: {
  href: string;
  nom: string;
  image: string;
  ligne: string; // "Fraise · Menthe · Cacao"
  prix: string; // "500 F la bouteille"
  offre: string | null; // "Livraison gratuite sur le campus"
}) {
  return (
    <div className="px-5 pt-5">
      <Link
        href={href}
        className="press-scale relative block overflow-hidden rounded-[24px] bg-ink !text-white shadow-[0_10px_28px_rgba(15,23,42,.22)]"
      >
        <div className="relative aspect-[16/9] w-full">
          <Image src={image} alt={nom} fill priority sizes="(max-width: 480px) 100vw, 440px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-extrabold uppercase tracking-wide text-[#c2185b] shadow">
            Nouveau sur Campusly
          </span>
          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="text-[24px] font-extrabold leading-none tracking-tight">{nom}</div>
            <div className="mt-1 text-[13.5px] font-semibold text-white/90">{ligne}</div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="text-[15px] font-extrabold">{prix}</div>
            {offre && <div className="mt-0.5 truncate text-[12.5px] font-semibold text-[#5eead4]">🚚 {offre}</div>}
          </div>
          <span className="flex flex-none items-center gap-1 rounded-full bg-white px-4 py-2.5 text-[14px] font-extrabold text-ink">
            Commander
            <Icon name="right" size={15} strokeWidth={2.6} />
          </span>
        </div>
      </Link>
    </div>
  );
}
