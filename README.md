# はじめに
本レポジトリは、私が [GDGoC Japan Hackathon](https://www.craftstadium.com/hackathon/gdgocjphack-2026-tokyo) に Team Del4 の一員として出場した際に作成したプロジェクトのデモコードです。

権利の都合上、一部データをプレイスホルダーに置き換えて公開しているため、そのまま動作させることはできません。

私が担当したのは、 Next.js を使ったプロジェクト全体の開発基盤の整備、データベース部分を含む認証システム、そしてWebhookを含むDM機能部分です。

以下、プロジェクトの元の README となります。

# Team Del4

GDGoC Japan Hackathon における Team Del4 の友達マッチングアプリです。

AI を使ったプロフィール作成・ベクトル類似度マッチング・リアルタイム DM を組み合わせ、新しい友達との出会いをサポートします。

---

## 目次

1. [機能概要](#機能概要)
2. [使用技術スタック](#使用技術スタック)
3. [アーキテクチャ](#アーキテクチャ)
4. [プロジェクト構造](#プロジェクト構造)
5. [セットアップ](#セットアップ)
6. [開発](#開発)
7. [ページ概要](#ページ概要)
8. [API ルート一覧](#api-ルート一覧)
9. [データベーススキーマ](#データベーススキーマ)
10. [トラブルシューティング](#トラブルシューティング)
11. [3Dモデルの著作権と取り扱いについて](#3dモデルの著作権と取り扱いについて) 
---

## 機能概要

| 機能 | 説明 |
|------|------|
| Google ログイン | NextAuth.js + Google OAuth。セッションは DB で管理 |
| AI プロフィール作成 | Gemini による対話形式でユーザーの自己紹介文を生成 |
| AI マッチング検索 | 「理想の友達」「避けたいタイプ」を対話で入力し、ベクトル類似度で上位3名を取得 |
| リアルタイム DM | WebSocket による即時メッセージ反映。ボットアカウントは Gemini が自動返信 |
| AI 返信サジェスト | DM 画面で Gemini が返信候補をサジェスト |

---

## 使用技術スタック

### Next.js アプリ (フロントエンド / BFF)

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Next.js 16 / React 19 (App Router) |
| 認証 | NextAuth.js v4 + Google OAuth、@auth/drizzle-adapter |
| ORM | Drizzle ORM v0.45 |
| DB クライアント | node-postgres (`pg`) |
| リアルタイム | WebSocket (`ws`) |
| AI (LLM) | Google Gemini (`@google/genai` v1.45) |
| スタイリング | Tailwind CSS v4 |
| UI コンポーネント | shadcn/UI、Radix UI、lucide-react、class-variance-authority |
| 3D レンダリング | React Three Fiber (`@react-three/fiber`)、Drei (`@react-three/drei`) |
| ID 生成 | nanoid |
| ランタイム | Node.js 25 / Bun 1.3.5 (Mise で管理) |
| 言語 | TypeScript 5 |

### ベクトル API マイクロサービス (Python)

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | FastAPI 0.115 + Uvicorn |
| DB アクセス | asyncpg + SQLAlchemy (非同期) + pgvector |
| マイグレーション | Alembic |
| 埋め込みモデル | `intfloat/multilingual-e5-large` (1024 次元、多言語対応) |
| ML ランタイム | PyTorch + sentence-transformers |
| バリデーション | Pydantic v2 |
| ログ | structlog |

### データベース

- PostgreSQL 16 + **pgvector** 拡張 (Docker、ポート 54322)

---

## アーキテクチャ

```
ブラウザ
  │  HTTPS / WebSocket
  ▼
┌──────────────────────────────────────────────────┐
│  Next.js App (Port 3000)                        │
│  server.mjs — カスタム Node HTTP + WebSocket     │
│                                                  │
│  App Router Pages                               │
│    /            ホーム・ログイン                 │
│    /profile-ai  プロフィール作成 AI チャット     │
│    /discovery-ai Discovery AI チャット           │
│    /dm          リアルタイム DM                  │
│    /settings    設定                             │
│                                                  │
│  API Routes (/app/api/*)                        │
│    auth/         NextAuth ハンドラー             │
│    ai-chat_*/    AI チャット BFF                 │
│    dm/           DM Server Actions + AI 機能    │
│    vector/*      Python API へのプロキシ         │
└──────────────────────┬───────────────────────────┘
                       │ HTTP プロキシ
                       ▼
┌──────────────────────────────────────────────────┐
│  FastAPI (Port 8000) — vectoring-api/           │
│                                                  │
│  GET  /api/v1/health                            │
│  POST /api/v1/vectorize       テキスト→ベクトル │
│  POST /api/v1/vectorize-full  プロフィール登録  │
│  POST /api/v1/matching        コサイン類似度照合│
│  POST /api/v1/profile         プロフィール管理  │
│                                                  │
│  multilingual-e5-large モデル (1024 次元)       │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│  PostgreSQL 16 + pgvector (Port 54322)          │
│    users / accounts / sessions                  │
│    profiles / profile_vectors                   │
│    dm_conversations / dm_messages               │
│    chat_progress / chat_messages                │
└──────────────────────────────────────────────────┘
```

マッチングスコアの計算式:

```
final_score = desired_similarity - undesired_similarity
```

「理想の友達」に近いほど高く、「避けたいタイプ」に近いほど低くなります。上位 3 名を返します。

---

## プロジェクト構造

```text
app/                        App Router のページ・API ルート入口
  api/
    ai-chat_myProfile/      プロフィール作成 AI チャット API
    ai-chat_targetProfile/  マッチング AI チャット API (init / chat / matching)
    auth/[...nextauth]/     NextAuth キャッチオールルート
    dm/                     DM 関連 API (open / ai-suggest / bot-reply)
    vector/                 Python API プロキシ (profile / vectorize / matching)
  dm/                       DM ページ
  profile-ai/               プロフィール作成ページ
  discovery-ai/             Discovery AI ページ
  settings/                 設定ページ
  layout.tsx                ルートレイアウト (NavBar + AppProviders)
  page.tsx                  ホームページ

features/                   機能ごとの UI / サーバーロジック
  ai-chat_myProfile/        自己プロフィール対話フロー
    flow_config.ts          質問ステップ定義 (join→live→job→...→belief)
    chat_flow.ts            ステートマシン / フロー制御
    gemini_client.ts        Gemini API 呼び出し (抽出・コメント)
    session_state.ts        セッション状態シリアライズ
    prompts.ts              プロンプト文字列
    main.ts                 GET (初期化) / POST (チャットターン) ハンドラー
  ai-chat_targetProfile/    理想・回避プロフィール対話フロー (同構造)
  auth/components/          ログイン・ログアウト UI
  dm/
    components/             DM UI (チャットバブル・コンポーザー・ユーザーリスト)
    server/
      actions.ts            Server Actions: 会話作成・メッセージ送信
      bot-reply.ts          Gemini によるボット自動返信
      mutations.ts          DB 書き込みヘルパー
      queries.ts            DB 読み取りヘルパー
      realtime.js           WebSocket 接続レジストリ・イベント発行
    ai-suggest/             DM 返信候補 AI (Gemini)
  home/components/          ホーム画面 UI (ユーザープロフィールカード)

components/                 共通 UI コンポーネント
  ui/                       基本 UI プリミティブ
  profile/                  プロフィール AI チャットパネル
  matching/                 マッチング AI チャットパネル
  nav.tsx                   トップナビゲーションバー

hooks/
  use-profile-ai-chat.ts    プロフィール AI チャット用クライアントフック
  use-matching-ai-chat.ts   マッチング AI チャット用クライアントフック

lib/
  auth.ts                   NextAuth オプション (Google OAuth・DB セッション)
  auth/                     認証ヘルパー (Google プロフィールパーサー等)
  database/
    schema.ts               Drizzle ORM スキーマ (全テーブル・リレーション)

shared/
  components/nav-bar.tsx    アプリレベルのナビゲーションバー
  providers/app-providers.tsx  SessionProvider ラッパー

scripts/
  db-setup.ts               DB 作成・pgvector 拡張の有効化
  seed.ts                   テストユーザー・プロフィールのシード

vectoring-api/              Python FastAPI マイクロサービス
  main.py                   FastAPI エントリーポイント
  backend/
    infrastructure/         DB プール・E5 モデルローダー・設定・ログ
    presentation/api/v1/    ルートハンドラー
  requirements.txt
  Dockerfile
  docker-compose.yml
  .env.example

server.mjs                  Next.js + WebSocket カスタムサーバー
drizzle.config.ts           Drizzle Kit 設定
next.config.ts              Next.js 設定
docker-compose.db.yml       開発用 PostgreSQL + pgvector
mise.toml                   Mise タスクランナー設定
```

---

## セットアップ

### 前提条件

- [Mise](https://mise.jdx.dev/) (推奨) — Node.js 25 / Bun 1.3.5 を自動管理
- Python 3.11+
- Docker Desktop (PostgreSQL + pgvector 用)
- Google OAuth クレデンシャル ([Google Cloud Console](https://console.cloud.google.com/))
- Google Gemini API キー ([Google AI Studio](https://aistudio.google.com/))

### 1. ランタイムのインストール (Mise 使用の場合)

```bash
mise install
```

Mise を使わない場合は `mise.toml` に記載のバージョンに合わせて Node.js / Bun を用意してください。

### 2. ライブラリのインストール

```bash
bun install
# または: npm install
```

### 3. 環境変数の設定

プロジェクトルートに `.env` または `.env.local` を作成してください。

```dotenv
# データベース
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/del4db

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<任意のランダム文字列>

# Google OAuth (Google Cloud Console で取得)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# Google Gemini API (Google AI Studio で取得)
GEMINI_API_KEY=<your-gemini-api-key>

# Python ベクトル API
VECTOR_API_URL=http://localhost:8000/api/v1

# オプション
HOSTNAME=localhost
PORT=3000
```

> **注意**: `server.mjs` は `dotenv/config` で `.env` を読み込みます。Next.js 標準の `.env.local` も併用可能です。

### 4. PostgreSQL の起動

```bash
docker compose -f docker-compose.db.yml up -d
# del4-postgres コンテナがポート 54322 で起動します
```

### 5. データベースの初期化

```bash
npm run db:setup   # DB 作成 + pgvector 拡張を有効化
npm run db:push    # Drizzle スキーマを DB に反映
npm run db:seed    # テストユーザー・プロフィールを挿入 (任意)
```

### 6. Python ベクトル API のセットアップ

**ローカル環境:**

```bash
# プロジェクトルートで仮想環境を作成
python3 -m venv .venv
.venv/bin/pip install -r vectoring-api/requirements.txt

# 環境変数を設定
cp vectoring-api/.env.example vectoring-api/.env
# vectoring-api/.env の DATABASE_URL を確認・編集

# FastAPI サーバーを起動 (ポート 8000)
cd vectoring-api
PYTHONPATH=./backend ../.venv/bin/uvicorn main:app --reload --port 8000
```

**Docker 使用 (代替):**

```bash
cd vectoring-api
cp .env.example .env
docker compose up -d
```

> **初回起動時の注意**: E5 モデル (`intfloat/multilingual-e5-large`、約 2 GB) が自動ダウンロードされます。

**Mise 使用 (一括セットアップ):**

```bash
mise run setup   # Docker DB 起動・npm install・db:setup・db:push・Python 環境構築を一括実行
```

---

## 開発

### Next.js アプリの起動

```bash
bun dev
# または: npm run dev
```

`http://localhost:3000` でアクセスできます。

このプロジェクトは Next.js 標準サーバーではなく `server.mjs` 経由で起動します。WebSocket エンドポイント `/dm-ws` もこのカスタムサーバーで処理します。

### Python ベクトル API の起動

```bash
mise run dev
```

または上記セットアップ手順の起動コマンドを直接実行してください。

### npm スクリプト一覧

| スクリプト | 説明 |
|-----------|------|
| `bun dev` / `npm run dev` | 開発サーバー起動 (Next.js + WebSocket、ポート 3000) |
| `npm run build` | プロダクション用ビルド |
| `npm run start` | プロダクションサーバー起動 |
| `npm run lint` | ESLint 実行 |
| `npm run db:setup` | DB 作成 + pgvector 拡張の有効化 |
| `npm run db:push` | Drizzle スキーマを DB に適用 |
| `npm run db:seed` | テストデータの挿入 |

---

## ページ概要

| パス | 説明 |
|------|------|
| `/` | ホーム。未ログイン時はログインボタン、ログイン済みはログアウトボタンを表示 |
| `/profile-ai` | AI 対話でユーザーの自己紹介プロフィールを作成・編集する画面 |
| `/discovery-ai` | AI 対話で「理想の友達」を設定し、ベクトルマッチングで候補を取得する画面 |
| `/dm` | DM 画面。会話一覧・メッセージ送受信・WebSocket によるリアルタイム更新 |
| `/settings` | 設定画面 |

### プロフィール作成フロー (`/profile-ai`)

Gemini による対話形式で以下の情報を収集し、`profiles.my_profile` に保存します。

```
join → live → job → like → hobby → charactor_myself → charactor_byfriend → belief
```

### マッチングフロー (`/discovery-ai`)

1. Gemini との対話で `desiredProfile`（理想）と `undesiredProfile`（回避）を生成
2. Python ベクトル API に送信してベクトル化・DB 保存
3. コサイン類似度マッチングを実行し、上位 3 名のカードを表示
4. カードから直接 DM を開始可能

---

## API ルート一覧

| メソッド | パス | 説明 |
|--------|------|------|
| GET/POST | `/api/ai-chat_myProfile` | プロフィール作成 AI チャット |
| POST | `/api/ai-chat_targetProfile/init` | マッチング AI チャット初期化 |
| POST | `/api/ai-chat_targetProfile/chat` | マッチング AI チャット (1 ターン) |
| POST | `/api/ai-chat_targetProfile/matching` | ベクトルマッチング実行 |
| POST | `/api/dm/open` | DM 会話の作成または取得 |
| POST | `/api/dm/ai-suggest` | DM の AI 返信サジェスト |
| POST | `/api/dm/bot-reply` | ボットの自動返信生成 |
| POST | `/api/vector/profile` | プロフィールのベクトル化・保存 (Python API プロキシ) |
| POST | `/api/vector/vectorize` | テキストのベクトル化 (Python API プロキシ) |
| POST | `/api/vector/matching` | マッチング実行 (Python API プロキシ) |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth.js 認証ハンドラー |

---

## データベーススキーマ

主なテーブル (Drizzle ORM 定義: `lib/database/schema.ts`):

| テーブル | 説明 |
|---------|------|
| `users` | ユーザー情報 (id, name, email, image, userType) |
| `accounts` | OAuth アカウント情報 (NextAuth) |
| `sessions` | セッション情報 (NextAuth) |
| `profiles` | ユーザープロフィール (myProfile, desiredProfile, undesiredProfile — JSON 文字列) |
| `profile_vectors` | プロフィールの pgvector ベクトル (1024 次元 × 3) |
| `dm_conversations` | DM 会話 |
| `dm_conversation_members` | 会話メンバー |
| `dm_messages` | メッセージ |
| `chat_progress` | AI チャットの進捗状態 |
| `chat_messages` | AI チャットの会話履歴 |

---

## トラブルシューティング

### DB 接続エラー

```bash
# PostgreSQL コンテナの起動確認
docker ps | grep del4-postgres

# 起動していない場合
docker compose -f docker-compose.db.yml up -d
```

### E5 モデルのダウンロードが遅い / 失敗する

初回起動時に約 2 GB のモデルをダウンロードします。事前にダウンロードする場合:

```bash
python -c "
from transformers import AutoTokenizer, AutoModel
AutoTokenizer.from_pretrained('intfloat/multilingual-e5-large')
AutoModel.from_pretrained('intfloat/multilingual-e5-large')
"
```

### メモリ不足 (Python API)

- 最低推奨メモリ: 4 GB RAM
- 推奨: 8 GB RAM 以上

### WebSocket に接続できない

`server.mjs` 経由で起動しているか確認してください。`next dev` (標準) ではなく `npm run dev` を使用してください。

### NEXTAUTH_SECRET が未設定のエラー

`.env` または `.env.local` に `NEXTAUTH_SECRET` を設定してください。開発環境では任意のランダム文字列で構いません。

```bash
# ランダム文字列の生成例
openssl rand -base64 32
```

  ---                                                                                             
   
  ## 3Dモデルの著作権と取り扱いについて                                                           
                  
  本プロジェクトで使用している3Dモデルは、有坂みと(@Mito_Arisaka)様によるVRSNS向けアバターブランド[ぷらすわん] 様のモデルをベースに、独自に髪型のカスタマイズおよびアニメーションの実装を行った改変データです。
                                                                                                  
  **データの二次配布禁止:**                                                                       
  本アプリに含まれる `.glb`
  ファイルは、モデル制作者様の規約に基づき、データの抽出・ダウンロード・再利用を固く禁じます。    
                  
  **著作権の帰属:**                                                                               
  モデルの基礎構造（メッシュ・ボーン等）の著作権は元の作者様に帰属します。独自に追加したアニメーシ
  ョンやカスタム部分を含め、一括してデータの持ち出しは許可されておりません。                      
                  
  クリエイターの権利を尊重し、本アプリ内での鑑賞・体験のみをお楽しみください。   
