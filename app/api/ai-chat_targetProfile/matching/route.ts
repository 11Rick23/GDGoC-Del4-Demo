import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { create_client, create_match_reason } from "@/features/ai-chat_targetProfile/gemini_client";
import { SessionState } from "@/features/ai-chat_targetProfile/session_state";
import { createChatMessages, getFullChat, upsertChatProgress } from "@/lib/database/ai-chat";
import { getProfileByUserId } from "@/lib/database/profiles";
import { findUserById } from "@/lib/database/users";

type MatchingApiResponse = {
  matches?: Array<{ userId: string; score?: number }>;
};

type MatchResult = {
  userId: string;
  nickname: string;
  profileText: string;
  matchReason: string;
};

type MatchingRouteResponse = {
  state: SessionState;
  showMatchingResults: boolean;
  matchResults: MatchResult[];
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

    const requestCookie = req.headers.get("cookie") ?? "";
    const savedChat = await getFullChat(loginSession.user.id, "target_profile");
    console.log("targetProfile matching:start", {
      userId: loginSession.user.id,
      hasProgress: Boolean(savedChat.progress),
    });

    if (!savedChat.progress) {
      return NextResponse.json(
        { error: "chat progress not found" },
        { status: 404 },
      );
    }

    const restoredState = Object.assign(new SessionState(), {
      step: savedChat.progress.step,
      answers: savedChat.progress.answersJson,
      attempts: savedChat.progress.attemptsJson,
      profile_txt: savedChat.progress.profileText,
      preferred_profile_txt: savedChat.progress.preferredProfileText,
      avoid_profile_txt: savedChat.progress.avoidProfileText,
    });

    if (!restoredState.preferred_profile_txt || !restoredState.avoid_profile_txt) {
      console.log("targetProfile matching:missingProfileTexts", {
        hasPreferred: Boolean(restoredState.preferred_profile_txt),
        hasAvoid: Boolean(restoredState.avoid_profile_txt),
      });
      return NextResponse.json(
        { error: "profile texts not found" },
        { status: 400 },
      );
    }

    const currentProfile = await getProfileByUserId(loginSession.user.id);
    if (!currentProfile?.myProfile) {
      console.log("targetProfile matching:missingMyProfile", {
        hasProfileRow: Boolean(currentProfile),
        hasMyProfile: Boolean(currentProfile?.myProfile),
      });
      return NextResponse.json(
        { error: "my profile not found" },
        { status: 400 },
      );
    }

    console.log("targetProfile matching:beforeVectorizeProfile", {
      hasMyProfile: Boolean(currentProfile.myProfile),
      hasPreferred: Boolean(restoredState.preferred_profile_txt),
      hasAvoid: Boolean(restoredState.avoid_profile_txt),
    });
    await vectorize_profile(
      currentProfile.myProfile,
      restoredState.preferred_profile_txt,
      restoredState.avoid_profile_txt,
      requestCookie,
    );
    console.log("targetProfile matching:afterVectorizeProfile");

    const matchingResponse = await vector_matching(loginSession.user.id, requestCookie);
    console.log("targetProfile matching:matchingResponse", {
      matchCount: matchingResponse.matches?.length ?? 0,
      matchUserIds: matchingResponse.matches?.map((match) => match.userId) ?? [],
    });
    const matchResults = await buildMatchResults(
      matchingResponse.matches ?? [],
      restoredState.preferred_profile_txt,
    );
    console.log("targetProfile matching:matchResults", {
      matchCount: matchResults.length,
      matchUserIds: matchResults.map((match) => match.userId),
    });

    restoredState.step = "edit";

    const progress = await upsertChatProgress(loginSession.user.id, "target_profile", {
      step: restoredState.step,
      answersJson: restoredState.answers,
      attemptsJson: restoredState.attempts,
      profileText: restoredState.profile_txt,
      preferredProfileText: restoredState.preferred_profile_txt,
      avoidProfileText: restoredState.avoid_profile_txt,
    });

    if (matchResults.length > 0) {
      await createChatMessages(progress.id, [
        {
          role: "ai",
          text: "あなたに合いそうな友達を探してきたよ",
          messageType: "match_results",
          payloadJson: matchResults,
        },
      ]);
    }

    return NextResponse.json({
      state: restoredState,
      showMatchingResults: matchResults.length > 0,
      matchResults,
    } satisfies MatchingRouteResponse);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "matching request failed" },
      { status: 500 },
    );
  }
}

async function vector_matching(userId: string, cookie: string): Promise<MatchingApiResponse> {
  const matchingResponse = await fetch("http://localhost:3000/api/vector/matching", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie,
    },
    body: JSON.stringify({
      userId,
    }),
  });

  if (!matchingResponse.ok) {
    console.error("matching failed", matchingResponse.status, await matchingResponse.text());
    throw new Error("Matching request failed");
  }

  return matchingResponse.json();
}

async function vectorize_profile(
  myProfile: string,
  desiredProfile: string,
  undesiredProfile: string,
  cookie: string,
) {
  const vectorProfileResponse = await fetch("http://localhost:3000/api/vector/profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie,
    },
    body: JSON.stringify({
      myProfile,
      desiredProfile,
      undesiredProfile,
    }),
  });

  if (!vectorProfileResponse.ok) {
    console.error(
      "vector profile failed",
      vectorProfileResponse.status,
      await vectorProfileResponse.text(),
    );
    throw new Error("Vector profile request failed");
  }
}

async function buildMatchResults(
  matches: Array<{ userId: string; score?: number }>,
  desiredProfileText: string,
): Promise<MatchResult[]> {
  const client = create_client();
  const results = await Promise.all(
    matches.map(async (match) => {
      const user = await findUserById(match.userId);
      const profile = await getProfileByUserId(match.userId);

      if (!user || !profile) {
        console.log("targetProfile matching:skipCandidate", {
          userId: match.userId,
          hasUser: Boolean(user),
          hasProfile: Boolean(profile),
        });
        return null;
      }

      const profileText = profile.myProfile;
      const matchReason = await create_match_reason(
        client,
        desiredProfileText,
        profileText,
      );

      return {
        userId: match.userId,
        nickname: user.name ?? user.email ?? "ユーザー",
        profileText,
        matchReason,
      };
    }),
  );

  return results.filter((result): result is MatchResult => result !== null);
}
