import { NextResponse } from "next/server";
import { create_client, create_reply_text } from "@/features/dm/ai-suggest/gemini_client";

type CreateRequestBody = {
	input?: string;
	instruction?: string;
};

export async function POST(req: Request) {
	const body = (await req.json()) as CreateRequestBody;
	const input = body.input?.trim();
	const instruction = body.instruction?.trim();

	if (!input || !instruction) {
		return NextResponse.json(
			{ error: "input and instruction are required" },
			{ status: 400 },
		);
	}

	const client = create_client();
	const text = await create_reply_text(client, input, instruction, input);

	return NextResponse.json({
		text,
	});
}
