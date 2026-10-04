import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens, delegations } from "@/db/schema";

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [Google],
  session: { strategy: "database" },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as { role?: "etudiant" | "admin" }).role ?? "etudiant";
        /*
         * The promos this account is délégué of, read on the e-mail rather
         * than on a column of the account. A délégué can be named before ever
         * signing in, and this way the right is waiting for them when they
         * arrive instead of needing a second pass once the account exists.
         */
        const email = session.user.email?.toLowerCase();
        session.user.delegations = email
          ? (
              await db
                .select({ classeId: delegations.classeId })
                .from(delegations)
                .where(eq(delegations.email, email))
            ).map((d) => d.classeId)
          : [];
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id && user.email && adminEmails.includes(user.email.toLowerCase())) {
        await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
      }
    },
  },
});
