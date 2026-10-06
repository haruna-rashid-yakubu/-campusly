import Link from "next/link";
import { headers } from "next/headers";
import { Icon } from "@/components/icons";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { estNavigateurIntegre, plateforme } from "@/lib/ua";
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
 * another app's browser — and there, adding it to the home screen is simply
 * impossible. On an iPhone the Share button offers Copy and Add to Reading
 * List and nothing else: only Safari has "Sur l'écran d'accueil". On Android
 * the embedded browsers Instagram and Facebook carry are plain WebViews with
 * no install entry either.
 *
 * This used to speak only to iPhones, on the assumption that Android kept
 * Chrome's menu inside embedded browsers. That holds for a WhatsApp link,
 * which opens in a Chrome tab, but not for Instagram or Facebook — and those
 * students saw nothing at all, then landed on a page telling them to open
 * Safari. Both phones now get the banner, each pointed at a browser they have.
 */
export async function OuvrirDansSafari() {
  const userAgent = (await headers()).get("user-agent") ?? "";
  if (!estNavigateurIntegre(userAgent)) return null;

  const surIPhone = plateforme(userAgent) === "iPhone";
  const navigateur = surIPhone ? "Safari" : "Chrome";

  return (
    <div className="mb-4 rounded-[20px] border-[1.5px] border-teal bg-teal-tint-soft p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-[13px] bg-teal-tint text-teal-dark">
          <Icon name="safari" size={20} strokeWidth={1.7} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-extrabold">
            Pour l&rsquo;ajouter, passe par {navigateur}
          </div>
          <p className="mt-0.5 text-[13.5px] leading-snug text-slate">
            Tu es dans le navigateur de {nomDeLAppli(userAgent)}.{" "}
            {surIPhone
              ? "Son bouton Partager n'a pas « Sur l'écran d'accueil » — ce n'est pas toi, il ne l'a jamais."
              : "Il ne sait pas installer une appli sur l'écran d'accueil — ce n'est pas toi, il ne l'a jamais su."}{" "}
            Copie le lien, ouvre {navigateur} et colle-le : l&rsquo;option y est.
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
