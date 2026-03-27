# Vector Function セットアップガイド

E5ベクトル化機能のセットアップと起動方法

## 📋 必要なもの

- Python 3.11以上（推奨 3.12）
- Node.js 20以上
- 8GB以上のRAM（E5モデル用）

## 🚀 クイックスタート

### 1. Python環境のセットアップ

```bash
# プロジェクトルート（del4/）で実行
python3 -m venv .venv
source .venv/bin/activate  # macOS/Linux
# または
.venv\Scripts\activate     # Windows

# 依存関係インストール
pip install -r vectoring-api/requirements.txt
```

mise を使う場合:
```bash
mise run setup
```

### 2. Vector Functionの起動

```bash
# 簡単な方法（推奨）
cd vectoring-api
./start.sh
```

または

```bash
# 手動起動（プロジェクトルートから）
mise run dev
```

または手動:
```bash
cd vectoring-api
PYTHONPATH=./backend ../.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. 動作確認

別のターミナルで:

```bash
# ヘルスチェック
curl http://localhost:8000/api/v1/health

# ベクトル化テスト
curl -X POST http://localhost:8000/api/v1/vectorize \
  -H "Content-Type: application/json" \
  -d '{"texts": ["こんにちは"]}'
```

## 🐳 Docker使用（オプション）

```bash
cd vectoring-api
docker compose up -d

# ログ確認
docker compose logs -f

# 停止
docker compose down
```

> **Note**: Docker コンテナ内からホストの PostgreSQL (54322) へは `host.docker.internal` 経由で接続します。Linux では `extra_hosts` で自動解決されます。

## 📝 環境変数

`vectoring-api/.env` ファイルを編集（`.env.example` からコピー）:

```bash
# データベース
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# ログレベル
LOG_LEVEL=INFO

# CORS設定
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

## ⚠️ トラブルシューティング

### モジュールが見つからない（ImportError: No module named 'infrastructure'）

PYTHONPATH が正しく設定されていない可能性があります。`start.sh` または `mise run dev` を使用してください。
直接 uvicorn を実行する場合は必ず `PYTHONPATH=./backend` を指定:

```bash
cd vectoring-api
PYTHONPATH=./backend ../.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 仮想環境の再作成

```bash
# プロジェクトルート（del4/）で実行
rm -rf .venv
python3 -m venv .venv
.venv/bin/pip install -r vectoring-api/requirements.txt
```

### E5モデルのダウンロードが遅い

初回起動時、E5モデル（約2.24GB）がダウンロードされます。
完了まで数分かかる場合があります。

### ポート8000が使用中

```bash
# 使用中のプロセスを確認
lsof -i :8000

# プロセスを停止
kill -9 <PID>
```

## 📚 API ドキュメント

起動後、以下のURLでSwagger UIにアクセスできます:

- http://localhost:8000/docs （Swagger UI）
- http://localhost:8000/redoc （ReDoc）

## 🔗 統合情報

詳細な統合ガイドは `VECTOR_INTEGRATION.md` を参照してください。
