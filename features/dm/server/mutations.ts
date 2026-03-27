import { eq } from "drizzle-orm";
import { db } from "@/lib/database";
import {
	dmConversationMembers,
	dmConversations,
	dmMessages,
} from "@/lib/database/schema";

type CreateDmMessageInput = {
	conversationId: string;
	senderUserId: string;
	body: string;
};

function toDirectConversationKey(userAId: string, userBId: string) {
	return [userAId, userBId].sort().join(":");
}

export async function createDirectConversation(
	userAId: string,
	userBId: string,
) {
	const now = new Date();
	const directConversationKey = toDirectConversationKey(userAId, userBId);

	return db.transaction(async (tx) => {
		const [createdConversation] = await tx
			.insert(dmConversations)
			.values({
				directConversationKey,
				updatedAt: now,
			})
			.onConflictDoNothing({
				target: dmConversations.directConversationKey,
			})
			.returning();

		if (!createdConversation) {
			const existingConversation = await tx.query.dmConversations.findFirst({
				where: eq(
					dmConversations.directConversationKey,
					directConversationKey,
				),
			});

			if (!existingConversation) {
				throw new Error("Failed to create or load direct conversation.");
			}

			return existingConversation;
		}

		await tx.insert(dmConversationMembers).values([
			{
				conversationId: createdConversation.id,
				userId: userAId,
				joinedAt: now,
			},
			{
				conversationId: createdConversation.id,
				userId: userBId,
				joinedAt: now,
			},
		]);

		return createdConversation;
	});
}

export async function createDmMessage({
	conversationId,
	senderUserId,
	body,
}: CreateDmMessageInput) {
	const now = new Date();

	return db.transaction(async (tx) => {
		const [message] = await tx
			.insert(dmMessages)
			.values({
				conversationId,
				senderUserId,
				body,
				updatedAt: now,
			})
			.returning();

		await tx
			.update(dmConversations)
			.set({
				updatedAt: now,
			})
			.where(eq(dmConversations.id, conversationId));

		return message;
	});
}
