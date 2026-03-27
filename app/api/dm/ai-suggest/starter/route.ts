import { NextResponse } from "next/server";
import { create_client, create_starter_topic } from "@/features/dm/ai-suggest/gemini_client";
import { getDirectConversationByIdForUser } from "@/features/dm/server/queries";
import { auth } from "@/lib/auth";
import { getProfileByUserId } from "@/lib/database/profiles";

type StarterRequestBody = {
	conversationId?: string;
};

export async function POST(req: Request) {
	const session = await auth();
	const currentUserId = session?.user?.id;

	if (!currentUserId) {
		return NextResponse.json(
			{ error: "Unauthorized" },
			{ status: 401 },
		);
	}

	const body = (await req.json()) as StarterRequestBody;
	const conversationId = body.conversationId?.trim();

	if (!conversationId) {
		return NextResponse.json(
			{ error: "conversationId is required" },
			{ status: 400 },
		);
	}

	const conversation = await getDirectConversationByIdForUser(
		conversationId,
		currentUserId,
	);

	if (!conversation) {
		return NextResponse.json(
			{ error: "Conversation not found" },
			{ status: 404 },
		);
	}

	const otherMember = conversation.members.find(
		(member) => member.userId !== currentUserId,
	);

	if (!otherMember) {
		return NextResponse.json(
			{ error: "Other member not found" },
			{ status: 404 },
		);
	}

	const [myProfile, otherProfile] = await Promise.all([
		getProfileByUserId(currentUserId),
		getProfileByUserId(otherMember.userId),
	]);

	if (!myProfile?.myProfile || !otherProfile?.myProfile) {
		return NextResponse.json({ text: "" });
	}

	const client = create_client();
	const text = await create_starter_topic(
		client,
		myProfile.myProfile,
		otherProfile.myProfile,
	);

	return NextResponse.json({ text });
}
