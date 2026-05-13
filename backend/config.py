from pydantic_settings import BaseSettings
from functools import lru_cache
from urllib.parse import quote_plus
import os


class Settings(BaseSettings):
    # Database (MariaDB)
    db_host: str = "localhost"
    db_port: int = 3306
    db_user: str = "root"
    db_password: str = ""
    db_name: str = "tarot"
    database_url: str = ""  # If set, overrides individual db_* fields

    # Redis (split fields so passwords with @ work correctly)
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = ""
    redis_db: int = 0
    redis_url: str = ""  # If set, overrides individual redis_* fields

    @property
    def redis_connection_url(self) -> str:
        """Build Redis URL with proper URL-encoding for special chars in password."""
        if self.redis_url:
            return self.redis_url
        if self.redis_password:
            return f"redis://:{quote_plus(self.redis_password)}@{self.redis_host}:{self.redis_port}/{self.redis_db}"
        return f"redis://{self.redis_host}:{self.redis_port}/{self.redis_db}"

    @property
    def db_connection_url(self) -> str:
        """Build DB URL with proper URL-encoding for special chars in password."""
        if self.database_url:
            return self.database_url
        pwd = quote_plus(self.db_password) if self.db_password else ""
        return (
            f"mysql+pymysql://{self.db_user}:{pwd}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}?charset=utf8mb4"
        )

    # JWT
    jwt_secret: str = "tarot-jwt-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours

    # Email (dev mode: print to console; prod: SMTP)
    email_mode: str = "console"  # "console" | "smtp"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@tarot-app.com"
    smtp_from_name: str = "命运之镜 · Mirror of Fate"

    # Quota
    daily_base_quota: int = 2
    checkin_min_bonus: int = 2
    checkin_max_bonus: int = 10
    admin_quota: int = 999
    member_basic_quota: int = 10
    member_premium_quota: int = 999

    # DeepSeek
    deepseek_api_key: str = ""

    # Encryption key for AI config delivery
    encryption_key: str = ""

    # CORS
    cors_origins: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
