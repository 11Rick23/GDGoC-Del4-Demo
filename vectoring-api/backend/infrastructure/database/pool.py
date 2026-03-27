"""
asyncpg コネクションプール

リクエストごとに接続を作成する代わりに、
起動時にプールを初期化して全エンドポイントで共有する
"""

from typing import Optional

import asyncpg
from fastapi import HTTPException

from infrastructure.config.settings import get_settings


def _get_database_url() -> str:
    """pydantic-settingsから取得してasyncpg形式に正規化"""
    url = get_settings().DATABASE_URL
    return url.replace("postgresql+asyncpg://", "postgresql://").replace("postgres+asyncpg://", "postgresql://")

_pool: Optional[asyncpg.Pool] = None


async def init_pool() -> None:
    """アプリ起動時にコネクションプールを初期化"""
    global _pool
    _pool = await asyncpg.create_pool(
        _get_database_url(),
        min_size=2,
        max_size=10,
    )


async def close_pool() -> None:
    """アプリ終了時にプールをクローズ"""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.Pool:
    """プールを取得（未初期化の場合は例外）"""
    if _pool is None:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Database pool not initialized",
                "message": "データベース接続プールが初期化されていません。",
            }
        )
    return _pool
