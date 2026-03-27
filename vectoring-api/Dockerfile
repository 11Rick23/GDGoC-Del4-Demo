# Vector Function Dockerfile
# Python FastAPI + E5 Model

FROM python:3.11-slim

WORKDIR /app

# システム依存関係のインストール
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python依存関係のインストール
COPY requirements.txt pyproject.toml ./
RUN pip install --no-cache-dir -r requirements.txt

# backend/ をモジュールルートとして認識させる
ENV PYTHONPATH=/app/backend

# アプリケーションコードのコピー
COPY backend ./backend
COPY main.py ./

# E5モデルの事前ダウンロード（オプション）
# RUN python -c "from transformers import AutoTokenizer, AutoModel; AutoTokenizer.from_pretrained('intfloat/multilingual-e5-large'); AutoModel.from_pretrained('intfloat/multilingual-e5-large')"

# ポート公開
EXPOSE 8000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# アプリケーション起動
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
