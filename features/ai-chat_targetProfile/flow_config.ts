import { GoogleGenAI } from "@google/genai";
import {
    extract_target_hobby,
    extract_target_personality,
    extract_comfortable_personality,
    extract_avoid_type,
    comment_for_target_hobbies,
    comment_for_target_personality,
    comment_for_comfortable_personality,
} from "./gemini_client";

import {
    ASK_HOBBY_TEXT,
    ASK_CHARACTOR_MYSELF_TEXT,
    ASK_CHARACTOR_BYFRIEND_TEXT,
    ASK_AVOID_TYPE_TEXT,
} from "./prompts";

type ChatClient = GoogleGenAI;
export type ExtractItems = (client: ChatClient, user_input: string) => Promise<string[] | null>;
export type CommentItems = (client: ChatClient, items: string[]) => Promise<string>;

export type QuestionConfig = {
  step: string;
  answer_key: string;
  attempt_key: string;
  ask_text: string;
  max_retries: number;
  extract_items: ExtractItems;
  comment_items?: CommentItems;
  completion_reply?: string;
};

export type ProfileFieldConfig = {
  label: string;
  answer_key: string;
};

export const QUESTION_CONFIGS:QuestionConfig[] = [
    {
        step: "target_personality",
        answer_key: "target_personality",
        attempt_key: "target_personality",
        ask_text: ASK_CHARACTOR_MYSELF_TEXT,
        max_retries: 3,
        extract_items: extract_target_personality,
        comment_items: comment_for_target_personality,
        completion_reply: "ありがとう！",
    },
    {
        step: "target_hobby",
        answer_key: "target_hobby",
        attempt_key: "target_hobby",
        ask_text: ASK_HOBBY_TEXT,
        max_retries: 3,
        extract_items: extract_target_hobby,
        comment_items: comment_for_target_hobbies,
        completion_reply: "ありがとう！",
    },
    {
        step: "comfortable_personality",
        answer_key: "comfortable_personality",
        attempt_key: "comfortable_personality",
        ask_text: ASK_CHARACTOR_BYFRIEND_TEXT,
        max_retries: 3,
        extract_items: extract_comfortable_personality,
        comment_items: comment_for_comfortable_personality,
        completion_reply: "ありがとう！",
    },
    {
        step: "avoid_type",
        answer_key: "avoid_type",
        attempt_key: "avoid_type",
        ask_text: ASK_AVOID_TYPE_TEXT,
        max_retries: 3,
        extract_items: extract_avoid_type,
        completion_reply: "ありがとう！",
    },
];

export const PROFILE_FIELD_CONFIGS: ProfileFieldConfig[] = [
  {
    label: "友達になりたい相手の性格",
    answer_key: "target_personality",
  },
  {
    label: "友達になりたい相手の趣味",
    answer_key: "target_hobby",
  },
  {
    label: "一緒にいると楽しい・心地いい相手の性質",
    answer_key: "comfortable_personality",
  },
];

export const AVOID_PROFILE_FIELD_CONFIGS: ProfileFieldConfig[] = [
  {
    label: "苦手な人・友達になりたくない相手の特徴",
    answer_key: "avoid_type",
  },
];
