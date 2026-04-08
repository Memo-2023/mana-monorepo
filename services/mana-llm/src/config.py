"""Configuration settings for mana-llm service."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Service
    port: int = 3025
    log_level: str = "info"

    # Ollama (Primary provider)
    ollama_url: str = "http://localhost:11434"
    ollama_default_model: str = "gemma3:4b"
    ollama_timeout: int = 120

    # OpenRouter (Cloud fallback)
    openrouter_api_key: str | None = None
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_default_model: str = "meta-llama/llama-3.1-8b-instruct"

    # Groq (Optional)
    groq_api_key: str | None = None
    groq_base_url: str = "https://api.groq.com/openai/v1"

    # Together (Optional)
    together_api_key: str | None = None
    together_base_url: str = "https://api.together.xyz/v1"

    # Google Gemini (Fallback provider)
    google_api_key: str | None = None
    google_default_model: str = "gemini-2.0-flash"

    # Auto-fallback: Ollama → Google when Ollama is overloaded/down
    auto_fallback_enabled: bool = True
    ollama_max_concurrent: int = 3

    # Caching (Optional)
    redis_url: str | None = None
    cache_ttl: int = 3600

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:5190,https://mana.how,https://playground.mana.how"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
