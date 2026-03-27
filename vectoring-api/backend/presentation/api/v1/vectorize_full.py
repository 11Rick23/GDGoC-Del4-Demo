"""
ベクトル化統合エンドポイント
プロフィール取得 → ベクトル化 → DB保存までを一括処理
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import structlog
import json
import uuid

from infrastructure.ml.vectorizer import vectorizer
from infrastructure.database.pool import get_pool

logger = structlog.get_logger(__name__)
router = APIRouter()


class VectorizeFullRequest(BaseModel):
    """ベクトル化リクエスト"""
    userId: str


class VectorizeFullResponse(BaseModel):
    """ベクトル化レスポンス"""
    success: bool
    userId: str
    profileId: str
    message: str
    vectorDimension: int


@router.post("/vectorize-full", response_model=VectorizeFullResponse)
async def vectorize_full(request: VectorizeFullRequest):
    """
    プロフィールの完全ベクトル化

    1. DBからプロフィール取得
    2. E5モデルでバッチベクトル化（3テキストを1回のモデル呼び出し）
    3. profile_vectorsテーブルに保存

    Args:
        request: accountIdを含むリクエスト

    Returns:
        ベクトル化結果
    """
    try:
        logger.info("vectorize_full_request", user_id=request.userId)

        async with get_pool().acquire() as conn:
            # 1. プロフィールを取得
            logger.info("fetching_profile", user_id=request.userId)
            profile_row = await conn.fetchrow(
                """
                SELECT id, user_id, my_profile, desired_profile, undesired_profile
                FROM profiles
                WHERE user_id = $1
                LIMIT 1
                """,
                request.userId
            )

            if not profile_row:
                logger.warning("profile_not_found", user_id=request.userId)
                raise HTTPException(
                    status_code=404,
                    detail={
                        "error": "Profile not found",
                        "message": f"指定されたuserId ({request.userId}) に対応するプロフィールが見つかりません。"
                    }
                )

            profile_id = profile_row['id']
            logger.info("profile_fetched", profile_id=profile_id)

            # 2. プロフィールをパースしてテキスト化
            my_profile_text = json.dumps(
                json.loads(profile_row['my_profile']), ensure_ascii=False
            )
            desired_profile_text = json.dumps(
                json.loads(profile_row['desired_profile']), ensure_ascii=False
            )
            undesired_profile_text = json.dumps(
                json.loads(profile_row['undesired_profile']), ensure_ascii=False
            )

            logger.info("profiles_parsed", profile_id=profile_id)

            # 3. E5モデルでバッチベクトル化（3テキストを1回のモデル呼び出しで処理）
            logger.info("vectorizing_profiles", profile_id=profile_id)

            try:
                vectors = await vectorizer.vectorize_batch([
                    my_profile_text,
                    desired_profile_text,
                    undesired_profile_text,
                ])
                my_vector, desired_vector, undesired_vector = vectors
            except Exception as vec_error:
                logger.error("vectorization_failed", error=str(vec_error))
                raise HTTPException(
                    status_code=500,
                    detail={
                        "error": "Vectorization failed",
                        "message": "プロフィールのベクトル化に失敗しました。",
                        "details": str(vec_error)
                    }
                )

            vector_dimension = len(my_vector)
            logger.info("vectorization_complete", dimension=vector_dimension)

            # 4. DBに保存（UPSERT）
            logger.info("saving_vectors_to_db", profile_id=profile_id)

            my_vector_str = str(my_vector.tolist())
            desired_vector_str = str(desired_vector.tolist())
            undesired_vector_str = str(undesired_vector.tolist())

            try:
                await conn.execute(
                    """
                    INSERT INTO profile_vectors (id, profile_id, my_profile_vector, desired_profile_vector, undesired_profile_vector)
                    VALUES ($1, $2, $3::vector, $4::vector, $5::vector)
                    ON CONFLICT (profile_id)
                    DO UPDATE SET
                        my_profile_vector = $3::vector,
                        desired_profile_vector = $4::vector,
                        undesired_profile_vector = $5::vector,
                        updated_at = NOW()
                    """,
                    str(uuid.uuid4()),
                    profile_id,
                    my_vector_str,
                    desired_vector_str,
                    undesired_vector_str
                )
            except Exception as db_error:
                logger.error("db_save_failed", error=str(db_error))
                raise HTTPException(
                    status_code=500,
                    detail={
                        "error": "Database save failed",
                        "message": "ベクトルのDB保存に失敗しました。",
                        "details": str(db_error)
                    }
                )

        logger.info("vectors_saved_successfully", profile_id=profile_id)

        return VectorizeFullResponse(
            success=True,
            userId=request.userId,
            profileId=str(profile_id),
            message="Vectors generated and saved successfully",
            vectorDimension=vector_dimension
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("vectorize_full_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Vectorize full failed",
                "message": "ベクトル化処理中にエラーが発生しました。",
                "details": str(e)
            }
        )
