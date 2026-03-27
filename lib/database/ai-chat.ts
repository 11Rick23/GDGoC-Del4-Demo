import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/database";
import {
  chatMessages,
  chatProgress,
  type InsertChatMessage,
  type InsertChatProgress,
} from "@/lib/database/schema";

/**
 * userId + chatType に対応する現在の進行状態をとる
*/
export async function getChatProgress(userId: string, chatType: string) {
  const result = await db
    .select()
    .from(chatProgress)
    .where(and(eq(chatProgress.userId, userId), eq(chatProgress.chatType, chatType)))
    .limit(1);

  return result[0] ?? null;
}


/**
 * 進行状態が既にあれば更新、なければ新規作成
*/
export async function upsertChatProgress(
  userId: string,
  chatType: string,
  data: Omit<InsertChatProgress, "userId" | "chatType">,
) {
  const existing = await getChatProgress(userId, chatType);

  if (existing) {
    const [updated] = await db
      .update(chatProgress)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(chatProgress.id, existing.id))
      .returning();

    return updated;
  }

  const [created] = await db
    .insert(chatProgress)
    .values({
      userId,
      chatType,
      ...data,
    })
    .returning();

  return created;
}


/**
 * メッセージを1件だけ保存する
*/
export async function createChatMessage(data: InsertChatMessage) {
  const [created] = await db.insert(chatMessages).values(data).returning();
  return created;
}

/**
 * メッセージを複数件まとめて保存
*/
export async function createChatMessages(
  progressId: string,
  messages: Array<{
    role: "user" | "ai";
    text: string;
    // 通常メッセージ以外も保存できるようにして、表示順を崩さず復元する
    messageType?: string;
    // マッチ結果カードの配列など、画面描画に必要な追加データを入れる
    payloadJson?: Record<string, unknown>[] | null;
  }>,
) {
  if (messages.length === 0) return [];

  return db
    .insert(chatMessages)
    .values(
      messages.map((message) => ({
        progressId,
        role: message.role,
        text: message.text,
        messageType: message.messageType ?? "text",
        payloadJson: message.payloadJson ?? null,
      })),
    )
    .returning();
}

/*
  * progressId に紐づく履歴を時系列順で取る
*/
export async function getChatMessages(progressId: string) {
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.progressId, progressId))
    .orderBy(asc(chatMessages.createdAt));
}

/**
 * 進行状態と履歴をまとめて返す
*/
export async function getFullChat(userId: string, chatType: string) {
  const progress = await getChatProgress(userId, chatType);
  if (!progress) {
    return {
      progress: null,
      messages: [],
    };
  }

  const messages = await getChatMessages(progress.id);

  return {
    progress,
    messages,
  };
}
