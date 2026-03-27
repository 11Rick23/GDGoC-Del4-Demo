import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { DmMessage, DmPageData, DmPageSearchParams, DmSelectableUser, DmUser } from "@/features/dm/types";
import { formatDisplayName } from "@/features/dm/utils/format-display-name";
import {
	getDirectConversationByIdForUser,
	listDirectMessageConversations,
} from "@/features/dm/server/queries";
import { listUsersExcluding } from "@/lib/database/users";

function formatMessageTime(value: Date) {
	return new Intl.DateTimeFormat("ja-JP", {
		hour: "2-digit",
		minute: "2-digit",
	}).format(value);
}

function formatConversationTimestamp(value: Date) {
	return new Intl.DateTimeFormat("ja-JP", {
		month: "numeric",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(value);
}

function toSelectableUsers(
	users: Awaited<ReturnType<typeof listUsersExcluding>>,
): DmSelectableUser[] {
	return users.map((user) => ({
		id: user.id,
		name: formatDisplayName(user.name, user.email),
		image: user.image,
	}));
}

function toConversationListItems(
	conversationSummaries: Awaited<ReturnType<typeof listDirectMessageConversations>>,
): DmUser[] {
	return conversationSummaries.map((conversation) => ({
		id: conversation.conversationId,
		name: formatDisplayName(
			conversation.otherUser?.name,
			conversation.otherUser?.email,
		),
		image: conversation.otherUser?.image,
		lastMessage: conversation.lastMessage?.body ?? "まだメッセージがありません",
		lastSeen: formatConversationTimestamp(conversation.updatedAt),
		unread: 0,
	}));
}

function toActiveConversationUser(
	selectedConversation: Awaited<ReturnType<typeof getDirectConversationByIdForUser>>,
	currentUserId: string,
): DmUser | null {
	if (!selectedConversation) {
		return null;
	}

	const otherMember = selectedConversation.members.find(
		(member) => member.userId !== currentUserId,
	);

	return {
		id: selectedConversation.id,
		name: formatDisplayName(otherMember?.user.name, otherMember?.user.email),
		image: otherMember?.user.image ?? null,
		lastMessage:
			selectedConversation.messages.at(-1)?.body ?? "まだメッセージがありません",
		lastSeen: formatConversationTimestamp(selectedConversation.updatedAt),
		unread: 0,
	};
}

function toConversationMessages(
	selectedConversation: Awaited<ReturnType<typeof getDirectConversationByIdForUser>>,
	currentUserId: string,
): DmMessage[] {
	if (!selectedConversation) {
		return [];
	}

	return selectedConversation.messages.map((message) => ({
		id: message.id,
		sender:
			message.senderUserId === currentUserId
				? "You"
				: formatDisplayName(message.sender.name, message.sender.email),
		role: message.senderUserId === currentUserId ? "me" : "other",
		time: formatMessageTime(message.createdAt),
		body: message.body,
	}));
}

export async function getDmPageData(
	searchParams?: DmPageSearchParams,
): Promise<DmPageData> {
	const session = await getServerSession(authOptions);
	const currentUserId = session?.user?.id;

	if (!currentUserId) {
		return {
			currentUserId: null,
			activeConversationId: undefined,
			activeUser: null,
			messages: [],
			selectableUsers: [],
			users: [],
		};
	}

	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const conversationSummaries =
		await listDirectMessageConversations(currentUserId);
	const selectableUsers = toSelectableUsers(
		await listUsersExcluding(currentUserId),
	);
	const selectedConversationId =
		resolvedSearchParams?.conversationId ??
		conversationSummaries[0]?.conversationId;
	const selectedConversation = selectedConversationId
		? await getDirectConversationByIdForUser(
				selectedConversationId,
				currentUserId,
			)
		: null;

	return {
		currentUserId,
		activeConversationId: selectedConversation?.id,
		activeUser: toActiveConversationUser(selectedConversation, currentUserId),
		messages: toConversationMessages(selectedConversation, currentUserId),
		selectableUsers,
		users: toConversationListItems(conversationSummaries),
	};
}
