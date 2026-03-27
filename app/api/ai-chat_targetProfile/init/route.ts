import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { get_initial_replies } from "@/features/ai-chat_targetProfile/chat_flow";
import { SessionState } from "@/features/ai-chat_targetProfile/session_state";
import { getChatProgress, getFullChat } from "@/lib/database/ai-chat";

type MatchResult = {
  userId: string;
  nickname: string;
  profileText: string;
  matchReason: string;
};

type TargetProfileInitResponse = {
  state: SessionState;
  replies?: string[];
  messages?: Array<{
    id: string;
    role: "user" | "ai";
    text: string;
    messageType?: "text" | "match_results";
    payloadJson?: MatchResult[] | null;
  }>;
  showMatchingResults?: boolean;
  matchResults?: MatchResult[];
  canUseMatchingAi?: boolean;
};

export async function GET() {
  try {
    const loginSession = await auth();

    if (loginSession?.user?.id) {
      const myProfileProgress = await getChatProgress(loginSession.user.id, "my_profile");
      const canUseMatchingAi =
        myProfileProgress?.step === "done" || myProfileProgress?.step === "edit";

      if (!canUseMatchingAi) {
        return NextResponse.json(
          {
            state: new SessionState(),
            replies: ["先にprofile-aiで入力してね"],
            canUseMatchingAi: false,
          } satisfies TargetProfileInitResponse,
        );
      }

      const savedChat = await getFullChat(loginSession.user.id, "target_profile");
      if (savedChat.progress) {
        const restoredState = Object.assign(new SessionState(), {
          step: savedChat.progress.step,
          answers: savedChat.progress.answersJson,
          attempts: savedChat.progress.attemptsJson,
          profile_txt: savedChat.progress.profileText,
          preferred_profile_txt: savedChat.progress.preferredProfileText,
          avoid_profile_txt: savedChat.progress.avoidProfileText,
        });

        const latestMatchMessage = [...savedChat.messages]
          .reverse()
          .find((message) => message.messageType === "match_results");
        const restoredMatchResults = Array.isArray(latestMatchMessage?.payloadJson)
          ? (latestMatchMessage.payloadJson as MatchResult[])
          : [];

        return NextResponse.json({
          state: restoredState,
          messages: savedChat.messages.map((message) => ({
            id: message.id,
            role: message.role as "user" | "ai",
            text: message.text,
            messageType: (message.messageType as "text" | "match_results") ?? "text",
            payloadJson: Array.isArray(message.payloadJson)
              ? (message.payloadJson as MatchResult[])
              : null,
          })),
          showMatchingResults: restoredMatchResults.length > 0,
          matchResults: restoredMatchResults,
          canUseMatchingAi: true,
        } satisfies TargetProfileInitResponse);
      }
    }

    const session = new SessionState();
    const result = get_initial_replies(session);

    return NextResponse.json({
      replies: result.replies,
      state: result.state,
      canUseMatchingAi: true,
    } satisfies TargetProfileInitResponse);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "initial chat request failed" },
      { status: 500 },
    );
  }
}
