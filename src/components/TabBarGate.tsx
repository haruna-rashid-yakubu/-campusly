"use client";

import { usePathname } from "next/navigation";
import { TabBar } from "@/components/TabBar";
import { hasTabBar } from "@/lib/nav";

export function TabBarGate() {
  const pathname = usePathname();
  if (!hasTabBar(pathname)) return null;
  return <TabBar />;
}
