# Vector Function 統合ガイド

E5ベクトル化機能をdel4に統合した際の変更内容と使用方法

## 📦 統合内容

### 1. ディレクトリ構造

```
del4/
├── app/
│   ├── api/
│   │   └── vector/              # 新規: Vector API Routes
│   │       ├── vectorize/
│   │       ├── matching/
│   │       └── profile/
│   └── function/
│       └── vector/              # 新規: Python FastAPI Service
│           ├── backend/
│           ├── main.py
│           ├── requirements.txt
│           ├── docker-compose.yml
│           └── README.md
└── lib/
    └── database/
        ├── schema.ts           # 更新: profiles, profile_vectors追加
        └── profiles.ts         # 新規: プロフィールDB操作
```

### 2. データベーススキーマの追加

`lib/database/schema.ts`に以下のテーブルを追加:

#### `profiles` テーブル
- ユーザーのプロフィール情報（JSON形式）
- 自分/求める相手/求めない相手の3種類

#### `profile_vectors` テーブル
- E5モデルで生成された1024次元ベクトル
- pgvectorを使用した高速類似度検索

### 3. API エンドポイント

#### Next.js API Routes (`/api/vector/*`)

```typescript
// プロフィール作成・更新
POST /api/vector/profile
Request: {
  myProfile: object,
  desiredProfile: object,
  undesiredProfile: object
}

// プロフィール取得
GET /api/vector/profile

// マッチング実行
POST /api/vector/matching
Request: { userId: string }

// テキストベクトル化
POST /api/vector/vectorize
Request: { texts: string[] }
```

#### FastAPI Service (`http://localhost:8000/api/v1/*`)

```python
GET  /api/v1/health              # ヘルスチェック
POST /api/v1/vectorize           # テキストベクトル化
POST /api/v1/vectorize-full      # プロフィール完全ベクトル化
POST /api/v1/matching            # マッチング計算
POST /api/v1/profile             # プロフィール取得
```

## 🚀 起動方法

### 1. Next.jsアプリケーション

```bash
cd del4
npm install
npm run dev
```

### 2. Vector Function（FastAPI）

#### Docker使用（推奨）

```bash
cd app/function/vector
docker-compose up -d
```

#### ローカル環境

```bash
cd app/function/vector
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

## 📝 使用例

### プロフィール作成と自動ベクトル化

```typescript
// 1. プロフィールを作成（自動的にベクトル化される）
const response = await fetch('/api/vector/profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    myProfile: {
      age: 25,
      location: "東京",
      interests: ["旅行", "カフェ巡り", "写真"],
      values: ["誠実さ", "冒険心", "成長"],
      bio: "自然が好きで、週末はよくハイキングに行きます"
    },
    desiredProfile: {
      age_range: "23-30",
      interests: ["アウトドア", "旅行"],
      values: ["誠実さ", "前向き"]
    },
    undesiredProfile: {
      habits: ["喫煙"],
      values: ["怠惰"]
    }
  })
});

const data = await response.json();
console.log(data);
// { success: true, profileId: "...", message: "..." }
```

### マッチング実行

```typescript
// 2. マッチング実行（ベクトル類似度計算）
const matchResponse = await fetch('/api/vector/matching', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: session.user.id
  })
});

const matches = await matchResponse.json();
console.log(matches);
/*
{
  success: true,
  matchCount: 3,
  matches: [
    {
      rank: 1,
      accountId: "...",
      name: "山田太郎",
      email: "yamada@example.com",
      scores: {
        desired: "0.85",    // 求める相手との類似度
        undesired: "0.32",  // 求めない相手との類似度
        final: "0.53"       // 最終スコア = desired - undesired
      }
    },
    ...
  ]
}
*/
```

### プロフィール取得

```typescript
// 3. プロフィールとベクトル情報の取得
const profileResponse = await fetch('/api/vector/profile');
const profile = await profileResponse.json();
console.log(profile);
/*
{
  success: true,
  profile: {
    id: "...",
    userId: "...",
    myProfile: { ... },
    desiredProfile: { ... },
    undesiredProfile: { ... }
  },
  hasVectors: true
}
*/
```

## 🔧 環境変数

### Next.js (`.env.local`)

```bash
# Vector Function APIのURL
VECTOR_API_URL=http://localhost:8000/api/v1

# データベース
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# NextAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
```

### Vector Function (`app/function/vector/.env`)

```bash
# データベース
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# ログレベル
LOG_LEVEL=INFO

# CORS設定
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# E5モデル設定
E5_MODEL_NAME=intfloat/multilingual-e5-large
E5_DEVICE=cpu
E5_BATCH_SIZE=32
```

## 📊 マッチングアルゴリズム

### スコア計算式

```
最終スコア = 求める相手の類似度 - 求めない相手の類似度
```

### 例

ユーザーA:
- 自分: "アウトドアが好き、旅行好き"
- 求める相手: "アクティブ、冒険心がある"
- 求めない相手: "インドア派、消極的"

ユーザーB:
- 自分: "登山が趣味、世界中を旅している"

マッチング計算:
1. Aの「求める相手」ベクトル ⟷ Bの「自分」ベクトル → 類似度 0.85
2. Aの「求めない相手」ベクトル ⟷ Bの「自分」ベクトル → 類似度 0.32
3. 最終スコア = 0.85 - 0.32 = **0.53** ✅ 相性良い

## 🐛 トラブルシューティング

### エラー: "Cannot connect to Vector API"

**原因**: FastAPIサービスが起動していない

**解決策**:
```bash
cd app/function/vector
docker-compose ps  # 起動確認
docker-compose up -d  # 起動
```

### エラー: "Vectorization failed"

**原因**: E5モデルのダウンロードが完了していない

**解決策**:
```bash
# ログを確認
docker-compose logs -f vector-api

# 初回起動時は2-3分待つ（モデルダウンロード）
```

### エラー: "Database connection failed"

**原因**: PostgreSQLが起動していない、またはDATABASE_URLが間違っている

**解決策**:
```bash
# PostgreSQL起動確認
docker ps | grep postgres

# 環境変数確認
echo $DATABASE_URL
```

### メモリ不足エラー

**原因**: E5モデルは大量のメモリを使用（最低4GB必要）

**解決策**:
- Dockerのメモリ制限を増やす
- 他のアプリケーションを終了する
- サーバースペックを上げる

## 📈 パフォーマンス最適化

### ベクトル検索の高速化

```sql
-- pgvectorのインデックスを作成
CREATE INDEX ON profile_vectors 
USING ivfflat (my_profile_vector vector_cosine_ops) 
WITH (lists = 100);

CREATE INDEX ON profile_vectors 
USING ivfflat (desired_profile_vector vector_cosine_ops) 
WITH (lists = 100);

CREATE INDEX ON profile_vectors 
USING ivfflat (undesired_profile_vector vector_cosine_ops) 
WITH (lists = 100);
```

### キャッシュ戦略

- ベクトルは変更されない限り再計算不要
- `profile_vectors`テーブルに保存して再利用
- マッチング結果は一定期間キャッシュ可能

## 🔗 関連ドキュメント

- [Vector Function README](./app/function/vector/README.md)
- [E5 Model Documentation](https://huggingface.co/intfloat/multilingual-e5-large)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

## ✅ チェックリスト

統合後の確認項目:

- [ ] Next.jsアプリケーションが起動する
- [ ] Vector Function (FastAPI) が起動する
- [ ] データベースに`profiles`と`profile_vectors`テーブルが存在する
- [ ] `/api/vector/health`にアクセスできる
- [ ] プロフィール作成が成功する
- [ ] ベクトル化が実行される
- [ ] マッチングが動作する
- [ ] エラーハンドリングが適切に機能する

## 🎉 完了

Vector Function（E5ベクトル化）がdel4に正常に統合されました！
