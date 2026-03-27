#!/bin/bash
# Vector Function 起動スクリプト

# エラーが発生したら停止
set -e

# カレントディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Vector Function を起動しています..."
echo "📁 作業ディレクトリ: $SCRIPT_DIR"

# .envファイルのチェック
if [ ! -f ".env" ]; then
    echo "⚠️  .env ファイルが見つかりません。.env.exampleからコピーします..."
    cp .env.example .env
    echo "✅ .env ファイルを作成しました"
fi

# Python仮想環境のチェック
# vectoring-api/ の1階層上 (del4/) に .venv がある
VENV_PATH="$(cd .. && pwd)/.venv"
if [ ! -d "$VENV_PATH" ]; then
    echo "❌ Python仮想環境が見つかりません: $VENV_PATH"
    echo "   以下のコマンドで仮想環境を作成してください:"
    echo "   cd $(cd .. && pwd)"
    echo "   python3 -m venv .venv"
    echo "   source .venv/bin/activate"
    echo "   pip install -r vectoring-api/requirements.txt"
    exit 1
fi

# Pythonパッケージのチェック
if ! "$VENV_PATH/bin/python" -c "import fastapi" 2>/dev/null; then
    echo "⚠️  FastAPIがインストールされていません。インストールしています..."
    "$VENV_PATH/bin/pip" install -r requirements.txt
fi

# backend/ をモジュールルートとして追加（importが infrastructure.* で始まるため）
export PYTHONPATH="$SCRIPT_DIR/backend"

# サーバー起動
echo ""
echo "🎯 FastAPIサーバーを起動します..."
echo "   URL: http://localhost:8000"
echo "   Health Check: http://localhost:8000/api/v1/health"
echo "   PYTHONPATH: $PYTHONPATH"
echo ""
echo "   停止する場合は Ctrl+C を押してください"
echo ""

# uvicornで起動
"$VENV_PATH/bin/uvicorn" main:app --host 0.0.0.0 --port 8000 --reload
