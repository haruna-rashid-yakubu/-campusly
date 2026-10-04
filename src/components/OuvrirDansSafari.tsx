import Link from "next/link";
import { headers } from "next/headers";
import { Icon } from "@/components/icons";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { estIPhone, estNavigateurIntegre } from "@/lib/ua";
import { APP_URL } from "@/lib/constants";

/** Names the app we are sitting inside, so the advice points at a real button. */
function nomDeLAppli(userAgent: string): string {
  if (/whatsapp/i.test(userAgent)) return "WhatsApp";
  if (/instagram/i.test(userAgent)) return "Instagram";
  if (/fbav|fban|fb_iab/i.test(userAgent)) return "Facebook";
  return "cette appli";
}

/*
 * Campusly travels by WhatsApp link, so a lot of students meet it inside
 * WhatsApp's own browser — and there, adding it to the home screen is simply
 * impossible. Tapping Share gives Copy, Add to Reading List and nothing else:
 * iOS only offers "Add to Home Screen" from Safari itself. Someone who tries
 * and finds no such line concludes the app cannot be installed, when they
 * were one browser away.
 *
 * On Android the same embedded browser does offer Chrome's menu, so this
 * speaks only to iPhones, and only while we are inside another app — in
 * Safari it disappears on its own.
 */
export async function OuvrirDansSafari() {
  const userAgent = (await headers()).get("user-agent") ?? "";
  if (!estIPhone(userAgent) || !estNavigateurIntegre(userAgent)) return null;

  return (
    <div className="mb-4 rounded-[20px] border-[1.5px] border-teal bg-teal-tint-soft p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-[13px] bg-teal-tint text-teal-dark">
          <Icon name="safari" size={20} strokeWidth={1.7} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-extrabold">Pour l&rsquo;ajouter, passe par Safari</div>
          <p className="mt-0.5 text-[13.5px] leading-snug text-slate">
            Tu es dans le navigateur de {nomDeLAppli(userAgent)}. Son bouton Partager n&rsquo;a pas
            « Sur l&rsquo;écran d&rsquo;accueil » — ce n&rsquo;est pas toi, il ne l&rsquo;a jamais.
            Copie le lien, ouvre Safari et colle-le : l&rsquo;option y est.
          </p>
        </div>
      </div>
      <CopyLinkButton url={APP_URL} />
      <Link
        href="/installer"
        className="mt-2.5 flex h-[44px] items-center justify-center gap-1.5 rounded-[13px] text-[13.5px] font-bold text-teal-dark"
      >
        Voir les étapes
        <Icon name="right" size={16} strokeWidth={2.2} />
      </Link>
    </div>
  );
}
