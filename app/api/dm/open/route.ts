import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findUserById } from "@/lib/database/users";
import { createDirectConversation } from "@/features/dm/server/mutations";
import { findDirectConversationBetweenUsers } from "@/features/dm/server/queries";

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

    const { targetUserId } = await req.json();
    if (typeof targetUserId !== "string" || !targetUserId) {
      return NextResponse.json(
        { error: "Invalid request", message: "targetUserId が必要です" },
        { status: 400 },
      );
    }

    if (targetUserId === currentUserId) {
      return NextResponse.json(
        { error: "Invalid request", message: "自分自身とはDMできません" },
        { status: 400 },
      );
    }

    const targetUser = await findUserById(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { error: "Not found", message: "対象ユーザーが見つかりません" },
        { status: 404 },
      );
    }

    const existingConversation = await findDirectConversationBetweenUsers(
      currentUserId,
      targetUserId,
    );

    if (existingConversation) {
      return NextResponse.json({
        success: true,
        created: false,
        conversationId: existingConversation.id,
        targetUserId,
      });
    }

    const conversation = await createDirectConversation(
      currentUserId,
      targetUserId,
    );

    return NextResponse.json({
      success: true,
      created: true,
      conversationId: conversation.id,
      targetUserId,
    });
  } catch (error) {
    console.error("Open DM API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "DMの作成または取得に失敗しました",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
