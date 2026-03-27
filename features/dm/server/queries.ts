import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/database";
import {
	dmConversationMembers,
	dmConversations,
} from "@/lib/database/schema";

export async function listDirectMessageConversations(currentUserId: string) {
	const memberships = await db.query.dmConversationMembers.findMany({
		where: eq(dmConversationMembers.userId, currentUserId),
		with: {
			conversation: {
				with: {
					members: {
						with: {
							user: true,
						},
					},
					messages: {
						with: {
							sender: true,
						},
						orderBy: (messages, { desc }) => [desc(messages.createdAt)],
						limit: 1,
					},
				},
			},
		},
	});

	return memberships
		.map((membership) => {
			const otherMember = membership.conversation.members.find(
				(member) => member.userId !== currentUserId,
			);

			return {
				conversationId: membership.conversationId,
				updatedAt: membership.conversation.updatedAt,
				otherUser: otherMember?.user ?? null,
				lastMessage: membership.conversation.messages[0] ?? null,
			};
		})
		.sort(
			(a, b) =>
				new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
		);
}

export async function findDirectConversationBetweenUsers(
	userAId: string,
	userBId: string,
) {
	const [matchedConversation] = await db
		.select({
			conversationId: dmConversationMembers.conversationId,
		})
		.from(dmConversationMembers)
		.where(inArray(dmConversationMembers.userId, [userAId, userBId]))
		.groupBy(dmConversationMembers.conversationId)
		.having(sql`
			count(distinct ${dmConversationMembers.userId}) = 2
			and count(*) = 2
		`);

	if (!matchedConversation) {
		return null;
	}

	return db.query.dmConversations.findFirst({
		where: eq(dmConversations.id, matchedConversation.conversationId),
		with: {
			members: {
				with: {
					user: true,
				},
			},
			messages: {
				with: {
					sender: true,
				},
				orderBy: (messages, { asc }) => [asc(messages.createdAt)],
			},
		},
	});
}

export async function getDirectConversationByIdForUser(
	conversationId: string,
	currentUserId: string,
) {
	const membership = await db.query.dmConversationMembers.findFirst({
		where: eq(dmConversationMembers.conversationId, conversationId),
		with: {
			conversation: {
				with: {
					members: {
						with: {
							user: true,
						},
					},
					messages: {
						with: {
							sender: true,
						},
						orderBy: (messages, { asc }) => [asc(messages.createdAt)],
					},
				},
			},
		},
	});

	if (!membership) {
		return null;
	}

	const isMember = membership.conversation.members.some(
		(member) => member.userId === currentUserId,
	);

	return isMember ? membership.conversation : null;
}
