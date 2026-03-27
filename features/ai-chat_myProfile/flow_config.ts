import { GoogleGenAI } from "@google/genai";
import {
    create_profile,
    extract_live,
    extract_job,
    extract_like,
    extract_hobby,
    extract_charactor_myself,
    extract_charactor_byfriend,
    extract_belief,
    comment_for_likes,
    comment_for_hobbies,
    comment_for_charactor_myself,
    comment_for_charactor_byfriend,
} from "./gemini_client";

import {
    ASK_LIVE_TEXT,
    ASK_JOB_TEXT,
    ASK_LIKES_TEXT,
    ASK_HOBBY_TEXT,
    ASK_CHARACTOR_MYSELF_TEXT,
    ASK_CHARACTOR_BYFRIEND_TEXT,
    ASK_BELIEF_RELATIONSHIP_TEXT,
    EDIT_PROFILE_TEXT,
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

export type EditConfig = {
  step: string;
  answer_key: string;
  attempt_key: string;
  ask_text: string;
  max_retries: number;
  update_items: ExtractItems;
  comment_items?: CommentItems;
  completion_reply?: string;
};

export type ProfileFieldConfig = {
  label: string;
  answer_key: string;
};

export const QUESTION_CONFIGS:QuestionConfig[] = [
    {
        step: "live",
        answer_key: "live",
        attempt_key: "live",
        ask_text: ASK_LIVE_TEXT,
        max_retries: 1,
        extract_items: extract_live,
        completion_reply: "ありがとう！",
    },
    {
        step: "job",
        answer_key: "job",
        attempt_key: "job",
        ask_text: ASK_JOB_TEXT,
        max_retries: 1,
        extract_items: extract_job,
        completion_reply: "ありがとう！",
    },
    {
        step: "like",
        answer_key: "like",
        attempt_key: "like",
        ask_text: ASK_LIKES_TEXT,
        max_retries: 3,
        extract_items: extract_like,
        comment_items: comment_for_likes,
        completion_reply: "ありがとう！",
    },
    {
        step: "hobby",
        answer_key: "hobby",
        attempt_key: "hobby",
        ask_text: ASK_HOBBY_TEXT,
        max_retries: 3,
        extract_items: extract_hobby,
        comment_items: comment_for_hobbies,
        completion_reply: "ありがとう！",
    },
    {
        step: "charactor_myself",
        answer_key: "charactor_myself",
        attempt_key: "charactor_myself",
        ask_text: ASK_CHARACTOR_MYSELF_TEXT,
        max_retries: 3,
        extract_items: extract_charactor_myself,
        comment_items: comment_for_charactor_myself,
        completion_reply: "ありがとう！",
    },
    {
        step: "charactor_byfriend",
        answer_key: "charactor_byfriend",
        attempt_key: "charactor_byfriend",
        ask_text: ASK_CHARACTOR_BYFRIEND_TEXT,
        max_retries: 3,
        extract_items: extract_charactor_byfriend,
        comment_items: comment_for_charactor_byfriend,
        completion_reply: "ありがとう！",
    },
    {
        step: "belief",
        answer_key: "belief",
        attempt_key: "belief",
        ask_text: ASK_BELIEF_RELATIONSHIP_TEXT,
        max_retries: 3,
        extract_items: extract_belief,
        completion_reply: "ありがとう！",
    },

];

export const EDIT_PROFILE_CONFIG:QuestionConfig[] = [
  {
      step: "edit",
      answer_key: "edit",
      attempt_key: "edit",
      ask_text: EDIT_PROFILE_TEXT,
      max_retries: 1,
      extract_items: extract_belief,
      completion_reply: "ありがとう！",
  },
];

export const PROFILE_FIELD_CONFIGS: ProfileFieldConfig[] = [
  {
    label: "住んでいる地域",
    answer_key: "live",
  },
  {
    label: "現在の職業",
    answer_key: "job",
  },
  {
    label: "好きなもの・こと",
    answer_key: "like",
  },
  {
    label: "休日や暇なときにすること",
    answer_key: "hobby",
  },
  {
    label: "自分の思う自分自身の性格",
    answer_key: "charactor_myself",
  },
  {
    label: "友達や周りの人からよく言われる自分の性格",
    answer_key: "charactor_byfriend",
  },
];