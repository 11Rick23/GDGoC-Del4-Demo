# テストガイド

このドキュメントでは、ベクトルマッチングシステムの完全なテスト手順を説明します。

## 前提条件

- Docker が起動していること
- mise がインストールされていること
- Python 3.12 と Node.js 25 が利用可能なこと
- `del4/.venv` に依存パッケージがインストール済みなこと

## 1. クリーンアップ（オプション）

既存の環境をクリーンアップする場合：

```bash
# プロジェクトルート (del4/) で実行
# Docker コンテナとボリュームを削除
cd vectoring-api && docker compose down -v

# キャッシュをクリーンアップ
rm -rf backend/__pycache__

# E5モデルキャッシュは削除しない（2.24GB、再ダウンロードに時間がかかる）
# 必要な場合のみ: rm -rf /tmp/models
```

## 2. セットアップ

### 2.1 Python環境とアプリケーションのセットアップ

```bash
# プロジェクトルート (del4/) で実行
mise run setup
```

このコマンドは以下を実行します：
- Python仮想環境 (`.venv`) の作成
- `vectoring-api/requirements.txt` のインストール（FastAPI、sentence-transformers など）

**所要時間**: 初回約9分（torch + sentence-transformers のダウンロード）

### 2.2 テストデータの投入

```bash
npm run db:seed
```

2つのテストユーザーが作成されます：

| Name | Email | 備考 |
|------|-------|------|
| Alice | alice@example.com | エンジニア・内向的 |
| Bob | bob@example.com | デザイナー・外向的 |

> **Note**: `userId` は実行のたびに nanoid で生成されます。seed の出力に表示される `userId=...` を控えて以降のコマンドに使用してください。

各ユーザーには以下が含まれます：
- `my_profile`: 自分のプロフィール
- `desired_profile`: 求める相手の特徴
- `undesired_profile`: 求めない相手の特徴

## 3. サーバー起動

```bash
mise run dev
```

FastAPI サーバーが port 8000 で起動します。
または `start.sh` で直接起動:

```bash
cd vectoring-api && ./start.sh
```

**初回起動時**:
- E5モデルのダウンロード（2.24GB、約2分）
- モデルのロード（約126秒）

**2回目以降**:
- キャッシュされたモデルのロード（約9秒）

サーバー起動後、以下のURLでAPIドキュメントを確認できます：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 4. APIテスト

### 4.1 ヘルスチェック

サーバーが正常に起動しているか確認：

```bash
curl http://localhost:8000/api/v1/health
```

**期待される応答**:
```json
{"status":"ok","message":"Vector Matching API is running"}
```

### 4.2 プロフィールのベクトル化

`npm run db:seed` の出力から `userId` を取得して、各ユーザーをベクトル化します：

**Alice**
```bash
curl -X POST http://localhost:8000/api/v1/vectorize-full \
  -H "Content-Type: application/json" \
  -d '{"userId":"<alice の userId>"}'
```

**Bob**
```bash
curl -X POST http://localhost:8000/api/v1/vectorize-full \
  -H "Content-Type: application/json" \
  -d '{"userId":"<bob の userId>"}'
```

**期待される応答**:
```json
{
  "success": true,
  "userId": "<userId>",
  "profileId": "<profileId>",
  "message": "Vectors generated and saved successfully",
  "vectorDimension": 1024
}
```

**処理内容**:
1. データベースからプロフィール（JSON）を取得
2. E5モデルで3つのテキストをベクトル化：
   - `my_profile_vector`: 自分のプロフィール（1024次元）
   - `desired_profile_vector`: 求める相手（1024次元）
   - `undesired_profile_vector`: 求めない相手（1024次元）
3. `profile_vectors` テーブルに保存

### 4.3 マッチング実行

Alice に対して最適なマッチを検索：

```bash
curl -X POST http://localhost:8000/api/v1/matching \
  -H "Content-Type: application/json" \
  -d '{"userId":"<alice の userId>"}'
```

**期待される応答**:
```json
{
  "success": true,
  "requestUserId": "<alice の userId>",
  "matchCount": 1,
  "matches": [
    {
      "rank": 1,
      "userId": "<bob の userId>",
      "name": "Bob",
      "email": "bob@example.com",
      "scores": {
        "desired": "0.9xxx",
        "undesired": "0.8xxx",
        "final": "0.0xxx"
      }
    }
  ]
}
```

## 5. マッチングアルゴリズムの解説

### スコア計算式

```
final_score = desired_similarity - undesired_similarity
```

### 計算手順

1. **Desired Score（求める相手との類似度）**
   ```sql
   1 - (他のユーザーのmy_profile_vector <=> 自分のdesired_profile_vector)
   ```
   - コサイン距離（`<=>`）を使用
   - `1 - 距離` で類似度に変換
   - 値が大きいほど、相手が「求める相手」に近い

2. **Undesired Score（求めない相手との類似度）**
   ```sql
   1 - (他のユーザーのmy_profile_vector <=> 自分のundesired_profile_vector)
   ```
   - 値が大きいほど、相手が「求めない相手」に近い

3. **Final Score（最終スコア）**
   ```
   final_score = desired_score - undesired_score
   ```
   - 求める相手に近く、かつ求めない相手から遠いほど高スコア
   - 上位3名を返却

### スコアの解釈例

**Bob（1位）**:
- Desired: 高い → Alice が求める相手（穏やか・誠実）に近い
- Undesired: 低い → Alice が求めない相手（短気・自己中心的）から遠い
- **Final** = Desired - Undesired の差分が大きいほど良いマッチ

## 6. その他のAPIエンドポイント

### プロフィール取得

```bash
curl http://localhost:8000/api/v1/profile/<userId>
```

### プロフィール作成・更新

```bash
curl -X POST http://localhost:8000/api/v1/profile/新しいアカウントID \
  -H "Content-Type: application/json" \
  -d '{
    "myProfile": {
      "bio": "テストユーザー",
      "interests": ["プログラミング"]
    },
    "desiredProfile": {
      "personality": "明るい人"
    },
    "undesiredProfile": {
      "personality": "ネガティブな人"
    }
  }'
```

### シンプルなテキストベクトル化

```bash
curl -X POST http://localhost:8000/api/v1/vectorize \
  -H "Content-Type: application/json" \
  -d '{
    "texts": ["こんにちは", "Hello World"]
  }'
```

## 7. トラブルシューティング

### PostgreSQL接続エラー

```bash
# コンテナの状態確認
docker ps

# コンテナが停止している場合、再起動
docker compose up -d
```

### E5モデルが見つからない

```bash
# モデルを再ダウンロード（キャッシュを削除）
rm -rf /tmp/models
mise run dev
```

### ポートが使用中

```bash
# ポート8000を使用しているプロセスを確認
lsof -i :8000

# プロセスを停止
kill -9 <PID>
```

### データベースをリセット

```bash
# データベースコンテナを完全削除
docker compose down -v

# 再セットアップ
mise run setup
npm run db:seed
```

## 8. テスト結果の確認

### データベース内のベクトルを確認

```bash
# PostgreSQLに接続
docker exec -it vector-postgres-1 psql -U postgres -d postgres

# ベクトルデータを確認
SELECT profile_id, 
       vector_dims(my_profile_vector) as my_dims,
       vector_dims(desired_profile_vector) as desired_dims,
       vector_dims(undesired_profile_vector) as undesired_dims
FROM profile_vectors;

# 終了
\q
```

### ログの確認

サーバーのターミナル出力で、以下のログを確認できます：

- `vectorize_full_request`: ベクトル化リクエスト受信
- `vectorizing_profiles`: E5モデルによるベクトル化中
- `vectorization_complete`: ベクトル化完了（dimension表示）
- `matching_request`: マッチングリクエスト受信
- `matching_complete`: マッチング計算完了（match_count表示）

## 9. パフォーマンス指標

### ベクトル化
- プロフィール1件: 約150-200ms
- 3つのベクトル（my/desired/undesired）を同時生成

### マッチング
- 3ユーザーに対する検索: 約20-50ms
- pgvectorのIVFFlatインデックス使用
- コサイン距離計算

### E5モデル
- モデルサイズ: 2.24GB
- 初回ロード: 約126秒
- 2回目以降: 約9秒（キャッシュ使用）
- ベクトル次元: 1024

## 10. まとめ

完全なテストフロー：

```bash
# 1. セットアップ
mise run setup
npm run db:seed

# 2. サーバー起動（別ターミナル）
mise run dev

# 3. ヘルスチェック
curl http://localhost:8000/api/v1/health

# 4. ベクトル化（seed出力の userId を使用）
curl -X POST http://localhost:8000/api/v1/vectorize-full \
  -H "Content-Type: application/json" \
  -d '{"userId":"<alice の userId>"}'

curl -X POST http://localhost:8000/api/v1/vectorize-full \
  -H "Content-Type: application/json" \
  -d '{"userId":"<bob の userId>"}'

# 5. マッチング実行
curl -X POST http://localhost:8000/api/v1/matching \
  -H "Content-Type: application/json" \
  -d '{"userId":"<alice の userId>"}'
```

**所要時間（初回）**: 約10分（E5モデルダウンロード含む）  
**所要時間（2回目以降）**: 約1分

---

最終更新: 2026年3月16日
