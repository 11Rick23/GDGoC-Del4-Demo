import { NextResponse } from "next/server";
import { createBotReplyForConversation } from "@/features/dm/server/bot-reply";
import { auth } from "@/lib/auth";

type BotReplyRequestBody = {
	conversationId?: string;
	latestUserMessage?: string;
};

export async function POST(req: Request) {
	try {
		const session = await auth();
		const currentUserId = session?.user?.id;

		if (!currentUserId) {
			return NextResponse.json(
				{ error: "Unauthorized", message: "ログインが必要です" },
				{ status: 401 },
			);
		}

		const body = (await req.json()) as BotReplyRequestBody;
		const conversationId = body.conversationId?.trim();
		const latestUserMessage = body.latestUserMessage?.trim();

		if (!conversationId || !latestUserMessage) {
			return NextResponse.json(
				{ error: "Invalid request", message: "conversationId と latestUserMessage が必要です" },
				{ status: 400 },
			);
		}

		const message = await createBotReplyForConversation({
			conversationId,
			currentUserId,
			latestUserMessage,
		});

		return NextResponse.json({
			success: true,
			created: Boolean(message),
			messageId: message?.id ?? null,
		});
	} catch (error) {
		console.error("Bot reply API error:", error);
		return NextResponse.json(
			{
				error: "Internal server error",
				message: "bot返信の生成に失敗しました",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
