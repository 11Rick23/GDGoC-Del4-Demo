"""
Health Check エンドポイント
"""

from fastapi import APIRouter

from backend.infrastructure.config.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.get("/health")
async def health_check():
    """ヘルスチェック"""
    logger.debug("health_check_called")
    return {
        "status": "ok",
        "message": "Vector Matching API is running"
    }
