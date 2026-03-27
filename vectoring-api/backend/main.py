"""
FastAPI メインアプリケーション

Onion Architecture エントリーポイント
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.infrastructure.config.logging_config import setup_logging, get_logger
from backend.infrastructure.config.settings import get_settings
from backend.presentation.api.v1 import health, vectorize, vectorize_full, matching, profile

# 設定読み込み
settings = get_settings()

# ロギング設定
setup_logging(log_level=settings.LOG_LEVEL)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """アプリケーションライフサイクル"""
    # 起動時
    logger.info("application_starting")
    logger.info("vector_matching_api_ready")
    
    yield
    
    # 終了時
    logger.info("application_shutting_down")
    logger.info("vector_matching_api_closed")


# FastAPIアプリ作成
app = FastAPI(
    title="Vector Matching API",
    description="ユーザープロフィールのベクトルマッチングAPI",
    version="1.0.0",
    lifespan=lifespan
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーター登録
app.include_router(health.router, prefix=settings.API_PREFIX, tags=["Health"])
app.include_router(vectorize.router, prefix=settings.API_PREFIX, tags=["Vectorize"])
app.include_router(vectorize_full.router, prefix=settings.API_PREFIX, tags=["Vectorize Full"])
app.include_router(matching.router, prefix=settings.API_PREFIX, tags=["Matching"])
app.include_router(profile.router, prefix=settings.API_PREFIX, tags=["Profile"])

logger.info("fastapi_app_created")
