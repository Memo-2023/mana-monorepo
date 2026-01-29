"""OpenAI-compatible provider for OpenRouter, Groq, Together, etc."""

import json
import logging
from collections.abc import AsyncIterator
from typing import Any

import httpx

from src.models import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatCompletionStreamResponse,
    Choice,
    DeltaContent,
    EmbeddingData,
    EmbeddingRequest,
    EmbeddingResponse,
    MessageResponse,
    ModelInfo,
    StreamChoice,
    Usage,
)

from .base import LLMProvider

logger = logging.getLogger(__name__)


class OpenAICompatProvider(LLMProvider):
    """OpenAI-compatible API provider (OpenRouter, Groq, Together, etc.)."""

    def __init__(
        self,
        name: str,
        base_url: str,
        api_key: str,
        default_model: str | None = None,
        timeout: int = 120,
    ):
        self.name = name
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.default_model = default_model
        self.timeout = timeout
        self._client: httpx.AsyncClient | None = None

    @property
    def client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=httpx.Timeout(self.timeout),
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
            )
        return self._client

    def _convert_messages(self, request: ChatCompletionRequest) -> list[dict[str, Any]]:
        """Convert internal message format to OpenAI format."""
        messages = []
        for msg in request.messages:
            if isinstance(msg.content, str):
                messages.append({"role": msg.role, "content": msg.content})
            else:
                # Handle multimodal content
                content_parts = []
                for part in msg.content:
                    if part.type == "text":
                        content_parts.append({"type": "text", "text": part.text})
                    elif part.type == "image_url":
                        content_parts.append({
                            "type": "image_url",
                            "image_url": {"url": part.image_url.url},
                        })
                messages.append({"role": msg.role, "content": content_parts})
        return messages

    async def chat_completion(
        self,
        request: ChatCompletionRequest,
        model: str,
    ) -> ChatCompletionResponse:
        """Generate a chat completion (non-streaming)."""
        payload: dict[str, Any] = {
            "model": model,
            "messages": self._convert_messages(request),
            "stream": False,
        }

        # Add optional parameters
        if request.temperature is not None:
            payload["temperature"] = request.temperature
        if request.max_tokens is not None:
            payload["max_tokens"] = request.max_tokens
        if request.top_p is not None:
            payload["top_p"] = request.top_p
        if request.frequency_penalty is not None:
            payload["frequency_penalty"] = request.frequency_penalty
        if request.presence_penalty is not None:
            payload["presence_penalty"] = request.presence_penalty
        if request.stop:
            payload["stop"] = request.stop

        logger.debug(f"{self.name} request: {model}, messages: {len(request.messages)}")

        response = await self.client.post("/chat/completions", json=payload)
        response.raise_for_status()
        data = response.json()

        return ChatCompletionResponse(
            id=data.get("id", ""),
            model=f"{self.name}/{model}",
            choices=[
                Choice(
                    index=choice.get("index", 0),
                    message=MessageResponse(content=choice["message"]["content"]),
                    finish_reason=choice.get("finish_reason", "stop"),
                )
                for choice in data.get("choices", [])
            ],
            usage=Usage(
                prompt_tokens=data.get("usage", {}).get("prompt_tokens", 0),
                completion_tokens=data.get("usage", {}).get("completion_tokens", 0),
                total_tokens=data.get("usage", {}).get("total_tokens", 0),
            ),
        )

    async def chat_completion_stream(
        self,
        request: ChatCompletionRequest,
        model: str,
    ) -> AsyncIterator[ChatCompletionStreamResponse]:
        """Generate a chat completion (streaming)."""
        payload: dict[str, Any] = {
            "model": model,
            "messages": self._convert_messages(request),
            "stream": True,
        }

        # Add optional parameters
        if request.temperature is not None:
            payload["temperature"] = request.temperature
        if request.max_tokens is not None:
            payload["max_tokens"] = request.max_tokens
        if request.top_p is not None:
            payload["top_p"] = request.top_p
        if request.frequency_penalty is not None:
            payload["frequency_penalty"] = request.frequency_penalty
        if request.presence_penalty is not None:
            payload["presence_penalty"] = request.presence_penalty
        if request.stop:
            payload["stop"] = request.stop

        logger.debug(f"{self.name} streaming request: {model}")

        async with self.client.stream("POST", "/chat/completions", json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line or not line.startswith("data: "):
                    continue

                data_str = line[6:]  # Remove "data: " prefix

                if data_str == "[DONE]":
                    break

                try:
                    data = json.loads(data_str)
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse stream line: {data_str}")
                    continue

                choices = data.get("choices", [])
                if not choices:
                    continue

                choice = choices[0]
                delta = choice.get("delta", {})

                yield ChatCompletionStreamResponse(
                    id=data.get("id", ""),
                    model=f"{self.name}/{model}",
                    choices=[
                        StreamChoice(
                            index=choice.get("index", 0),
                            delta=DeltaContent(
                                role=delta.get("role"),
                                content=delta.get("content"),
                            ),
                            finish_reason=choice.get("finish_reason"),
                        )
                    ],
                )

    async def list_models(self) -> list[ModelInfo]:
        """List available models."""
        try:
            response = await self.client.get("/models")
            response.raise_for_status()
            data = response.json()

            models = []
            for model_data in data.get("data", []):
                model_id = model_data.get("id", "")
                models.append(
                    ModelInfo(
                        id=f"{self.name}/{model_id}",
                        owned_by=model_data.get("owned_by", self.name),
                    )
                )
            return models
        except httpx.HTTPError as e:
            logger.warning(f"Failed to list models from {self.name}: {e}")
            return []

    async def embeddings(
        self,
        request: EmbeddingRequest,
        model: str,
    ) -> EmbeddingResponse:
        """Generate embeddings for input text."""
        payload = {
            "model": model,
            "input": request.input,
        }

        response = await self.client.post("/embeddings", json=payload)
        response.raise_for_status()
        data = response.json()

        return EmbeddingResponse(
            data=[
                EmbeddingData(
                    index=item.get("index", i),
                    embedding=item.get("embedding", []),
                )
                for i, item in enumerate(data.get("data", []))
            ],
            model=f"{self.name}/{model}",
            usage=Usage(
                prompt_tokens=data.get("usage", {}).get("prompt_tokens", 0),
                total_tokens=data.get("usage", {}).get("total_tokens", 0),
            ),
        )

    async def health_check(self) -> dict[str, Any]:
        """Check provider health status."""
        try:
            response = await self.client.get("/models")
            response.raise_for_status()
            data = response.json()
            model_count = len(data.get("data", []))
            return {
                "status": "healthy",
                "provider": self.name,
                "url": self.base_url,
                "models_available": model_count,
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "provider": self.name,
                "url": self.base_url,
                "error": str(e),
            }

    async def close(self) -> None:
        """Close HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
