"""
Application settings using pydantic-settings.
"""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables or .env file.
    """

    # Application
    APP_NAME: str = Field(default="vector-matching-api", description="Application name")
    DEBUG: bool = Field(default=False, description="Debug mode")
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    LOG_FILE: str = Field(default="logs/app.log", description="Log file path")

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:54322/del4db",
        description="PostgreSQL connection URL (asyncpg driver)",
    )
    DB_POOL_SIZE: int = Field(default=10, description="Database connection pool size")
    DB_MAX_OVERFLOW: int = Field(default=20, description="Maximum overflow connections")

    # E5 Model
    MODEL_NAME: str = Field(
        default="intfloat/multilingual-e5-large",
        description="Sentence Transformers model name",
    )
    MODEL_CACHE_DIR: str = Field(
        default="/tmp/models",
        description="Model cache directory",
    )
    MODEL_DEVICE: str = Field(
        default="cpu",
        description="Device for model inference: 'cpu' or 'cuda'",
    )
    EMBEDDING_DIMENSION: int = Field(
        default=1024,
        description="Embedding vector dimension",
    )

    # API
    API_PREFIX: str = Field(default="/api/v1", description="API v1 prefix")
    # カンマ区切りまたは JSON 配列を文字列で受け取り、cors_allow_origins プロパティで list に変換
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000",
        description="CORS allowed origins (comma-separated or JSON array string)",
    )

    @property
    def cors_allow_origins(self) -> list[str]:
        v = self.CORS_ORIGINS.strip()
        if v.startswith("["):
            import json
            return json.loads(v)
        return [s.strip() for s in v.split(",") if s.strip()]

    # Matching
    DEFAULT_SIMILARITY_THRESHOLD: float = Field(
        default=0.7,
        description="Default similarity threshold (0.0-1.0)",
    )
    DEFAULT_MATCH_LIMIT: int = Field(default=10, description="Default number of matches to return")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """グローバル設定を取得"""
    return settings
