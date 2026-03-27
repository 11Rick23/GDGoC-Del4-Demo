"""
プロフィール管理エンドポイント
DBとの連携を担当
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import structlog
import json
import uuid

from infrastructure.database.pool import get_pool

logger = structlog.get_logger(__name__)
router = APIRouter()


class Profile(BaseModel):
    """プロフィールデータ"""
    myProfile: dict
    desiredProfile: dict
    undesiredProfile: dict


class ProfileResponse(BaseModel):
    """プロフィールレスポンス"""
    userId: str
    profileId: str
    profile: Profile


@router.get("/profile/{user_id}", response_model=ProfileResponse)
async def get_profile(user_id: str):
    """
    プロフィール取得

    Args:
        user_id: ユーザーID（NextAuth users.id）

    Returns:
        プロフィールデータ
    """
    try:
        logger.info("get_profile_request", user_id=user_id)

        async with get_pool().acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, user_id, my_profile, desired_profile, undesired_profile
                FROM profiles
                WHERE user_id = $1
                LIMIT 1
                """,
                user_id
            )

        if not row:
            logger.warning("profile_not_found", user_id=user_id)
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "Profile not found",
                    "message": f"指定されたuser_id ({user_id}) に対応するプロフィールが見つかりません。"
                }
            )

        logger.info("profile_found", profile_id=row['id'])

        return ProfileResponse(
            userId=str(row['user_id']),
            profileId=str(row['id']),
            profile=Profile(
                myProfile=json.loads(row['my_profile']),
                desiredProfile=json.loads(row['desired_profile']),
                undesiredProfile=json.loads(row['undesired_profile'])
            )
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_profile_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to get profile",
                "message": "プロフィールの取得中にエラーが発生しました。",
                "details": str(e)
            }
        )


@router.post("/profile/{user_id}")
async def create_or_update_profile(user_id: str, profile: Profile):
    """
    プロフィール作成・更新

    Args:
        user_id: ユーザーID（NextAuth users.id）
        profile: プロフィールデータ

    Returns:
        作成・更新結果
    """
    try:
        logger.info("create_update_profile_request", user_id=user_id)

        my_profile_json = json.dumps(profile.myProfile, ensure_ascii=False)
        desired_profile_json = json.dumps(profile.desiredProfile, ensure_ascii=False)
        undesired_profile_json = json.dumps(profile.undesiredProfile, ensure_ascii=False)

        async with get_pool().acquire() as conn:
            result = await conn.fetchrow(
                """
                INSERT INTO profiles (id, user_id, my_profile, desired_profile, undesired_profile)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (user_id)
                DO UPDATE SET
                    my_profile = $3,
                    desired_profile = $4,
                    undesired_profile = $5,
                    updated_at = NOW()
                RETURNING id
                """,
                str(uuid.uuid4()),
                user_id,
                my_profile_json,
                desired_profile_json,
                undesired_profile_json
            )

        logger.info("profile_saved", profile_id=result['id'])

        return {
            "success": True,
            "userId": user_id,
            "profileId": result['id'],
            "message": "Profile saved successfully"
        }

    except Exception as e:
        logger.error("create_update_profile_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to save profile",
                "message": "プロフィールの保存中にエラーが発生しました。",
                "details": str(e)
            }
        )
