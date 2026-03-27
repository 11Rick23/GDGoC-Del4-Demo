1. 機能概要

- 自分のプロフィール文を対話で生成・編集する機能である
- Geminiが返答内容から要素を判断し抽出・送信内容へコメントする

2. 関連ファイル

- chat_flow.ts
- flow_config.ts
- gemini_client.ts
- session_state.ts
- 対応 API:
route.ts

3. 会話フロー

関数
- get_initial_replies()
- run_chat()
- ask_and_collect()
- profile_create()
- edit_profile()

流れ
- step がどう進むか
    join → live → job → like → hobby → charactor_myself　→ charactor_byfriend → belief

4. SessionState の説明

- step
- answers
- attempts
- profile_txt

5. DB 保存

- profiles.my_profile
- chat_progress の chat_type = "my_profile"
- chat_messages

6. UI との関係

- app/profile-ai : プロフィール作成画面
- components/profile/profile-ai-latest_panel : 一番最新のAIからの返信と入力欄を表示
- components/profile/p-rofile-aihistory_panel : 会話履歴を表示
- hooks/use-profile-ai-chat.ts : フロントに表示するためのAPIを叩く

- showMatchingLink : 質問が狩猟したらマッチ画面への

7. 注意点

- DB には JSON 文字列形式で保存していること
- 呼び出し側では文字列として扱うこと
- edit モードの挙動
- 今後壊しやすい箇所