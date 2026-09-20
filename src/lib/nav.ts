export function hasTabBar(pathname: string): boolean {
  if (pathname === "/sujets/proposer") return false;
  if (pathname.endsWith("/plein")) return false;
  if (pathname.startsWith("/installer")) return false;
  if (pathname.startsWith("/admin")) return false;
  return true;
}
