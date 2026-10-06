import { headers } from "next/headers";
import { BackHeader } from "@/components/BackHeader";
import { InstallTabs } from "@/components/InstallTabs";
import { detectInstallTab, plateforme } from "@/lib/ua";

export const dynamic = "force-dynamic";

export default async function InstallerPage() {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") ?? "";

  return (
    <div className="min-h-dvh">
      <BackHeader title="Installer Campusly" fallbackHref="/" />
      {/* The tab says where they are; the platform says which browser they own.
          Inside an embedded browser the two differ, and only the second one
          can tell an Android student not to go looking for Safari. */}
      <InstallTabs defaultTab={detectInstallTab(userAgent)} plateforme={plateforme(userAgent)} />
    </div>
  );
}
