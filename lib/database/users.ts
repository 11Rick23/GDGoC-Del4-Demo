import { asc, eq, ne } from "drizzle-orm";
import type { GoogleProfile } from "@/lib/auth/google-profile";
import { db } from "@/lib/database";
import { users } from "@/lib/database/schema";

export async function syncGoogleUserProfile(
	userId: string,
	profile: GoogleProfile,
) {
	const now = new Date();

	await db
		.update(users)
		.set({
			email: profile.email,
			emailVerified: profile.emailVerified ? now : null,
			name: profile.name,
			image: profile.image,
			updatedAt: now,
			lastLoginAt: now,
		})
		.where(eq(users.id, userId))
		.returning();
}

export async function listUsersExcluding(userId: string) {
	return db.query.users.findMany({
		where: ne(users.id, userId),
		orderBy: [asc(users.email)],
	});
}

export async function findUserById(userId: string) {
	return db.query.users.findFirst({
		where: eq(users.id, userId),
	});
}

export async function updateUserImageById(userId: string, image: string | null) {
	const [updated] = await db
		.update(users)
		.set({
			image,
			updatedAt: new Date(),
		})
		.where(eq(users.id, userId))
		.returning();

	return updated ?? null;
}

export async function updateUserProfileById(
	userId: string,
	data: { name: string | null; image: string | null },
) {
	const [updated] = await db
		.update(users)
		.set({
			name: data.name,
			image: data.image,
			updatedAt: new Date(),
		})
		.where(eq(users.id, userId))
		.returning();

	return updated ?? null;
}

export async function acceptUserPolicyById(userId: string) {
	const [updated] = await db
		.update(users)
		.set({
			acceptedPolicyAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(users.id, userId))
		.returning();

	return updated ?? null;
}
