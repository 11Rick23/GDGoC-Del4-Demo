import type { DefaultSession } from "next-auth";
import type { SessionUserData } from "@/lib/auth/session-user";

declare module "next-auth" {
	interface Session {
		user?: DefaultSession["user"] & SessionUserData;
	}
}
