import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import GoogleProvider from "next-auth/providers/google";
import { parseGoogleProfile } from "@/lib/auth/google-profile";
import {
  toSessionUserData,
  type DatabaseSessionUser,
} from "@/lib/auth/session-user";
import { db } from "@/lib/database";
import { accounts, sessions, users } from "@/lib/database/schema";
import { syncGoogleUserProfile } from "@/lib/database/users";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId) {
  throw new Error(
    "Missing required environment variable GOOGLE_CLIENT_ID for GoogleProvider",
  );
}

if (!googleClientSecret) {
  throw new Error(
    "Missing required environment variable GOOGLE_CLIENT_SECRET for GoogleProvider",
  );
}

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
  }),
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google" || !user.id) {
        return true;
      }

      const googleProfile = parseGoogleProfile(profile);
      if (!googleProfile) {
        return false;
      }

      await syncGoogleUserProfile(user.id, googleProfile);

      return true;
    },
    async session({ session, user }) {
      if (
        session.user &&
        "lastLoginAt" in user &&
        "createdAt" in user &&
        "updatedAt" in user
      ) {
        const appUser = toSessionUserData(user as unknown as DatabaseSessionUser);

        session.user.id = appUser.id;
        session.user.emailVerified = appUser.emailVerified;
        session.user.lastLoginAt = appUser.lastLoginAt;
        session.user.createdAt = appUser.createdAt;
        session.user.updatedAt = appUser.updatedAt;
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * サーバーサイドでセッションを取得するヘルパー関数
 */
export function auth() {
  return getServerSession(authOptions);
}
