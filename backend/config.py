from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-5-20250929"
    database_url: str = "sqlite+aiosqlite:///./data/launchlab.db"
    environment: str = "development"
    log_level: str = "DEBUG"
    cors_origins: str = "http://localhost:5173"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
