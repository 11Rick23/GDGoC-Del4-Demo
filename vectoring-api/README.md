# Vector Function

E5モデルを使用したベクトル化とマッチングAPIサービス

## 📁 構成

```
vectoring-api/
├── backend/              # Python FastAPI バックエンド
│   ├── infrastructure/   # インフラ層（設定・データベース・モデル）
│   └── presentation/     # API層
├── main.py              # FastAPIエントリーポイント
├── requirements.txt     # Python依存関係
├── docker-compose.yml   # Docker設定
├── Dockerfile          # Dockerイメージ
└── .env.example        # 環境変数例
```

## 🚀 セットアップ

### 方法1: Docker使用（推奨）

```bash
cd vectoring-api

# 環境変数設定
cp .env.example .env

# Docker Composeで起動
docker compose up -d

# ログ確認
docker compose logs -f vector-api
```

### 方法2: ローカル環境

```bash
# プロジェクトルート (del4/) で実行
python3 -m venv .venv
.venv/bin/pip install -r vectoring-api/requirements.txt

# 起動
cd vectoring-api
./start.sh
```

mise 使用:
```bash
mise run setup  # 一度だけ
mise run dev    # サーバー起動
```

## 📡 APIエンドポイント

### 1. ヘルスチェック

```bash
GET http://localhost:8000/api/v1/health
```

### 2. テキストベクトル化

```bash
POST http://localhost:8000/api/v1/vectorize
Content-Type: application/json

{
  "texts": [
    "自然が好きで、ハイキングをよく楽しみます",
    "都会での生活が好きです"
  ]
}
```

レスポンス:
```json
{
  "vectors": [[0.123, -0.456, ...], [0.789, -0.012, ...]],
  "dimension": 1024
}
```

### 3. マッチング

```bash
POST http://localhost:8000/api/v1/matching
Content-Type: application/json

{
  "accountId": "user-uuid-here"
}
```

レスポンス:
```json
{
  "success": true,
  "requestAccountId": "user-uuid",
  "matchCount": 3,
  "matches": [
    {
      "rank": 1,
      "accountId": "match-uuid",
      "name": "田中太郎",
      "email": "tanaka@example.com",
      "scores": {
        "desired": "0.85",
        "undesired": "0.32",
        "final": "0.53"
      }
    }
  ]
}
```

### 4. プロフィールベクトル化（完全版）

```bash
POST http://localhost:8000/api/v1/vectorize-full
Content-Type: application/json

{
  "accountId": "user-uuid-here"
}
```

## 🔗 Next.js統合

del4のNext.jsアプリケーションから使用する場合:

```typescript
// プロフィール作成・更新
const response = await fetch('/api/vector/profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    myProfile: { /* ... */ },
    desiredProfile: { /* ... */ },
    undesiredProfile: { /* ... */ }
  })
});

// マッチング実行
const matchResponse = await fetch('/api/vector/matching', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'current-user-id' })
});
```

## 🔧 環境変数

```bash
# データベース接続
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# ログレベル
LOG_LEVEL=INFO

# CORS設定
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# E5モデル設定
E5_MODEL_NAME=intfloat/multilingual-e5-large
E5_DEVICE=cpu
E5_BATCH_SIZE=32

# ベクトル次元数
VECTOR_DIMENSION=1024
```

## 🏗️ アーキテクチャ

```
┌─────────────────────────────────────────┐
│    Next.js Application (del4)          │
│                                         │
│  /app/api/vector/*                     │
│    ├─ /vectorize    (テキスト→ベクトル) │
│    ├─ /matching     (マッチング)        │
│    └─ /profile      (プロフィール管理)  │
└──────────────┬──────────────────────────┘
               │ HTTP Proxy
               ▼
┌─────────────────────────────────────────┐
│  FastAPI Service (Port 8000)           │
│                                         │
│  /api/v1/*                             │
│    ├─ /health                          │
│    ├─ /vectorize                       │
│    ├─ /vectorize-full                  │
│    ├─ /matching                        │
│    └─ /profile                         │
│                                         │
│  E5 Model (multilingual-e5-large)     │
│  - 1024次元ベクトル生成                 │
│  - 多言語対応                           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  PostgreSQL + pgvector                 │
│                                         │
│  Tables:                               │
│    - profiles                          │
│    - profile_vectors                   │
└─────────────────────────────────────────┘
```

## 📊 データベーススキーマ

```typescript
// profiles テーブル
{
  id: string
  userId: string
  myProfile: string (JSON)
  desiredProfile: string (JSON)
  undesiredProfile: string (JSON)
  createdAt: Date
  updatedAt: Date
}

// profile_vectors テーブル
{
  id: string
  profileId: string
  myProfileVector: number[] (1024次元)
  desiredProfileVector: number[] (1024次元)
  undesiredProfileVector: number[] (1024次元)
  createdAt: Date
  updatedAt: Date
}
```

## 🧪 テスト

```bash
# ヘルスチェック
curl http://localhost:8000/api/v1/health

# ベクトル化テスト
curl -X POST http://localhost:8000/api/v1/vectorize \
  -H "Content-Type: application/json" \
  -d '{"texts": ["こんにちは世界"]}'
```

## 🐛 トラブルシューティング

### E5モデルのダウンロードが遅い

初回起動時、E5モデル（約2GB）のダウンロードに時間がかかります:

```bash
# 事前ダウンロード
python -c "from transformers import AutoTokenizer, AutoModel; \
  AutoTokenizer.from_pretrained('intfloat/multilingual-e5-large'); \
  AutoModel.from_pretrained('intfloat/multilingual-e5-large')"
```

### メモリ不足

E5モデルは大きなメモリを必要とします:
- 最低推奨: 4GB RAM
- 推奨: 8GB RAM以上

### データベース接続エラー

```bash
# PostgreSQLの起動確認
docker ps | grep postgres

# DATABASE_URLの確認
echo $DATABASE_URL
```

## 📝 注意事項

- E5モデルは初回起動時に自動ダウンロードされます（約2GB）
- CPU版を使用（GPU版が必要な場合はDockerfileを修正）
- ベクトル次元数は1024固定
- 一度に最大100件のテキストをベクトル化可能

## 🔗 関連リンク

- [E5 Model (Hugging Face)](https://huggingface.co/intfloat/multilingual-e5-large)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [pgvector](https://github.com/pgvector/pgvector)
