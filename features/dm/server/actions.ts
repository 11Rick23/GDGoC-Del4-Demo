"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
	findDirectConversationBetweenUsers,
	getDirectConversationByIdForUser,
} from "@/features/dm/server/queries";
import {
	createDirectConversation,
	createDmMessage,
} from "@/features/dm/server/mutations";
import { findUserById } from "@/lib/database/users";
import { publishDmWebSocketEvent } from "@/features/dm/server/realtime";

export async function createOrOpenDirectConversation(formData: FormData) {
	const session = await getServerSession(authOptions);
	const currentUserId = session?.user?.id;
	const recipientUserId = formData.get("recipientUserId");

	if (!currentUserId || typeof recipientUserId !== "string") {
		redirect("/dm");
	}

	if (recipientUserId === currentUserId) {
		redirect("/dm");
	}

	const recipientUser = await findUserById(recipientUserId);
	if (!recipientUser) {
		redirect("/dm");
	}

	const existingConversation = await findDirectConversationBetweenUsers(
		currentUserId,
		recipientUserId,
	);

	if (existingConversation) {
		redirect(`/dm?conversationId=${existingConversation.id}`);
	}

	const conversation = await createDirectConversation(
		currentUserId,
		recipientUserId,
	);

	publishDmWebSocketEvent([currentUserId, recipientUserId], {
		type: "conversation_created",
		conversationId: conversation.id,
	});

	redirect(`/dm?conversationId=${conversation.id}`);
}

export async function sendDirectMessage(formData: FormData) {
	const session = await getServerSession(authOptions);
	const currentUserId = session?.user?.id;
	const conversationId = formData.get("conversationId");
	const rawBody = formData.get("body");

	if (
		!currentUserId ||
		typeof conversationId !== "string" ||
		typeof rawBody !== "string"
	) {
		redirect("/dm");
	}

	const body = rawBody.trim();
	if (!body) {
		redirect(`/dm?conversationId=${conversationId}`);
	}

	const conversation = await getDirectConversationByIdForUser(
		conversationId,
		currentUserId,
	);

	if (!conversation) {
		redirect("/dm");
	}

	await createDmMessage({
		conversationId,
		senderUserId: currentUserId,
		body,
	});

	publishDmWebSocketEvent(
		conversation.members.map((member) => member.userId),
		{
			type: "message_created",
			conversationId,
		},
	);

	revalidatePath("/dm");
	redirect(`/dm?conversationId=${conversationId}`);
}
