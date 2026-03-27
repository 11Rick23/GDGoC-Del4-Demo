import { GoogleGenAI } from "@google/genai";
import { create_profile, update_profile } from "./gemini_client";
import {
    type CommentItems,
    type ExtractItems,
    PROFILE_FIELD_CONFIGS,
    QUESTION_CONFIGS,
    type ProfileFieldConfig,
    type QuestionConfig,
} from "./flow_config";
import { EDIT_COMPLETE_TEXT, EDIT_PROFILE_TEXT, FINAL_COMPLETE_TEXT, FIRST_GREETING, SECOND_GREETING } from "./prompts";
import { SessionState } from "./session_state";
import { getProfileByUserId } from "@/lib/database/profiles";

type ChatClient = GoogleGenAI;

export type InitReplyResult = {
    state: SessionState;
    replies: string[];
  };


export type ChatFlowResult = {
    state: SessionState;
    reply: string;
    showMatchingLink?: boolean;
};

// 現在の step に対応する質問設定を取得する
function get_question_config(step: string): QuestionConfig | undefined {
    return QUESTION_CONFIGS.find((config) => config.step === step);
}

// 名前入力の次に出す最初の質問設定を返す。
function get_initial_question_config(): QuestionConfig {
  return QUESTION_CONFIGS[0];
}

// 現在の質問の次に来る質問設定を配列順から取得する
function get_next_question_config(step: string): QuestionConfig | undefined {
    const current_index = QUESTION_CONFIGS.findIndex((config) => config.step === step);
    if (current_index === -1) {
        return undefined;
    }

    return QUESTION_CONFIGS[current_index + 1];
}

//質問から答えの抽出まで
async function ask_and_collect({
    client,
    state,
    user_input,
    question_config,
    next_step,
}: {
    client: ChatClient;
    state: SessionState;
    user_input: string;
    question_config: QuestionConfig;
    next_step: string;
}): Promise<ChatFlowResult> {
    const {
        ask_text,
        max_retries,
        extract_items,
        comment_items,
        completion_reply,
        answer_key,
        attempt_key,
    } = question_config;

    const trimmed_input = user_input.trim();
    const target_items = state.answers[answer_key] ?? [];
    const current_attempts = state.attempts[attempt_key] ?? 0;

    if (!trimmed_input) {
        return {
            state,
            reply: ask_text,
        };
    }

    state.answers[answer_key] = target_items;//保存先の確保
    state.attempts[attempt_key] = current_attempts + 1;//試行回数のインクリメント

    const items = await extract_items(client, trimmed_input);//要素の抽出
    if (items) {
        target_items.push(...items);//抽出した要素を追加
    }

    if (target_items.length > 2) {
        const reply = comment_items
            ? await comment_items(client, target_items)
            : (completion_reply ?? "");
        state.step = next_step;
        return {
            state,
            reply,
        };
    }

    if (state.attempts[attempt_key] < max_retries) {
        return {
            state,
            reply: "他にも教えてね",
        };
    }

    state.step = next_step;
    return {
        state,
        reply: completion_reply ?? "",
    };
}

//ユーザへ次の表示する文章の作成
function build_question_reply(result: ChatFlowResult, question_config: QuestionConfig): ChatFlowResult {
  if (result.state.step !== get_next_step(question_config.step)) {
    return result;
  }

  const next_question_config = get_next_question_config(question_config.step);
  if (!next_question_config) {
    return result;
  }

  const should_include_comment = Boolean(question_config.comment_items && result.reply);

  return {
    state: result.state,
    reply: should_include_comment
      ? `${result.reply}\n${next_question_config.ask_text}`
      : next_question_config.ask_text,
  };
}

// 現在の質問の次に進む step 名を決める。次がなければプロフィール生成へ進む。
function get_next_step(step: string): string {
  const next_question_config = get_next_question_config(step);
  return next_question_config ? next_question_config.step : "profile";
}

//チャット起動時の表示
export function get_initial_replies(state: SessionState): InitReplyResult {
    if (state.step === "edit") {
      return {
        state,
        replies: [FIRST_GREETING, EDIT_PROFILE_TEXT],
      };
    }

    const initialQuestionConfig = get_initial_question_config();
    state.step = initialQuestionConfig.step;

    return {
      state,
      replies: [FIRST_GREETING, initialQuestionConfig.ask_text],
    };
  }

//質問の全体の流れ
export async function run_chat(
  client: ChatClient,
  state: SessionState,
  user_input: string,
  userId: string,
): Promise<ChatFlowResult> {
  if (state.step === "done") {
    return {
      state,
      reply: FINAL_COMPLETE_TEXT,
      showMatchingLink: true,
    };
  }

  if (state.step === "edit") {
    return edit_profile(client, state, user_input,userId);
  }

  const question_config = get_question_config(state.step);
  if (question_config) {
    const result = await ask_question(client, state, user_input, question_config);
    if (result.state.step === "profile") {
      return profile_create(client, result.state, result.reply, userId);
    }
    return build_question_reply(result, question_config);
  }

  return profile_create(client, state, user_input, userId);
}

// step 名から質問設定を引いて共通処理へ渡す。
async function ask_question_by_step(
  client: ChatClient,
  state: SessionState,
  user_input: string,
  step: string,
): Promise<ChatFlowResult> {
  const question_config = get_question_config(step);
  if (!question_config) {
    throw new Error(`${step} question config not found`);
  }

  return ask_question(client, state, user_input, question_config);
}

// 質問設定を ask_and_collect に変換して実行する。
async function ask_question(
  client: ChatClient,
  state: SessionState,
  user_input: string,
  question_config: QuestionConfig,
): Promise<ChatFlowResult> {
  return ask_and_collect({
    client,
    state,
    user_input,
    question_config,
    next_step: get_next_step(question_config.step),
  });
}

/*
質問の回答からプロフィール文を作成
*/
export async function profile_create(
  client: Parameters<typeof create_profile>[0],
  state: SessionState,
  prefix = "",
  userID: string,
): Promise<ChatFlowResult> {
  const profile_inputs = build_profile_inputs(state, PROFILE_FIELD_CONFIGS);
  const profile = await create_profile(client, profile_inputs);
  //生成したプロフィール文をDBに保存
  //profiles.tsのupsertProfile(data: InsertProfile)で書き込めるはず
  
  state.profile_txt = profile;
  state.step = "edit";

  return {
    state,
    reply: prefix ? `${prefix}\n${FINAL_COMPLETE_TEXT}` : FINAL_COMPLETE_TEXT,
    showMatchingLink: true,
  };
}

/*
プロフィール文の更新処理
 */
async function edit_profile(
  client: Parameters<typeof update_profile>[0],
  state: SessionState,
  user_input: string,
  userId: string,
): Promise<ChatFlowResult> {
  const trimmed_input = user_input.trim();
  if (!trimmed_input) {
    return {
      state,
      reply: EDIT_PROFILE_TEXT,
      showMatchingLink: true,
    };
  }

  const savedProfile = await getProfileByUserId(userId);
  const current_profile =
      savedProfile?.myProfile ?? state.profile_txt ?? "";
  const updated_profile = await update_profile(client, current_profile, trimmed_input);
  //更新したプロフィール文をDBに上書き保存処理
  //profiles.tsのupsertProfile(data: InsertProfile)で書き込めるはず

  state.profile_txt = updated_profile;
  state.step = "edit";

  return {
    state,
    reply: EDIT_COMPLETE_TEXT,
    showMatchingLink: true,
  };
}

/*
SessionState の回答を、プロフィール生成用の { label, values } 配列へ変換する。
*/
function build_profile_inputs(
  state: SessionState,
  profile_fields: ProfileFieldConfig[],
): Array<{ label: string; values: string[] }> {
  return profile_fields.map((field) => ({
    label: field.label,
    values: state.answers[field.answer_key] ?? [],
  }));
}
