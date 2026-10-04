import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "etudiant" | "admin";
      /** Ids of the promos this account is délégué of. Empty for most people. */
      delegations: number[];
    } & DefaultSession["user"];
  }
}
