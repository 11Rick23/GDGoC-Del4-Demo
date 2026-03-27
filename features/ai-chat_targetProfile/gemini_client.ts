import { GoogleGenAI } from "@google/genai";
import {
    SYSTEM_PROMPT,
    EXTRACT_HOBBY_PROMPT,
    EXTRACT_CHARACTOR_MYSELF_PROMPT,
    EXTRACT_CHARACTOR_BYFRIEND_PROMPT,
    EXTRACT_AVOID_TYPE_PROMPT,
    HOBBIES_COMMENT_PROMPT,
    CHARACTOR_MYSELF_COMMENT_PROMPT,
    CHARACTOR_BYFRIEND_COMMENT_PROMPT,
    CREATE_PROFILE_TEXT,
    CREATE_AVOID_PROFILE_TEXT,
    UPDATE_PROFILE_PROMPT,
    MATCH_REASON_PROMPT,
} from "./prompts";

export function create_client(): GoogleGenAI {
    const api_key = process.env.GEMINI_API_KEY;
    if (!api_key) {
        throw new Error("環境変数 GEMINI_API_KEY を設定してください。");
    }

    return new GoogleGenAI({ apiKey: api_key });
}

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

function split_items(item_text: string): string[] | null {
    const items = item_text
        .split(/\s*[／/,、・]\s*/u)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

    return items.length > 0 ? items : null;
}

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

async function comment_for_items(
    client: GoogleGenAI,
    items: string[],
    prompt_template: string,
    replace_key: string,
): Promise<string> {
    return generate_text(client, prompt_template.replace(replace_key, items.join("、")));
}

export async function extract_target_personality(client: GoogleGenAI, user_input: string): Promise<string[] | null> {
    return extract_items(client, user_input, EXTRACT_CHARACTOR_MYSELF_PROMPT, "CHARACTOR_MYSELF:");
}

export async function extract_target_hobby(client: GoogleGenAI, user_input: string): Promise<string[] | null> {
    return extract_items(client, user_input, EXTRACT_HOBBY_PROMPT, "HOBBY:");
}

export async function extract_comfortable_personality(client: GoogleGenAI, user_input: string): Promise<string[] | null> {
    return extract_items(client, user_input, EXTRACT_CHARACTOR_BYFRIEND_PROMPT, "CHARACTOR_BYFRIEND:");
}

export async function extract_avoid_type(client: GoogleGenAI, user_input: string): Promise<string[] | null> {
    return extract_items(client, user_input, EXTRACT_AVOID_TYPE_PROMPT, "AVOID_TYPE:");
}

export async function comment_for_target_personality(client: GoogleGenAI, personalities: string[]): Promise<string> {
    return comment_for_items(client, personalities, CHARACTOR_MYSELF_COMMENT_PROMPT, "{charactors}");
}

export async function comment_for_target_hobbies(client: GoogleGenAI, hobbies: string[]): Promise<string> {
    return comment_for_items(client, hobbies, HOBBIES_COMMENT_PROMPT, "{hobbies}");
}

export async function comment_for_comfortable_personality(client: GoogleGenAI, personalities: string[]): Promise<string> {
    return comment_for_items(client, personalities, CHARACTOR_BYFRIEND_COMMENT_PROMPT, "{charactors}");
}

/*
求める相手のプロフィール文生成*/
export async function create_profile(
    client: GoogleGenAI,
    profile_inputs: Array<{ label: string; values: string[] }>,
): Promise<string> {
    const profile_input_text = profile_inputs
        .map((field) => `${field.label}:${field.values.join("、")}`)
        .join(", ");

    return generate_profile_text(
        client,
        CREATE_PROFILE_TEXT.replace("{profile_inputs}", profile_input_text),
    );
}


/*
求めない相手のプロフィール文生成
*/
export async function create_avoid_profile(
    client: GoogleGenAI,
    profile_inputs: Array<{ label: string; values: string[] }>,
): Promise<string> {
    const profile_input_text = profile_inputs
        .map((field) => `${field.label}:${field.values.join("、")}`)
        .join(", ");

    return generate_profile_text(
        client,
        CREATE_AVOID_PROFILE_TEXT.replace("{profile_inputs}", profile_input_text),
    );
}


/*
求める相手と求めない相手のプロフィール文の更新
*/
export async function update_profiles(
    client: GoogleGenAI,
    desired_profile: string,
    undesired_profile: string,
    edit_input: string,
): Promise<{
    desiredProfile: string;
    undesiredProfile: string;
    matchAction: "UPDATE" | "MATCH";
}> {
    const text = await generate_profile_text(
        client,
        UPDATE_PROFILE_PROMPT
            .replace("{desired_profile}", desired_profile)
            .replace("{undesired_profile}", undesired_profile)
            .replace("{edit_input}", edit_input),
    );

    const desired_match = text.match(/DESIRED_PROFILE:\s*([\s\S]*?)(?:\nUNDESIRED_PROFILE:|$)/);
    const undesired_match = text.match(/UNDESIRED_PROFILE:\s*([\s\S]*?)(?:\nMATCH:|$)/);
    const match_action_match = text.match(/MATCH:\s*(UPDATE|MATCH)\s*$/);

    return {
        desiredProfile: desired_match?.[1]?.trim() || desired_profile,
        undesiredProfile: undesired_match?.[1]?.trim() || undesired_profile,
        matchAction: match_action_match?.[1] === "MATCH" ? "MATCH" : "UPDATE",
    };
}


/*
二つの文章から相性のいい部分についてコメントする
*/
export async function create_match_reason(
    client: GoogleGenAI,
    desired_profile: string,
    candidate_profile: string,
): Promise<string> {
    return generate_profile_text(
        client,
        MATCH_REASON_PROMPT
            .replace("{desired_profile}", desired_profile)
            .replace("{candidate_profile}", candidate_profile),
    );
}
