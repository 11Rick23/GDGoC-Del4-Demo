"""
マッチングエンドポイント
ベクトル検索によるマッチング計算
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import structlog
import json

from infrastructure.database.pool import get_pool

logger = structlog.get_logger(__name__)
router = APIRouter()


class MatchingRequest(BaseModel):
    """マッチングリクエスト"""
    userId: str


class MatchScore(BaseModel):
    """マッチスコア"""
    desired: str
    undesired: str
    final: str


class MatchResult(BaseModel):
    """マッチ結果"""
    rank: int
    userId: str
    name: str
    email: str
    profileId: str
    profile: dict
    scores: MatchScore


class MatchingResponse(BaseModel):
    """マッチングレスポンス"""
    success: bool
    requestUserId: str
    matchCount: int
    matches: List[MatchResult]


@router.post("/matching", response_model=MatchingResponse)
async def matching(request: MatchingRequest):
    """
    マッチング実行

    1. リクエストユーザーのベクトルを取得
    2. 全ユーザーとの類似度計算（pgvector）
    3. 最終スコア = desired類似度 - undesired類似度
    4. 上位3名を返却

    Args:
        request: userIdを含むリクエスト（NextAuth users.id）

    Returns:
        マッチング結果
    """
    try:
        logger.info("matching_request", user_id=request.userId)

        async with get_pool().acquire() as conn:
            # 1. リクエストユーザーのプロフィールを取得
            logger.info("fetching_user_profile", user_id=request.userId)

            profile_row = await conn.fetchrow(
                """
                SELECT p.id, p.user_id, u.name, u.email
                FROM profiles p
                INNER JOIN users u ON p.user_id = u.id
                WHERE p.user_id = $1
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
            logger.info("profile_found", profile_id=profile_id)

            # 2. リクエストユーザーのベクトルを取得
            logger.info("fetching_user_vectors", profile_id=profile_id)

            vector_row = await conn.fetchrow(
                """
                SELECT desired_profile_vector, undesired_profile_vector
                FROM profile_vectors
                WHERE profile_id = $1
                LIMIT 1
                """,
                profile_id
            )

            if not vector_row:
                logger.warning("vectors_not_found", profile_id=profile_id)
                raise HTTPException(
                    status_code=404,
                    detail={
                        "error": "Vectors not found",
                        "message": "ベクトルデータが見つかりません。先にプロフィールを登録してベクトル化してください。"
                    }
                )

            desired_vector = vector_row['desired_profile_vector']
            undesired_vector = vector_row['undesired_profile_vector']
            logger.info("vectors_fetched")

            # 3. マッチング計算（pgvector）
            logger.info("calculating_matches")

            try:
                matches = await conn.fetch(
                    """
                    SELECT
                        u.id as user_id,
                        u.name,
                        u.email,
                        p.id as profile_id,
                        p.my_profile,
                        -- 求める相手の類似度
                        1 - (pv.my_profile_vector <=> $1::vector) as desired_score,
                        -- 求めない相手の類似度
                        1 - (pv.my_profile_vector <=> $2::vector) as undesired_score,
                        -- 最終スコア = desired_score - undesired_score
                        (1 - (pv.my_profile_vector <=> $1::vector)) -
                        (1 - (pv.my_profile_vector <=> $2::vector)) as final_score
                    FROM users u
                    INNER JOIN profiles p ON u.id = p.user_id
                    INNER JOIN profile_vectors pv ON p.id = pv.profile_id
                    WHERE u.id != $3
                    ORDER BY final_score DESC
                    LIMIT 3
                    """,
                    desired_vector,
                    undesired_vector,
                    request.userId
                )
            except Exception as match_error:
                logger.error("matching_calculation_failed", error=str(match_error))
                raise HTTPException(
                    status_code=500,
                    detail={
                        "error": "Matching calculation failed",
                        "message": "マッチング計算中にエラーが発生しました。pgvector拡張が有効か確認してください。",
                        "details": str(match_error)
                    }
                )

            logger.info("matching_complete", match_count=len(matches))

            # 4. 結果を整形
            results = []
            for idx, row in enumerate(matches):
                try:
                    results.append(MatchResult(
                        rank=idx + 1,
                        userId=str(row['user_id']),
                        name=row['name'],
                        email=row['email'],
                        profileId=str(row['profile_id']),
                        profile=json.loads(row['my_profile']),
                        scores=MatchScore(
                            desired=f"{float(row['desired_score']):.4f}",
                            undesired=f"{float(row['undesired_score']):.4f}",
                            final=f"{float(row['final_score']):.4f}"
                        )
                    ))
                except Exception as parse_error:
                    logger.error("result_parsing_failed", error=str(parse_error), index=idx)
                    raise HTTPException(
                        status_code=500,
                        detail={
                            "error": "Result parsing failed",
                            "message": "マッチング結果の整形中にエラーが発生しました。",
                            "details": str(parse_error)
                        }
                    )

        logger.info("matching_results_prepared", result_count=len(results))

        for result in results:
            logger.info(
                "match_result",
                rank=result.rank,
                name=result.name,
                final_score=result.scores.final
            )

        return MatchingResponse(
            success=True,
            requestUserId=request.userId,
            matchCount=len(results),
            matches=results
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("matching_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Matching failed",
                "message": "マッチング処理中にエラーが発生しました。",
                "details": str(e)
            }
        )
