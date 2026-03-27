# セットアップガイド

## 構成

```
del4/           ← Next.js フロントエンド + API Routes
vector/backend/ ← Python FastAPI (ベクトル化・マッチング)
```

**DB**: PostgreSQL (localhost:54322) + pgvector
**スキーマ管理**: Drizzle ORM (`del4/lib/database/schema.ts`)

---

## 前提条件

- Node.js 20+
- Python 3.11+
- Docker Desktop（PostgreSQL用）
- Supabase CLI または Docker Compose でポート 54322 を開けること

---

## 初回セットアップ

### 1. PostgreSQL 起動

```bash
# Supabase local dev の場合
supabase start

# または docker-compose を使う場合
docker compose up -d
```

### 2. Next.js セットアップ

```bash
cd del4
npm install
```

`.env.local` を作成（存在しない場合）:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/del4db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=local-dev-secret-for-testing
VECTOR_API_URL=http://localhost:8000/api/v1
```

### 3. DB 初期化

```bash
cd del4

# データベース作成 + pgvector 有効化
npm run db:setup

# Drizzle スキーマを DB に適用
npm run db:push

# テストユーザー・プロフィールを投入
npm run db:seed
```

### 4. Python バックエンド セットアップ

```bash
cd vector/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

`vector/backend/.env` を確認（デフォルト値）:

```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:54322/del4db
MODEL_NAME=intfloat/multilingual-e5-large
MODEL_CACHE_DIR=/tmp/models
API_PREFIX=/api/v1
CORS_ORIGINS=["http://localhost:3000"]
```

### 5. ベクトル生成

バックエンドを起動:

```bash
cd vector/backend
source venv/bin/activate
PYTHONPATH=$PWD uvicorn main:app --reload --port 8000
```

`db:seed` で作成した各ユーザーのベクトルを生成:

```bash
# db:seed の出力に表示された userId を使う
curl -s -X POST http://localhost:8000/api/v1/vectorize-full \
  -H "Content-Type: application/json" \
  -d '{"userId": "<alice_の_userId>"}' | jq

curl -s -X POST http://localhost:8000/api/v1/vectorize-full \
  -H "Content-Type: application/json" \
  -d '{"userId": "<bob_の_userId>"}' | jq
```

---

## 開発サーバー起動（通常時）

```bash
# ターミナル 1: Python バックエンド
cd vector/backend
source venv/bin/activate
PYTHONPATH=$PWD uvicorn main:app --reload --port 8000

# ターミナル 2: Next.js
cd del4
npm run dev
```

- フロントエンド: http://localhost:3000
- API ドキュメント: http://localhost:8000/docs

---

## npm スクリプト一覧（del4/）

| コマンド | 内容 |
|---|---|
| `npm run dev` | Next.js 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run db:setup` | DB 作成 + pgvector 有効化 |
| `npm run db:push` | Drizzle スキーマを DB に適用 |
| `npm run db:seed` | テストデータ投入 |

---

## API エンドポイント

| メソッド | パス | 内容 |
|---|---|---|
| GET | `/api/v1/health` | ヘルスチェック |
| GET | `/api/v1/profile/{userId}` | プロフィール取得 |
| POST | `/api/v1/profile/{userId}` | プロフィール作成・更新 |
| POST | `/api/v1/vectorize-full` | プロフィールをベクトル化して保存 |
| POST | `/api/v1/matching` | マッチング検索（上位3件） |

### マッチングスコア計算

```
final_score = desired_similarity - undesired_similarity
```

- `desired`: リクエストユーザーの「求める相手」と候補者の類似度（高いほど良い）
- `undesired`: リクエストユーザーの「求めない相手」と候補者の類似度（低いほど良い）

---

## DB スキーマ概要

| テーブル | 内容 |
|---|---|
| `users` | NextAuth ユーザー（TEXT id） |
| `accounts` | OAuth アカウント情報 |
| `sessions` | セッション情報 |
| `profiles` | プロフィール JSON（myProfile / desiredProfile / undesiredProfile） |
| `profile_vectors` | E5 ベクトル 1024 次元 × 3種類 |

スキーマ定義: [del4/lib/database/schema.ts](del4/lib/database/schema.ts)

---

## トラブルシューティング

### `DATABASE_URL is not set` エラー（drizzle-kit）

`del4/.env.local` が存在するか確認。

### `pool not initialized` エラー（Python）

`vector/backend/.env` の `DATABASE_URL` が `del4db` を指しているか確認。

### `profile_vectors` への INSERT が失敗

`npm run db:push` でスキーマが適用されているか確認:

```bash
psql postgresql://postgres:postgres@localhost:54322/del4db -c "\dt"
```

### E5 モデルのダウンロードが遅い

初回起動時に `intfloat/multilingual-e5-large`（約 560MB）をダウンロードします。
`MODEL_CACHE_DIR` に指定したディレクトリにキャッシュされるので 2 回目以降は不要です。
