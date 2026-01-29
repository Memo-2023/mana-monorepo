"""Provider routing logic for mana-llm."""

import logging
from collections.abc import AsyncIterator
from typing import Any

from src.config import settings
from src.models import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatCompletionStreamResponse,
    EmbeddingRequest,
    EmbeddingResponse,
    ModelInfo,
)

from .base import LLMProvider
from .ollama import OllamaProvider
from .openai_compat import OpenAICompatProvider

logger = logging.getLogger(__name__)


class ProviderRouter:
    """Routes requests to appropriate LLM providers based on model prefix."""

    def __init__(self):
        self.providers: dict[str, LLMProvider] = {}
        self._initialize_providers()

    def _initialize_providers(self) -> None:
        """Initialize available providers based on configuration."""
        # Ollama is always available (local)
        self.providers["ollama"] = OllamaProvider()
        logger.info(f"Initialized Ollama provider at {settings.ollama_url}")

        # OpenRouter (if API key configured)
        if settings.openrouter_api_key:
            self.providers["openrouter"] = OpenAICompatProvider(
                name="openrouter",
                base_url=settings.openrouter_base_url,
                api_key=settings.openrouter_api_key,
                default_model=settings.openrouter_default_model,
            )
            logger.info("Initialized OpenRouter provider")

        # Groq (if API key configured)
        if settings.groq_api_key:
            self.providers["groq"] = OpenAICompatProvider(
                name="groq",
                base_url=settings.groq_base_url,
                api_key=settings.groq_api_key,
            )
            logger.info("Initialized Groq provider")

        # Together (if API key configured)
        if settings.together_api_key:
            self.providers["together"] = OpenAICompatProvider(
                name="together",
                base_url=settings.together_base_url,
                api_key=settings.together_api_key,
            )
            logger.info("Initialized Together provider")

    def _parse_model(self, model: str) -> tuple[str, str]:
        """
        Parse model string into (provider, model_name).

        Format: "provider/model" or just "model" (defaults to ollama)
        """
        if "/" in model:
            parts = model.split("/", 1)
            provider = parts[0].lower()
            model_name = parts[1]
        else:
            # Default to Ollama
            provider = "ollama"
            model_name = model

        return provider, model_name

    def _get_provider(self, provider_name: str) -> LLMProvider:
        """Get provider by name, raise if not available."""
        if provider_name not in self.providers:
            available = list(self.providers.keys())
            raise ValueError(
                f"Provider '{provider_name}' not available. "
                f"Available providers: {available}"
            )
        return self.providers[provider_name]

    async def chat_completion(
        self,
        request: ChatCompletionRequest,
    ) -> ChatCompletionResponse:
        """Route chat completion request to appropriate provider."""
        provider_name, model_name = self._parse_model(request.model)
        provider = self._get_provider(provider_name)

        logger.info(f"Routing chat completion to {provider_name}/{model_name}")

        try:
            return await provider.chat_completion(request, model_name)
        except Exception as e:
            logger.error(f"Chat completion failed on {provider_name}: {e}")
            # Could implement fallback logic here
            raise

    async def chat_completion_stream(
        self,
        request: ChatCompletionRequest,
    ) -> AsyncIterator[ChatCompletionStreamResponse]:
        """Route streaming chat completion request to appropriate provider."""
        provider_name, model_name = self._parse_model(request.model)
        provider = self._get_provider(provider_name)

        logger.info(f"Routing streaming chat completion to {provider_name}/{model_name}")

        try:
            async for chunk in provider.chat_completion_stream(request, model_name):
                yield chunk
        except Exception as e:
            logger.error(f"Streaming chat completion failed on {provider_name}: {e}")
            raise

    async def embeddings(
        self,
        request: EmbeddingRequest,
    ) -> EmbeddingResponse:
        """Route embeddings request to appropriate provider."""
        provider_name, model_name = self._parse_model(request.model)
        provider = self._get_provider(provider_name)

        logger.info(f"Routing embeddings to {provider_name}/{model_name}")

        return await provider.embeddings(request, model_name)

    async def list_models(self) -> list[ModelInfo]:
        """List all available models from all providers."""
        all_models: list[ModelInfo] = []

        for provider in self.providers.values():
            try:
                models = await provider.list_models()
                all_models.extend(models)
            except Exception as e:
                logger.warning(f"Failed to list models from {provider.name}: {e}")

        return all_models

    async def get_model(self, model_id: str) -> ModelInfo | None:
        """Get specific model info."""
        provider_name, model_name = self._parse_model(model_id)

        if provider_name not in self.providers:
            return None

        provider = self.providers[provider_name]
        models = await provider.list_models()

        for model in models:
            if model.id == model_id or model.id.endswith(f"/{model_name}"):
                return model

        return None

    async def health_check(self) -> dict[str, Any]:
        """Check health of all providers."""
        results: dict[str, Any] = {}

        for name, provider in self.providers.items():
            results[name] = await provider.health_check()

        # Overall status
        all_healthy = all(r.get("status") == "healthy" for r in results.values())
        any_healthy = any(r.get("status") == "healthy" for r in results.values())

        return {
            "status": "healthy" if all_healthy else ("degraded" if any_healthy else "unhealthy"),
            "providers": results,
        }

    async def close(self) -> None:
        """Close all providers."""
        for provider in self.providers.values():
            await provider.close()
