import { create_bot_reply, create_client } from "@/features/dm/ai-suggest/gemini_client";
import { createDmMessage } from "@/features/dm/server/mutations";
import { getDirectConversationByIdForUser } from "@/features/dm/server/queries";
import { publishDmWebSocketEvent } from "@/features/dm/server/realtime";
import { getProfileByUserId } from "@/lib/database/profiles";

type CreateBotReplyInput = {
	conversationId: string;
	currentUserId: string;
	latestUserMessage: string;
};

/** 
 * 会話履歴をGeminiに渡す形式に整形
 */
function formatConversationHistory(
	conversation: NonNullable<
		Awaited<ReturnType<typeof getDirectConversationByIdForUser>>
	>,
	currentUserId: string,
) {
	return conversation.messages
		.slice(-10)
		.map((message) => {
			const speaker =
				message.senderUserId === currentUserId
					? "user"
					: message.sender.accountType === "bot"
						? "bot"
						: "other";

			return `${speaker}: ${message.body}`;
		})
		.join("\n");
}

/**
 * 相手がbotならbot返信を生成してDBに保存する
 */
export async function createBotReplyForConversation({
	conversationId,
	currentUserId,
	latestUserMessage,
}: CreateBotReplyInput) {
	const conversation = await getDirectConversationByIdForUser( //会話取得
		conversationId,
		currentUserId,
	);

	if (!conversation) {
		return null;
	}

	const botMember = conversation.members.find(
		(member) =>
			member.userId !== currentUserId && member.user.accountType === "bot",
	);

	if (!botMember) {
		return null;
	}

	const botProfile = await getProfileByUserId(botMember.userId); //botのプロフィール文取得
	const character = botProfile?.myProfile?.trim();

	if (!character) {
		return null;
	}

	const history = formatConversationHistory(conversation, currentUserId);
	const client = create_client();
	const botReply = await create_bot_reply( //Gemini生成の返信作成
		client,
		character,
		history,
		latestUserMessage,
	);

	if (!botReply) {
		return null;
	}

	const message = await createDmMessage({ //bot名義でメッセージを保存する
		conversationId,
		senderUserId: botMember.userId,
		body: botReply,
	});

	publishDmWebSocketEvent( //返信を反映するためwebsocket通知する
		conversation.members.map((member) => member.userId),
		{
			type: "message_created",
			conversationId,
		},
	);

	return message;
}
