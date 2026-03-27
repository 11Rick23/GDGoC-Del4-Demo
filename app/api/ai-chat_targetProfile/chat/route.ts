import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { create_client } from "@/features/ai-chat_targetProfile/gemini_client";
import { run_chat } from "@/features/ai-chat_targetProfile/chat_flow";
import { SessionState } from "@/features/ai-chat_targetProfile/session_state";
import { createChatMessages, upsertChatProgress } from "@/lib/database/ai-chat";
import { updateDesiredProfile, updateUndesiredProfile } from "@/lib/database/profiles";

type ChatResponse = {
  reply: string;
  state: SessionState;
  shouldFetchMatching?: boolean;
};

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
    const result = await run_chat(client, session, message ?? "");

    const nextDesiredProfile = result.state.preferred_profile_txt;
    const nextUnDesiredProfile = result.state.avoid_profile_txt;

    if (nextDesiredProfile) {
      await updateDesiredProfile(loginSession.user.id, nextDesiredProfile);
    }
    if (nextUnDesiredProfile) {
      await updateUndesiredProfile(loginSession.user.id, nextUnDesiredProfile);
    }

    const progress = await upsertChatProgress(loginSession.user.id, "target_profile", {
      step: result.state.step,
      answersJson: result.state.answers,
      attemptsJson: result.state.attempts,
      profileText: result.state.profile_txt,
      preferredProfileText: result.state.preferred_profile_txt,
      avoidProfileText: result.state.avoid_profile_txt,
    });

    const messagesToSave = [];
    if ((message ?? "").trim()) {
      messagesToSave.push({ role: "user" as const, text: message.trim() });
    }
    messagesToSave.push({ role: "ai" as const, text: result.reply });
    await createChatMessages(progress.id, messagesToSave);

    return NextResponse.json({
      reply: result.reply,
      state: result.state,
      shouldFetchMatching: result.matchAction === "MATCH",
    } satisfies ChatResponse);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "chat request failed" },
      { status: 500 },
    );
  }
}
