#!/bin/bash
# Vector Function テストスクリプト

set -e

BASE_URL="http://localhost:8000/api/v1"

echo "🧪 Vector Function API テストを開始します..."
echo ""

# カラー設定
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ヘルスチェック
echo "1️⃣  ヘルスチェック"
echo "----------------------------------------"
HEALTH_RESPONSE=$(curl -s ${BASE_URL}/health)
echo "Response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo -e "${GREEN}✅ ヘルスチェック成功${NC}"
else
    echo -e "${RED}❌ ヘルスチェック失敗${NC}"
    exit 1
fi
echo ""

# テキストベクトル化テスト
echo "2️⃣  テキストベクトル化テスト"
echo "----------------------------------------"
VECTORIZE_RESPONSE=$(curl -s -X POST ${BASE_URL}/vectorize \
  -H "Content-Type: application/json" \
  -d '{"texts": ["こんにちは世界", "AIベクトル化のテスト"]}')

# JSONから次元数を抽出
DIMENSION=$(echo "$VECTORIZE_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('dimension', 0))" 2>/dev/null || echo "0")
VECTOR_COUNT=$(echo "$VECTORIZE_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('vectors', [])))" 2>/dev/null || echo "0")

echo "Dimension: $DIMENSION"
echo "Vector Count: $VECTOR_COUNT"

if [ "$DIMENSION" = "1024" ] && [ "$VECTOR_COUNT" = "2" ]; then
    echo -e "${GREEN}✅ ベクトル化成功 (1024次元 × 2個)${NC}"
else
    echo -e "${RED}❌ ベクトル化失敗${NC}"
    echo "Response: $VECTORIZE_RESPONSE"
    exit 1
fi
echo ""

# ベクトルのサンプル表示
echo "3️⃣  ベクトルサンプル（最初の10要素）"
echo "----------------------------------------"
echo "$VECTORIZE_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'vectors' in data and len(data['vectors']) > 0:
    print('Vector 1:', data['vectors'][0][:10])
    print('Vector 2:', data['vectors'][1][:10])
" 2>/dev/null
echo ""

# 単一テキストのベクトル化
echo "4️⃣  単一テキストのベクトル化"
echo "----------------------------------------"
SINGLE_RESPONSE=$(curl -s -X POST ${BASE_URL}/vectorize \
  -H "Content-Type: application/json" \
  -d '{"texts": ["自然が好きで、週末はよくハイキングに行きます。プログラミングも趣味です。"]}')

SINGLE_DIM=$(echo "$SINGLE_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('dimension', 0))" 2>/dev/null || echo "0")

if [ "$SINGLE_DIM" = "1024" ]; then
    echo -e "${GREEN}✅ 単一テキストのベクトル化成功${NC}"
else
    echo -e "${RED}❌ 単一テキストのベクトル化失敗${NC}"
    exit 1
fi
echo ""

# エラーハンドリングテスト
echo "5️⃣  エラーハンドリングテスト"
echo "----------------------------------------"
echo "空のテキスト配列でテスト..."
ERROR_RESPONSE=$(curl -s -X POST ${BASE_URL}/vectorize \
  -H "Content-Type: application/json" \
  -d '{"texts": []}')

if echo "$ERROR_RESPONSE" | grep -q "error"; then
    echo -e "${GREEN}✅ エラーハンドリング正常（空配列を拒否）${NC}"
else
    echo -e "${YELLOW}⚠️  エラーハンドリングの改善が必要${NC}"
fi
echo ""

# まとめ
echo "========================================="
echo -e "${GREEN}🎉 全てのテストが完了しました！${NC}"
echo "========================================="
echo ""
echo "📝 次のステップ:"
echo "  - TESTING.mdを参照して、より詳細なテストを実行"
echo "  - プロフィールのベクトル化とマッチング機能をテスト"
echo "  - Next.jsアプリケーションとの統合をテスト"
echo ""
