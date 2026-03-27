import { relations } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	primaryKey,
	jsonb,
	text,
	timestamp,
	uniqueIndex,
	vector,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export const users = pgTable(
	"users",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => nanoid()),
		email: text("email").notNull(),
		emailVerified: timestamp("email_verified", { withTimezone: true }),
		name: text("name"),
		image: text("image"),
		accountType: text("account_type").notNull().default("human"),
		lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
		acceptedPolicyAt: timestamp("accepted_policy_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex("users_email_key").on(table.email),
		index("users_last_login_at_idx").on(table.lastLoginAt),
	],
);

export const accounts = pgTable(
	"accounts",
	{
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		type: text("type").notNull(),
		provider: text("provider").notNull(),
		providerAccountId: text("provider_account_id").notNull(),
		refresh_token: text("refresh_token"),
		access_token: text("access_token"),
		expires_at: integer("expires_at"),
		token_type: text("token_type"),
		scope: text("scope"),
		id_token: text("id_token"),
		session_state: text("session_state"),
	},
	(table) => [
		primaryKey({
			columns: [table.provider, table.providerAccountId],
		}),
		index("accounts_user_id_idx").on(table.userId),
	],
);

export const sessions = pgTable(
	"sessions",
	{
		sessionToken: text("session_token").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		expires: timestamp("expires", { withTimezone: true }).notNull(),
	},
	(table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const dmConversations = pgTable(
	"dm_conversations",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => nanoid()),
		directConversationKey: text("direct_conversation_key").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex("dm_conversations_direct_conversation_key_key").on(
			table.directConversationKey,
		),
		index("dm_conversations_updated_at_idx").on(table.updatedAt),
	],
);

export const dmConversationMembers = pgTable(
	"dm_conversation_members",
	{
		conversationId: text("conversation_id")
			.notNull()
			.references(() => dmConversations.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		joinedAt: timestamp("joined_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.conversationId, table.userId],
		}),
		index("dm_conversation_members_user_id_idx").on(table.userId),
	],
);

export const dmMessages = pgTable(
	"dm_messages",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => nanoid()),
		conversationId: text("conversation_id")
			.notNull()
			.references(() => dmConversations.id, { onDelete: "cascade" }),
		senderUserId: text("sender_user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		body: text("body").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("dm_messages_conversation_id_idx").on(table.conversationId),
		index("dm_messages_sender_user_id_idx").on(table.senderUserId),
		index("dm_messages_created_at_idx").on(table.createdAt),
	],
);

export const profiles = pgTable(
	"profiles",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => nanoid()),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" })
			.unique(),
		myProfile: text("my_profile").notNull(),
		desiredProfile: text("desired_profile").notNull(),
		undesiredProfile: text("undesired_profile").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("profiles_user_id_idx").on(table.userId),
		index("profiles_created_at_idx").on(table.createdAt),
	],
);

/**
 * プロフィールベクトルテーブル
 * E5モデルで生成された1024次元のベクトルを保存
 * pgvectorを使用してベクトル類似度検索を実行
 */
export const profileVectors = pgTable(
	"profile_vectors",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => nanoid()),
		profileId: text("profile_id")
			.notNull()
			.references(() => profiles.id, { onDelete: "cascade" })
			.unique(),
		myProfileVector: vector("my_profile_vector", { dimensions: 1024 }).notNull(),
		desiredProfileVector: vector("desired_profile_vector", {
			dimensions: 1024,
		}).notNull(),
		undesiredProfileVector: vector("undesired_profile_vector", {
			dimensions: 1024,
		}).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex("profile_vectors_profile_id_key").on(table.profileId),
		index("profile_vectors_created_at_idx").on(table.createdAt),
		// ベクトル検索用のインデックスはマイグレーションで作成
	],
);

/**
 * チャットの進行度保存用
 */
export const chatProgress = pgTable(
	"chat_progress",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => nanoid()),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		chatType: text("chat_type").notNull(), // "my_profile" | "target_profile"
		step: text("step").notNull(),
		answersJson: jsonb("answers_json")
			.$type<Record<string, string[]>>()
			.notNull()
			.default(sql`'{}'::jsonb`),
		attemptsJson: jsonb("attempts_json")
			.$type<Record<string, number>>()
			.notNull()
			.default(sql`'{}'::jsonb`),
		profileText: text("profile_text"),
		preferredProfileText: text("preferred_profile_text"),
		avoidProfileText: text("avoid_profile_text"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex("chat_progress_user_id_chat_type_key").on(
			table.userId,
			table.chatType,
		),
		index("chat_progress_user_id_idx").on(table.userId),
		index("chat_progress_chat_type_idx").on(table.chatType),
	],
);


/**
 * チャット履歴保存用テーブル
 */
export const chatMessages = pgTable(
	"chat_messages",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => nanoid()),
		progressId: text("progress_id")
			.notNull()
			.references(() => chatProgress.id, { onDelete: "cascade" }),
		role: text("role").notNull(), // "user" | "ai"
		text: text("text").notNull(),
		// 通常の会話文か、マッチ結果カード表示イベントかを区別する
		messageType: text("message_type").notNull().default("text"),
		// カード表示のような構造化データを時系列順のまま復元できるように保存する
		payloadJson: jsonb("payload_json").$type<Record<string, unknown>[] | null>(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("chat_messages_progress_id_idx").on(table.progressId),
		index("chat_messages_created_at_idx").on(table.createdAt),
	],
);


export const usersRelations = relations(users, ({ many }) => ({
	accounts: many(accounts),
	sessions: many(sessions),
	dmConversationMembers: many(dmConversationMembers),
	sentDmMessages: many(dmMessages),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id],
	}),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

export const dmConversationsRelations = relations(
	dmConversations,
	({ many }) => ({
		members: many(dmConversationMembers),
		messages: many(dmMessages),
	}),
);

export const dmConversationMembersRelations = relations(
	dmConversationMembers,
	({ one }) => ({
		conversation: one(dmConversations, {
			fields: [dmConversationMembers.conversationId],
			references: [dmConversations.id],
		}),
		user: one(users, {
			fields: [dmConversationMembers.userId],
			references: [users.id],
		}),
	}),
);

export const dmMessagesRelations = relations(dmMessages, ({ one }) => ({
	conversation: one(dmConversations, {
		fields: [dmMessages.conversationId],
		references: [dmConversations.id],
	}),
	sender: one(users, {
		fields: [dmMessages.senderUserId],
		references: [users.id],
	}),
}));

export const chatProgressRelations = relations(chatProgress, ({ one, many }) => ({
	user: one(users, {
		fields: [chatProgress.userId],
		references: [users.id],
	}),
	messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
	progress: one(chatProgress, {
		fields: [chatMessages.progressId],
		references: [chatProgress.id],
	}),
}));

// 型エクスポート
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

export type ProfileVector = typeof profileVectors.$inferSelect;
export type InsertProfileVector = typeof profileVectors.$inferInsert;

export type ChatProgress = typeof chatProgress.$inferSelect;
export type InsertChatProgress = typeof chatProgress.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
