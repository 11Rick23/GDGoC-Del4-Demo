"""
ベクトル化エンドポイント
複数のテキストをE5モデルでベクトル化
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import structlog

from infrastructure.ml.vectorizer import vectorizer

logger = structlog.get_logger(__name__)
router = APIRouter()


class VectorizeRequest(BaseModel):
    """ベクトル化リクエスト"""
    texts: List[str]


class VectorizeResponse(BaseModel):
    """ベクトル化レスポンス"""
    vectors: List[List[float]]
    dimension: int


@router.post("/vectorize", response_model=VectorizeResponse)
async def vectorize_texts(request: VectorizeRequest):
    """
    複数のテキストをベクトル化
    
    Args:
        request: ベクトル化リクエスト（textsの配列）
    
    Returns:
        ベクトルの配列と次元数
    
    Raises:
        HTTPException: 入力検証エラー、ベクトル化エラー
    """
    try:
        logger.info("vectorize_request_received", text_count=len(request.texts))
        
        # 入力検証: 空のリスト
        if not request.texts:
            logger.warning("empty_texts_array")
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Empty texts array",
                    "message": "texts配列が空です。少なくとも1つのテキストを含めてください。"
                }
            )
        
        # 入力検証: 最大件数
        if len(request.texts) > 100:
            logger.warning("too_many_texts", count=len(request.texts))
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Too many texts",
                    "message": f"一度に送信できるテキストは最大100件です。現在: {len(request.texts)}件"
                }
            )
        
        # 入力検証: 空文字列チェック
        for idx, text in enumerate(request.texts):
            if not text or not text.strip():
                logger.warning("empty_text_found", index=idx)
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "Empty text found",
                        "message": f"インデックス {idx} のテキストが空です。全てのテキストは空でない必要があります。"
                    }
                )

        # バッチ処理で一括ベクトル化（モデルのGPU/CPU最適化を活用）
        try:
            embeddings = await vectorizer.vectorize_batch(request.texts)
            vectors = [emb.tolist() for emb in embeddings]
            logger.debug("batch_vectorized", count=len(vectors))
        except Exception as vec_error:
            logger.error("batch_vectorization_failed", error=str(vec_error))
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Vectorization failed",
                    "message": "テキストのバッチベクトル化に失敗しました。",
                    "details": str(vec_error)
                }
            )
        
        logger.info(
            "vectorize_success",
            text_count=len(request.texts),
            vector_dimension=len(vectors[0]) if vectors else 0
        )
        
        return VectorizeResponse(
            vectors=vectors,
            dimension=len(vectors[0]) if vectors else 0
        )
        
    except HTTPException:
        # HTTPExceptionはそのまま再送出
        raise
    except Exception as e:
        # 予期しないエラー
        logger.error("unexpected_vectorize_error", error=str(e), error_type=type(e).__name__)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Unexpected error",
                "message": "ベクトル化処理中に予期しないエラーが発生しました。",
                "details": str(e),
                "error_type": type(e).__name__
            }
        )
