"""Abstract base class for LLM providers."""

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from typing import Any

from src.models import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatCompletionStreamResponse,
    EmbeddingRequest,
    EmbeddingResponse,
    ModelInfo,
)


class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    name: str = "base"

    # Set to True if the provider supports OpenAI-style `tools` + `tool_calls`
    # for chat completions. The router rejects tool-bearing requests routed
    # to providers without support rather than silently dropping the tools.
    # Provider adapters may further narrow this per-model if needed.
    supports_tools: bool = False

    def model_supports_tools(self, model: str) -> bool:
        """Check if a specific model within this provider supports tools.

        Default: falls back to the provider-wide flag. Providers with a
        mixed capability surface (e.g. Ollama — depends on the local
        model) override this.
        """
        return self.supports_tools

    @abstractmethod
    async def chat_completion(
        self,
        request: ChatCompletionRequest,
        model: str,
    ) -> ChatCompletionResponse:
        """Generate a chat completion (non-streaming)."""
        ...

    @abstractmethod
    async def chat_completion_stream(
        self,
        request: ChatCompletionRequest,
        model: str,
    ) -> AsyncIterator[ChatCompletionStreamResponse]:
        """Generate a chat completion (streaming)."""
        ...

    @abstractmethod
    async def list_models(self) -> list[ModelInfo]:
        """List available models."""
        ...

    @abstractmethod
    async def embeddings(
        self,
        request: EmbeddingRequest,
        model: str,
    ) -> EmbeddingResponse:
        """Generate embeddings for input text."""
        ...

    @abstractmethod
    async def health_check(self) -> dict[str, Any]:
        """Check provider health status."""
        ...

    async def close(self) -> None:
        """Clean up resources."""
        pass
