"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/Toast";

/*
 * Saving the poster, by the route the phone in hand actually supports.
 *
 * Android downloads it to the gallery, which is where WhatsApp looks. iOS
 * refuses: a download lands in Files, not Photos, and a statut can only be
 * published from Photos — so there the honest instruction is the long press,
 * and a button promising a download would send people somewhere they cannot
 * use. Where the system share sheet exists it is offered first, since it can
 * hand the image straight to WhatsApp.
 */
export function EnregistrerAffiche({ surIPhone }: { surIPhone: boolean }) {
  const { show } = useToast();
  const [envoi, setEnvoi] = useState(false);

  const partager = async () => {
    setEnvoi(true);
    try {
      const reponse = await fetch("/statut/image");
      const blob = await reponse.blob();
      const fichier = new File([blob], "campusly-statut.png", { type: "image/png" });

      // canShare with the file is the only reliable test: a browser can have
      // navigator.share and still refuse files.
      if (navigator.canShare?.({ files: [fichier] })) {
        await navigator.share({ files: [fichier], title: "Campusly" });
        return;
      }

      if (surIPhone) {
        show("Appuie longuement sur l'image, puis « Ajouter aux photos »", "warn");
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "campusly-statut.png";
      a.click();
      URL.revokeObjectURL(url);
      show("Image enregistrée");
    } catch {
      show(
        surIPhone
          ? "Appuie longuement sur l'image pour l'enregistrer"
          : "Enregistrement impossible — appuie longuement sur l'image",
        "warn"
      );
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <>
      <button
        onClick={partager}
        disabled={envoi}
        className="press-scale mt-4 flex h-[54px] w-full items-center justify-center gap-2.5 rounded-2xl bg-teal text-[15.5px] font-bold text-white disabled:opacity-60 active:bg-teal-press"
      >
        <Icon name="share" size={19} strokeWidth={1.9} />
        {envoi ? "Préparation…" : surIPhone ? "Envoyer l'image" : "Enregistrer l'image"}
      </button>
      <p className="mt-2.5 text-[12.5px] leading-snug text-slate-light">
        {surIPhone
          ? "Si rien ne s'ouvre, appuie longuement sur l'image ci-dessus et choisis « Ajouter aux photos »."
          : "Si rien ne se passe, appuie longuement sur l'image ci-dessus pour l'enregistrer."}
      </p>
    </>
  );
}
