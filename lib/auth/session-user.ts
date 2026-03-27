export type DatabaseSessionUser = {
	id: string;
	emailVerified: Date | null;
	lastLoginAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

export type SessionUserData = {
	id: string;
	emailVerified: boolean;
	lastLoginAt: string | null;
	createdAt: string;
	updatedAt: string;
};

export function toSessionUserData(user: DatabaseSessionUser): SessionUserData {
	return {
		id: user.id,
		emailVerified: Boolean(user.emailVerified),
		lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
		createdAt: user.createdAt.toISOString(),
		updatedAt: user.updatedAt.toISOString(),
	};
}
