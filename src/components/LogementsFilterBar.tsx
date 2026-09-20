"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Chip } from "@/components/Chip";
import { PickerButton, type PickerOption } from "@/components/PickerButton";
import { CITE_DISTANCE_OPTIONS, CITE_PRICE_OPTIONS, CITE_QUARTIERS } from "@/lib/constants";

const TRI_OPTIONS: PickerOption[] = [
  { label: "Plus proche", value: "distance" },
  { label: "Prix croissant", value: "prix" },
];

export function LogementsFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pushParams = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    router.push(params.size ? `${pathname}?${params.toString()}` : pathname);
  };

  const tri = searchParams.get("tri") ?? "distance";
  const dist = searchParams.get("dist") ?? "";
  const prix = searchParams.get("prix") ?? "";
  const quartier = searchParams.get("quartier") ?? "";

  return (
    <div className="no-scrollbar -mx-5 mt-3.5 flex gap-2 overflow-x-auto px-5 pb-0.5">
      <PickerButton
        title="Trier par"
        value={tri}
        options={TRI_OPTIONS}
        onSelect={(v) => pushParams((p) => p.set("tri", v))}
        trigger={(open) => (
          <Chip
            label={TRI_OPTIONS.find((o) => o.value === tri)?.label ?? "Trier"}
            active={tri !== "distance"}
            onClick={open}
          />
        )}
      />
      <PickerButton
        title="Distance maximale"
        value={dist}
        options={CITE_DISTANCE_OPTIONS}
        onSelect={(v) => pushParams((p) => (v ? p.set("dist", v) : p.delete("dist")))}
        trigger={(open) => (
          <Chip
            label={CITE_DISTANCE_OPTIONS.find((o) => o.value === dist)?.label ?? "Distance"}
            active={!!dist}
            onClick={open}
          />
        )}
      />
      <PickerButton
        title="Budget mensuel"
        value={prix}
        options={CITE_PRICE_OPTIONS}
        onSelect={(v) => pushParams((p) => (v ? p.set("prix", v) : p.delete("prix")))}
        trigger={(open) => (
          <Chip
            label={CITE_PRICE_OPTIONS.find((o) => o.value === prix)?.label ?? "Prix"}
            active={!!prix}
            onClick={open}
          />
        )}
      />
      <PickerButton
        title="Quartier"
        value={quartier}
        options={[{ label: "Tous", value: "" }, ...CITE_QUARTIERS.map((q) => ({ label: q, value: q }))]}
        onSelect={(v) => pushParams((p) => (v ? p.set("quartier", v) : p.delete("quartier")))}
        trigger={(open) => <Chip label={quartier || "Quartier"} active={!!quartier} onClick={open} />}
      />
    </div>
  );
}
