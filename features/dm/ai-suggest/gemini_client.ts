import { GoogleGenAI } from "@google/genai";
import {
    BOT_REPLY_PROMPT,
    CREATE_REPLY_PROMPT,
    STARTER_TOPIC_PROMPT,
    SUGGEST_REPLY_PROMPT,
} from "@/features/dm/ai-suggest/prompts";

/**
 * Gemini Clientの作成
 */
export function create_client(): GoogleGenAI {
    const api_key = process.env.GEMINI_API_KEY;
    if (!api_key) {
        throw new Error("環境変数 GEMINI_API_KEY を設定してください。");
    }

    return new GoogleGenAI({ apiKey: api_key });
}

/** 
 * 文章作成する基本関数
 */
async function generate_text(client: GoogleGenAI, prompt: string): Promise<string> {
    const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            temperature: 0.7,
            responseMimeType: "application/json",
        },
    });

    return response.text?.trim() ?? "";
}

/** 
 * Geminiの生成した返信候補を表示できる文字列に変換
 */
function parse_suggestions(text: string): string[] {
    try {
        const parsed = JSON.parse(text) as { suggestions?: string[] };
        if (Array.isArray(parsed.suggestions)) {
            return parsed.suggestions
                .map((suggestion) => suggestion.trim())
                .filter((suggestion) => suggestion.length > 0)
                .slice(0, 3);
        }
    } catch {
        // Fall back to an empty list when the model returns invalid JSON.
    }

    return [];
}

/**
 * Geminiの作成した生成文章を表示できる文字列に変換
 */
function parse_created_reply(text: string): string {
    try {
        const parsed = JSON.parse(text) as { text?: string };
        return parsed.text?.trim() ?? "";
    } catch {
        // Fall back to an empty string when the model returns invalid JSON.
        return "";
    }
}

/*
 * 受信メッセージに対する短い返信候補を3つ返す。
 */ 
export async function create_reply_suggestions(
    client: GoogleGenAI,
    reply: string,
): Promise<string[]> {
    if (!reply.trim()) {
        return [
            "こんにちは、よろしくお願いします。",
            "はじめまして。お話しできたらうれしいです。",
            "気になってメッセージしました。よろしくお願いします。",
        ];
    }

    const text = await generate_text(
        client,
        SUGGEST_REPLY_PROMPT.replace("{reply}", reply),
    );

    return parse_suggestions(text);
}
/** 
 * 受信メッセージと要望に応じた返信文を1つ返す。
 */
export async function create_reply_text(
    client: GoogleGenAI,
    reply: string,
    request: string,
    input: string,
): Promise<string> {
    const text = await generate_text(
        client,
        CREATE_REPLY_PROMPT
            .replace("{reply}", reply)
            .replace("{request}", request)
            .replace("{input}", input),
    );

    return parse_created_reply(text);
}

// キャラクター設定と会話履歴を踏まえた bot 返信を1つ返す。
export async function create_bot_reply(
    client: GoogleGenAI,
    character: string,
    history: string,
    reply: string,
): Promise<string> {
    const text = await generate_text(
        client,
        BOT_REPLY_PROMPT
            .replace("{character}", character)
            .replace("{history}", history)
            .replace("{reply}", reply),
    );

    return parse_created_reply(text);
}

export async function create_starter_topic(
    client: GoogleGenAI,
    myProfile: string,
    otherProfile: string,
): Promise<string> {
    const text = await generate_text(
        client,
        STARTER_TOPIC_PROMPT
            .replace("{myProfile}", myProfile)
            .replace("{otherProfile}", otherProfile),
    );

    return parse_created_reply(text);
}
