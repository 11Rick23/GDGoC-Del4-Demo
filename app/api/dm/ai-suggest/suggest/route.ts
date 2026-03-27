import { NextResponse } from "next/server";
import { create_client, create_reply_suggestions } from "@/features/dm/ai-suggest/gemini_client";

type SuggestRequestBody = {
	text?: string;
};

export async function POST(req: Request) {
	const body = (await req.json()) as SuggestRequestBody;
	const text = body.text?.trim() ?? "";

	const client = create_client();
	const suggestions = await create_reply_suggestions(client, text);

	return NextResponse.json({
		suggestions,
	});
}
