"""Ollama provider implementation."""

import json
import logging
from collections.abc import AsyncIterator
from typing import Any

import httpx

from src.config import settings
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


def _strip_json_fences(content: str) -> str:
    """Strip ```json ... ``` markdown fences from a string if present.

    Some Ollama vision models still wrap structured-output responses in
    a markdown code block even when `format` is set. Downstream parsers
    (Vercel AI SDK generateObject, manual JSON.parse) expect clean JSON,
    so we normalize the response here at the proxy boundary.
    """
    s = content.strip()
    if s.startswith("```"):
        # Drop the opening fence (```json or ``` plus any language tag)
        first_newline = s.find("\n")
        if first_newline != -1:
            s = s[first_newline + 1 :]
        # Drop the closing fence
        if s.endswith("```"):
            s = s[:-3]
        s = s.strip()
    return s


class OllamaProvider(LLMProvider):
    """Ollama LLM provider."""

    name = "ollama"

    def __init__(self, base_url: str | None = None, timeout: int | None = None):
        self.base_url = (base_url or settings.ollama_url).rstrip("/")
        self.timeout = timeout or settings.ollama_timeout
        self._client: httpx.AsyncClient | None = None

    @property
    def client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=httpx.Timeout(self.timeout),
            )
        return self._client

    def _convert_messages(self, request: ChatCompletionRequest) -> list[dict[str, Any]]:
        """Convert OpenAI message format to Ollama format."""
        messages = []
        for msg in request.messages:
            if isinstance(msg.content, str):
                messages.append({"role": msg.role, "content": msg.content})
            else:
                # Handle multimodal content (vision)
                text_parts = []
                images = []
                for part in msg.content:
                    if part.type == "text":
                        text_parts.append(part.text)
                    elif part.type == "image_url":
                        url = part.image_url.url
                        # Extract base64 data from data URL
                        if url.startswith("data:"):
                            # Format: data:image/png;base64,<base64_data>
                            base64_data = url.split(",", 1)[1] if "," in url else url
                            images.append(base64_data)
                        else:
                            # HTTP URL - Ollama expects base64, so we'd need to fetch
                            # For now, log warning and skip
                            logger.warning(f"HTTP image URLs not supported, skipping: {url[:50]}...")

                message_data: dict[str, Any] = {
                    "role": msg.role,
                    "content": " ".join(text_parts),
                }
                if images:
                    message_data["images"] = images
                messages.append(message_data)
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

        # Pass through structured-output requests to Ollama's native
        # `format` field. Ollama supports either `"json"` (free-form
        # JSON object) or a full JSON schema dict. The OpenAI-style
        # response_format the consumer sends maps as follows:
        #   - {"type": "json_object"}            → "json"
        #   - {"type": "json_schema", "json_schema": {"schema": {...}}}
        #     → the schema dict (Ollama 0.5+ supports full schemas)
        # Without this, Ollama wraps JSON in ```json ... ``` markdown
        # fences, which breaks downstream strict parsers like the AI SDK
        # generateObject() helper.
        if request.response_format is not None:
            rf = request.response_format
            if rf.type == "json_object":
                payload["format"] = "json"
            elif rf.type == "json_schema" and rf.json_schema is not None:
                # rf.json_schema is the OpenAI envelope:
                #   {"name": "...", "schema": {...}, "strict": true}
                # Ollama wants just the inner schema dict.
                inner = rf.json_schema.get("schema")
                payload["format"] = inner if inner is not None else "json"
            else:
                payload["format"] = "json"

        # Add optional parameters
        options: dict[str, Any] = {}
        if request.temperature is not None:
            options["temperature"] = request.temperature
        if request.top_p is not None:
            options["top_p"] = request.top_p
        if request.max_tokens is not None:
            options["num_predict"] = request.max_tokens
        if request.stop:
            options["stop"] = request.stop if isinstance(request.stop, list) else [request.stop]

        if options:
            payload["options"] = options

        logger.debug(f"Ollama request: {model}, messages: {len(request.messages)}")

        response = await self.client.post("/api/chat", json=payload)
        response.raise_for_status()
        data = response.json()

        # Defensive fence-stripping: even with `format` set, some older
        # Ollama versions still emit ```json ... ``` wrappers for vision
        # models. Strip them so strict downstream parsers see clean JSON.
        content = _strip_json_fences(data["message"]["content"])

        return ChatCompletionResponse(
            model=f"ollama/{model}",
            choices=[
                Choice(
                    message=MessageResponse(content=content),
                    finish_reason="stop" if data.get("done") else None,
                )
            ],
            usage=Usage(
                prompt_tokens=data.get("prompt_eval_count", 0),
                completion_tokens=data.get("eval_count", 0),
                total_tokens=data.get("prompt_eval_count", 0) + data.get("eval_count", 0),
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
        options: dict[str, Any] = {}
        if request.temperature is not None:
            options["temperature"] = request.temperature
        if request.top_p is not None:
            options["top_p"] = request.top_p
        if request.max_tokens is not None:
            options["num_predict"] = request.max_tokens
        if request.stop:
            options["stop"] = request.stop if isinstance(request.stop, list) else [request.stop]

        if options:
            payload["options"] = options

        logger.debug(f"Ollama streaming request: {model}")

        response_id = f"chatcmpl-{model[:8]}"
        first_chunk = True

        async with self.client.stream("POST", "/api/chat", json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line:
                    continue

                try:
                    data = json.loads(line)
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse Ollama response line: {line}")
                    continue

                # First chunk includes role
                if first_chunk:
                    yield ChatCompletionStreamResponse(
                        id=response_id,
                        model=f"ollama/{model}",
                        choices=[
                            StreamChoice(
                                delta=DeltaContent(role="assistant"),
                            )
                        ],
                    )
                    first_chunk = False

                # Content chunks
                content = data.get("message", {}).get("content", "")
                if content:
                    yield ChatCompletionStreamResponse(
                        id=response_id,
                        model=f"ollama/{model}",
                        choices=[
                            StreamChoice(
                                delta=DeltaContent(content=content),
                            )
                        ],
                    )

                # Final chunk with finish_reason
                if data.get("done"):
                    yield ChatCompletionStreamResponse(
                        id=response_id,
                        model=f"ollama/{model}",
                        choices=[
                            StreamChoice(
                                delta=DeltaContent(),
                                finish_reason="stop",
                            )
                        ],
                    )

    async def list_models(self) -> list[ModelInfo]:
        """List available Ollama models."""
        response = await self.client.get("/api/tags")
        response.raise_for_status()
        data = response.json()

        models = []
        for model_data in data.get("models", []):
            name = model_data.get("name", "")
            # Parse modified_at datetime string to Unix timestamp
            created = None
            if modified_at := model_data.get("modified_at"):
                try:
                    from datetime import datetime
                    # Handle ISO format with timezone
                    dt = datetime.fromisoformat(modified_at.replace("Z", "+00:00"))
                    created = int(dt.timestamp())
                except (ValueError, TypeError):
                    pass
            models.append(
                ModelInfo(
                    id=f"ollama/{name}",
                    owned_by="ollama",
                    created=created,
                )
            )
        return models

    async def embeddings(
        self,
        request: EmbeddingRequest,
        model: str,
    ) -> EmbeddingResponse:
        """Generate embeddings for input text."""
        inputs = request.input if isinstance(request.input, list) else [request.input]
        embeddings_data = []

        for i, text in enumerate(inputs):
            response = await self.client.post(
                "/api/embeddings",
                json={"model": model, "prompt": text},
            )
            response.raise_for_status()
            data = response.json()

            embeddings_data.append(
                EmbeddingData(
                    index=i,
                    embedding=data.get("embedding", []),
                )
            )

        return EmbeddingResponse(
            data=embeddings_data,
            model=f"ollama/{model}",
            usage=Usage(
                prompt_tokens=sum(len(text.split()) for text in inputs),  # Approximate
                total_tokens=sum(len(text.split()) for text in inputs),
            ),
        )

    async def health_check(self) -> dict[str, Any]:
        """Check Ollama health status."""
        try:
            response = await self.client.get("/api/tags")
            response.raise_for_status()
            data = response.json()
            model_count = len(data.get("models", []))
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
