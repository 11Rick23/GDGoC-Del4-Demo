"""
E5モデルによるベクトル化実装

sentence-transformers使用
"""

import asyncio
import time
from concurrent.futures import ThreadPoolExecutor
from typing import List

import numpy as np
from numpy.typing import NDArray

from sentence_transformers import SentenceTransformer

from infrastructure.config.logging_config import get_logger
from infrastructure.config.settings import get_settings

logger = get_logger(__name__)

# モデルはCPUバウンドなので専用スレッドプールで実行
_executor = ThreadPoolExecutor(max_workers=1)


class E5VectorizerImpl:
    """E5ベクトル化サービス実装"""

    def __init__(self):
        settings = get_settings()
        logger.info(
            "initializing_e5_model",
            model_name=settings.MODEL_NAME,
            cache_dir=settings.MODEL_CACHE_DIR
        )

        start = time.time()
        self.model = SentenceTransformer(
            settings.MODEL_NAME,
            cache_folder=settings.MODEL_CACHE_DIR,
            device=settings.MODEL_DEVICE,
        )
        elapsed = time.time() - start

        logger.info("e5_model_loaded", elapsed_sec=f"{elapsed:.2f}")

    async def vectorize(self, text: str) -> NDArray:
        """テキストをベクトル化（イベントループをブロックしない）"""
        logger.debug("vectorizing_text", text_length=len(text))

        try:
            start = time.time()
            loop = asyncio.get_event_loop()
            embedding = await loop.run_in_executor(
                _executor,
                lambda: self.model.encode(text, normalize_embeddings=True)
            )
            elapsed = time.time() - start

            logger.debug(
                "vectorization_complete",
                dimensions=len(embedding),
                elapsed_ms=f"{elapsed * 1000:.1f}"
            )

            return embedding

        except Exception as e:
            logger.error("vectorization_failed", error=str(e))
            raise

    async def vectorize_batch(self, texts: List[str]) -> List[NDArray]:
        """複数テキストを一括ベクトル化（モデルのバッチ処理を活用）"""
        logger.debug("vectorizing_batch", text_count=len(texts))

        try:
            start = time.time()
            loop = asyncio.get_event_loop()
            embeddings = await loop.run_in_executor(
                _executor,
                lambda: self.model.encode(texts, normalize_embeddings=True)
            )
            elapsed = time.time() - start

            logger.debug(
                "batch_vectorization_complete",
                count=len(embeddings),
                elapsed_ms=f"{elapsed * 1000:.1f}"
            )

            return list(embeddings)

        except Exception as e:
            logger.error("batch_vectorization_failed", error=str(e))
            raise
