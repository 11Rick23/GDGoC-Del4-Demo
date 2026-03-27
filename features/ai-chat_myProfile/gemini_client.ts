import { GoogleGenAI } from "@google/genai";
import {
    SYSTEM_PROMPT,
    EXTRACT_LIVE_PROMPT,
    EXTRACT_JOB_PROMPT,
    EXTRACT_LIKE_PROMPT,
    EXTRACT_HOBBY_PROMPT,
    EXTRACT_CHARACTOR_MYSELF_PROMPT,
    EXTRACT_CHARACTOR_BYFRIEND_PROMPT,
    EXTRACT_BILIEF_RELATION_PROMPT,
    LIKES_COMMENT_PROMPT,
    HOBBIES_COMMENT_PROMPT,
    CHARACTOR_MYSELF_COMMENT_PROMPT,
    CHARACTOR_BYFRIEND_COMMENT_PROMPT,
    CREATE_PROFILE_TEXT,
    UPDATE_PROFILE_PROMPT,
} from "./prompts";

export function create_client(): GoogleGenAI {
    const api_key = process.env.GEMINI_API_KEY;
    if (!api_key) {
        throw new Error("環境変数 GEMINI_API_KEY を設定してください。");
    }

    return new GoogleGenAI({ apiKey: api_key });
}

//コメント用
async function generate_text(client: GoogleGenAI, prompt: string): Promise<string> {
    const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction: SYSTEM_PROMPT,
        },
    });
    return response.text?.trim() ?? "";
}

//プロフィール文作成用
async function generate_profile_text(client: GoogleGenAI, prompt: string): Promise<string> {
    const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            temperature: 0,
        },
    });
    return response.text?.trim() ?? "";
}

//読み出し用
async function generate_extraction_text(client: GoogleGenAI, prompt: string): Promise<string> {
    const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            temperature: 0,
        },
    });
    return response.text?.trim() ?? "";
}

//Geminiの出力を配列に変換する
function split_items(item_text: string): string[] | null {
    const items = item_text
        .split(/\s*[／/,、・]\s*/u)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

    return items.length > 0 ? items : null;
}

//抜き出しの共通部分
async function extract_items(
    client: GoogleGenAI,
    user_input: string,
    prompt_template: string,
    prefix: string,
): Promise<string[] | null> {
    const text = await generate_extraction_text(
        client,
        prompt_template.replace("{user_input}", user_input),
    );

    if (text === "RETRY") {
        return null;
    }

    const item_text = text.startsWith(prefix) ? text.slice(prefix.length).trim() : text.trim();
    return split_items(item_text);
}

//コメントの共通部分
async function comment_for_items(
    client: GoogleGenAI,
    items: string[],
    prompt_template: string,
    replace_key: string,
): Promise<string> {
    return generate_text(client, prompt_template.replace(replace_key, items.join("、")));
}


//回答抜き出し処理

export async function extract_live(client: GoogleGenAI, user_input: string): Promise<string[] | null> {
    return extract_items(client, user_input, EXTRACT_LIVE_PROMPT, "LIVE:");
}

export async function extract_job(client: GoogleGenAI, user_input: string): Promise<string[] | null> {
    return extract_items(client, user_input, EXTRACT_JOB_PROMPT, "JOB:");
}

export async function extract_like(client: GoogleGenAI, user_input: string): Promise<string[] | null> {
    return extract_items(client, user_input, EXTRACT_LIKE_PROMPT, "LIKE:");
}

export async function extract_hobby(client: GoogleGenAI, user_input: string): Promise<string[] | null> {
    return extract_items(client, user_input, EXTRACT_HOBBY_PROMPT, "HOBBY:");
}

export async function extract_charactor_myself(client: GoogleGenAI, user_input: string): Promise<string[] | null> {
    return extract_items(client, user_input, EXTRACT_CHARACTOR_MYSELF_PROMPT, "CHARACTOR_MYSELF:");
}

export async function extract_charactor_byfriend(client: GoogleGenAI, user_input: string): Promise<string[] | null> {
    return extract_items(client, user_input, EXTRACT_CHARACTOR_BYFRIEND_PROMPT, "CHARACTOR_BYFRIEND:");
}

export async function extract_belief(client: GoogleGenAI, user_input: string): Promise<string[] | null> {
    return extract_items(client, user_input, EXTRACT_BILIEF_RELATION_PROMPT, "BELIEF:");
}


//コメントの生成
export async function comment_for_likes(client: GoogleGenAI, likes: string[]): Promise<string> {
    return comment_for_items(client, likes, LIKES_COMMENT_PROMPT, "{likes}");
}

export async function comment_for_hobbies(client: GoogleGenAI, hobbies: string[]): Promise<string> {
    return comment_for_items(client, hobbies, HOBBIES_COMMENT_PROMPT, "{hobbies}");
}

export async function comment_for_charactor_myself(client: GoogleGenAI, charactors: string[]): Promise<string> {
    return comment_for_items(client, charactors, CHARACTOR_MYSELF_COMMENT_PROMPT, "{charactors}");
}

export async function comment_for_charactor_byfriend(client: GoogleGenAI, charactors: string[]): Promise<string> {
    return comment_for_items(client, charactors, CHARACTOR_BYFRIEND_COMMENT_PROMPT, "{charactors}");
}


//プロフィール文作成
export async function create_profile(
    client: GoogleGenAI,
    profile_inputs: Array<{ label: string; values: string[] }>,
): Promise<string> {
    const profile_input_text = profile_inputs
    .map((field) => `${field.label}:${field.values.join("、")}`)
    .join(", ");
    return generate_profile_text(
        client,
        CREATE_PROFILE_TEXT
            .replace("{profile_inputs}", profile_input_text),
    );
}

export async function update_profile(
    client: GoogleGenAI,
    current_profile: string,
    edit_input: string,
): Promise<string> {
    return generate_profile_text(
        client,
        UPDATE_PROFILE_PROMPT
            .replace("{current_profile}", current_profile)
            .replace("{edit_input}", edit_input),
    );
}
