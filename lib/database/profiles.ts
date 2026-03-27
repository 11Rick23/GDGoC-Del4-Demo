/**
 * プロフィール関連のデータベース操作
 */

import { db } from "./index";
import { profiles, profileVectors } from "./schema";
import type { InsertProfile, InsertProfileVector } from "./schema";
import { eq } from "drizzle-orm";

function serializeProfileText(text: string) {
	return JSON.stringify({ text });
}

function deserializeProfileText(value: string) {
	try {
		const parsed = JSON.parse(value) as { text?: string } | string;
		if (typeof parsed === "string") {
			return parsed;
		}
		return parsed.text ?? value;
	} catch {
		return value;
	}
}

/**
 * ユーザーIDからプロフィールを取得
 */
export async function getProfileByUserId(userId: string) {
	const result = await db
		.select()
		.from(profiles)
		.where(eq(profiles.userId, userId))
		.limit(1);
	if (!result[0]) return null;

	return {
		...result[0],
		myProfile: deserializeProfileText(result[0].myProfile),
		desiredProfile: deserializeProfileText(result[0].desiredProfile),
		undesiredProfile: deserializeProfileText(result[0].undesiredProfile),
	};
}

/**
 * プロフィールを作成または更新
 */
export async function upsertProfile(data: InsertProfile) {
	const existing = await getProfileByUserId(data.userId);
	const serializedData = {
		...data,
		myProfile: serializeProfileText(data.myProfile),
		desiredProfile: serializeProfileText(data.desiredProfile),
		undesiredProfile: serializeProfileText(data.undesiredProfile),
	};

	if (existing) {
		const [updated] = await db
			.update(profiles)
			.set({
				...serializedData,
				updatedAt: new Date(),
			})
			.where(eq(profiles.id, existing.id))
			.returning();
		return {
			...updated,
			myProfile: deserializeProfileText(updated.myProfile),
			desiredProfile: deserializeProfileText(updated.desiredProfile),
			undesiredProfile: deserializeProfileText(updated.undesiredProfile),
		};
	}

	const [created] = await db.insert(profiles).values(serializedData).returning();
	return {
		...created,
		myProfile: deserializeProfileText(created.myProfile),
		desiredProfile: deserializeProfileText(created.desiredProfile),
		undesiredProfile: deserializeProfileText(created.undesiredProfile),
	};
}

/*
本人のプロフィールだけ更新
*/
export async function updateMyProfile(userId: string, myProfile: string) {
	const existing = await getProfileByUserId(userId);
	const serializedMyProfile = serializeProfileText(myProfile);

	if (existing) {
      const [updated] = await db
        .update(profiles)
        .set({
          myProfile: serializedMyProfile,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, existing.id))
        .returning();

      return {
        ...updated,
        myProfile: deserializeProfileText(updated.myProfile),
        desiredProfile: deserializeProfileText(updated.desiredProfile),
        undesiredProfile: deserializeProfileText(updated.undesiredProfile),
      };
    }

    const [created] = await db
      .insert(profiles)
      .values({
        userId,
        myProfile: serializedMyProfile,
        desiredProfile: serializeProfileText(""),
        undesiredProfile: serializeProfileText(""),
      })
      .returning();

    return {
      ...created,
      myProfile: deserializeProfileText(created.myProfile),
      desiredProfile: deserializeProfileText(created.desiredProfile),
      undesiredProfile: deserializeProfileText(created.undesiredProfile),
    };
}

/*
友達にしたい相手のプロフィール更新
 */
export async function updateDesiredProfile(userId: string, desiredProfile: string) {
	const existing = await getProfileByUserId(userId);
  const serializedDesiredProfile = serializeProfileText(desiredProfile);

    if (existing) {
      const [updated] = await db
        .update(profiles)
        .set({
          desiredProfile: serializedDesiredProfile,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, existing.id))
        .returning();

      return {
        ...updated,
        myProfile: deserializeProfileText(updated.myProfile),
        desiredProfile: deserializeProfileText(updated.desiredProfile),
        undesiredProfile: deserializeProfileText(updated.undesiredProfile),
      };
    }

    const [created] = await db
      .insert(profiles)
      .values({
        userId,
        myProfile: serializeProfileText(""),
        desiredProfile: serializedDesiredProfile,
        undesiredProfile: serializeProfileText(""),
      })
      .returning();

    return {
      ...created,
      myProfile: deserializeProfileText(created.myProfile),
      desiredProfile: deserializeProfileText(created.desiredProfile),
      undesiredProfile: deserializeProfileText(created.undesiredProfile),
    };
}

/*
友達にしたくない相手のプロフィール更新
 */
export async function updateUndesiredProfile(userId: string, undesiredProfile: string) {
	const existing = await getProfileByUserId(userId);
  const serializedUndesiredProfile = serializeProfileText(undesiredProfile);

    if (existing) {
      const [updated] = await db
        .update(profiles)
        .set({
          undesiredProfile: serializedUndesiredProfile,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, existing.id))
        .returning();

      return {
        ...updated,
        myProfile: deserializeProfileText(updated.myProfile),
        desiredProfile: deserializeProfileText(updated.desiredProfile),
        undesiredProfile: deserializeProfileText(updated.undesiredProfile),
      };
    }

    const [created] = await db
      .insert(profiles)
      .values({
        userId,
        myProfile: serializeProfileText(""),
        desiredProfile: serializeProfileText(""),
        undesiredProfile: serializedUndesiredProfile,
      })
      .returning();

    return {
      ...created,
      myProfile: deserializeProfileText(created.myProfile),
      desiredProfile: deserializeProfileText(created.desiredProfile),
      undesiredProfile: deserializeProfileText(created.undesiredProfile),
    };
}


/**
 * プロフィールIDからベクトルを取得
 */
export async function getVectorsByProfileId(profileId: string) {
	const result = await db
		.select()
		.from(profileVectors)
		.where(eq(profileVectors.profileId, profileId))
		.limit(1);
	return result[0] || null;
}

/**
 * プロフィールベクトルを作成または更新
 */
export async function upsertProfileVectors(data: InsertProfileVector) {
	const existing = await getVectorsByProfileId(data.profileId);

	if (existing) {
		const [updated] = await db
			.update(profileVectors)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(profileVectors.id, existing.id))
			.returning();
		return updated;
	}

	const [created] = await db.insert(profileVectors).values(data).returning();
	return created;
}

/**
 * ユーザーIDから完全なプロフィール情報を取得（ベクトル含む）
 * JOINで1クエリに最適化
 */
export async function getFullProfileByUserId(userId: string) {
	const result = await db
		.select()
		.from(profiles)
		.leftJoin(profileVectors, eq(profileVectors.profileId, profiles.id))
		.where(eq(profiles.userId, userId))
		.limit(1);

	if (!result[0]) return null;

	return {
		profile: {
			...result[0].profiles,
			myProfile: deserializeProfileText(result[0].profiles.myProfile),
			desiredProfile: deserializeProfileText(result[0].profiles.desiredProfile),
			undesiredProfile: deserializeProfileText(result[0].profiles.undesiredProfile),
		},
		vectors: result[0].profile_vectors,
	};
}
