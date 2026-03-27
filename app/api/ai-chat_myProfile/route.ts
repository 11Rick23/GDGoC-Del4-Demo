import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { create_client } from "@/features/ai-chat_myProfile/gemini_client";
import { get_initial_replies, run_chat } from "@/features/ai-chat_myProfile/chat_flow";
import { SessionState } from "@/features/ai-chat_myProfile/session_state";
import { createChatMessages, getFullChat, upsertChatProgress } from "@/lib/database/ai-chat";
import { updateMyProfile } from "@/lib/database/profiles";

type ProfileChatResponse = {
    reply?: string;
    state: SessionState;
    replies?: string[];
    messages?: Array<{ id: string; role: "user" | "ai"; text: string }>;
    canUseMatchingAi?: boolean;
};

/**
 * GET- 現在の進捗に対して挨拶と現在の質問文を返す
 */
export async function GET() {
    try {
        const loginSession = await auth();

        if (loginSession?.user?.id) {
            const savedChat = await getFullChat(loginSession.user.id, "my_profile");
            if (savedChat.progress) {
                const restoredState = Object.assign(new SessionState(), {
                    step: savedChat.progress.step,
                    answers: savedChat.progress.answersJson,
                    attempts: savedChat.progress.attemptsJson,
                    profile_txt: savedChat.progress.profileText,
                });

                return NextResponse.json({
                    state: restoredState,
                    messages: savedChat.messages.map((message) => ({
                        id: message.id,
                        role: message.role as "user" | "ai",
                        text: message.text,
                    })),
                    canUseMatchingAi:
                        restoredState.step === "done" || restoredState.step === "edit",
                } satisfies ProfileChatResponse);
            }
        }

        const session = new SessionState();
        const result = get_initial_replies(session);

        return NextResponse.json({
            replies: result.replies,
            state: result.state,
            canUseMatchingAi: false,
        } satisfies ProfileChatResponse);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "initial chat request failed" },
            { status: 500 },
        );
    }
}

/**
 * POST- 入力を渡して要素を抽出して次のAIからの質問・案内を取得
 */
export async function POST(req: Request) {
    try {
        const loginSession = await auth();
        if (!loginSession?.user?.id) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 },
        );
        }
        const { message, state } = await req.json();

        const session = Object.assign(new SessionState(), state ?? {});
        const client = create_client();
        const result = await run_chat(client, session, message ?? "",loginSession.user.id,);

        const nextProfile = result.state.profile_txt;

        if (nextProfile) {
            await updateMyProfile(loginSession.user.id, nextProfile);
        }

        const progress = await upsertChatProgress(loginSession.user.id, "my_profile", {
            step: result.state.step,
            answersJson: result.state.answers,
            attemptsJson: result.state.attempts,
            profileText: result.state.profile_txt,
            preferredProfileText: null,
            avoidProfileText: null,
        });

        const messagesToSave = [];
        if ((message ?? "").trim()) {
            messagesToSave.push({ role: "user" as const, text: message.trim() });
        }
        messagesToSave.push({ role: "ai" as const, text: result.reply });
        await createChatMessages(progress.id, messagesToSave);

        //APIからの返答(文章と現在の進捗)、マッチングに進めるかを返す
        return NextResponse.json({
            reply: result.reply,
            state: result.state,
            canUseMatchingAi:
                result.state.step === "done" || result.state.step === "edit",
        } satisfies ProfileChatResponse);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "chat request failed" },
            { status: 500 },
        );
    }
}
