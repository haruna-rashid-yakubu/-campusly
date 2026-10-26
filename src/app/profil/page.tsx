import type { Metadata } from "next";
import { auth } from "@/auth";
import { BackHeader } from "@/components/BackHeader";
import { ClasseSwitcher } from "@/components/ClasseSwitcher";
import { ProfilForm } from "@/components/ProfilForm";
import { SignInButton } from "@/components/SignInButton";
import { SignOutButton } from "@/components/SignOutButton";
import { getProfilCourant } from "@/lib/actions";
import { getClasses, getPreferredClasse } from "@/lib/data";

export const metadata: Metadata = { title: "Mon profil", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const [session, profil, classe, classes] = await Promise.all([
    auth(),
    getProfilCourant(),
    getPreferredClasse(),
    getClasses(),
  ]);

  return (
    <div className="min-h-dvh pb-[calc(92px+var(--safe-bottom))]">
      <BackHeader title="Mon profil" fallbackHref="/" />
      <div className="px-5 pt-2">
        <div className="text-[13.5px] font-bold text-ink-soft">Ma classe</div>
        <ClasseSwitcher value={classe} classes={classes.map((c) => c.label)} variant="field" />

        <div className="mt-6">
          <ProfilForm prenom={profil.prenom} nom={profil.nom} telephone={profil.telephone} />
        </div>

        <div className="mt-6 rounded-[20px] border border-line p-4">
          {session?.user ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[15px] font-extrabold">Connecté avec Google</div>
                <div className="truncate text-[13.5px] text-slate">{session.user.email}</div>
              </div>
              <SignOutButton />
            </div>
          ) : (
            <>
              <div className="text-[15px] font-extrabold">Garde ton profil sur tous tes appareils</div>
              <p className="mt-0.5 text-[13.5px] text-slate">Connecte-toi avec Google, c&rsquo;est tout.</p>
              <div className="mt-3 flex">
                <SignInButton className="press-scale flex h-[48px] flex-1 items-center justify-center rounded-2xl bg-teal text-[15px] font-bold text-white active:bg-teal-press disabled:opacity-60" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
