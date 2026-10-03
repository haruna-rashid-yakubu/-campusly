import { headers } from "next/headers";
import { BackHeader } from "@/components/BackHeader";
import { InstallTabs } from "@/components/InstallTabs";
import { detectInstallTab } from "@/lib/ua";

export const dynamic = "force-dynamic";

export default async function InstallerPage() {
  const headersList = await headers();
  const defaultTab = detectInstallTab(headersList.get("user-agent") ?? "");

  return (
    <div className="min-h-dvh">
      <BackHeader title="Installer Campusly" fallbackHref="/" />
      <InstallTabs defaultTab={defaultTab} />
    </div>
  );
}
